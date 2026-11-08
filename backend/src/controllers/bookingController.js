const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const RoomAvailability = require('../models/RoomAvailability');
const CustomerProfile = require('../models/CustomerProfile');

exports.createBooking = async (req, res) => {
    try {
        const { roomId, customerName, phoneNumber, checkInDate, checkOutDate } = req.body;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        if (isNaN(checkIn) || isNaN(checkOut) || checkOut <= checkIn) {
            return res.status(400).json({ success: false, message: "Ngày nhận/trả phòng không hợp lệ" });
        }
        const difftime = checkOut - checkIn;
        const nights = Math.max(1, Math.ceil(difftime / (1000 * 60 * 60 * 24)));

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Invalid room Id" });
        }

        // Giữ chỗ NGUYÊN TỬ từng đêm: điều kiện "còn phòng" nằm ngay trong filter của
        // findOneAndUpdate nên 2 request đồng thời không thể cùng giành 1 chỗ cuối cùng.
        // held_count của chính khách (đã lock qua socket) được chuyển thành booked_count;
        // dùng $max để held_count không bao giờ bị âm khi đặt qua REST không lock.
        const nightDocs = await RoomAvailability.find({
            room_id: roomId,
            date: { $gte: checkIn, $lt: checkOut }
        }).select('_id');

        const reserved = []; // { _id, hadHold } để rollback nếu có đêm hết phòng
        let soldOut = false;
        for (const doc of nightDocs) {
            const before = await RoomAvailability.findOneAndUpdate(
                { _id: doc._id, $expr: { $lt: ["$booked_count", "$total_inventory"] } },
                [{
                    $set: {
                        booked_count: { $add: ["$booked_count", 1] },
                        held_count: { $max: [0, { $subtract: ["$held_count", 1] }] }
                    }
                }],
                { new: false, updatePipeline: true }
            );
            if (!before) {
                soldOut = true;
                break;
            }
            reserved.push({ _id: doc._id, hadHold: before.held_count > 0 });
        }

        const rollbackReserved = () => Promise.all(reserved.map(r =>
            RoomAvailability.updateOne(
                { _id: r._id },
                { $inc: { booked_count: -1, held_count: r.hadHold ? 1 : 0 } }
            )
        ));

        if (soldOut) {
            await rollbackReserved();
            return res.status(409).json({ success: false, message: "Room is not available for these dates" });
        }

        const totalPrice = room.price_per_night * nights;
        const booking = new Booking({
            room_id: roomId,
            user_id: req.userId || null,
            customer_name: customerName,
            phone_number: phoneNumber,
            total_price: totalPrice,
            payment_type: 'UNPAID',
            paid_amount: 0,
            remaining_amount: totalPrice,
            status: "PENDING",
            check_in: checkIn,
            check_out: checkOut,
        });

        try {
            await booking.save();
        } catch (saveError) {
            await rollbackReserved();
            throw saveError;
        }

        res.status(200).json({ success: true, message: 'Booking success!', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const data = await Booking.find({ user_id: req.userId })
            .populate({
                path: 'room_id',
                select: 'room_number type price_per_night hotel_id',
                populate: { path: 'hotel_id', select: 'name location' }
            })
            .sort({ createdAt: -1 });
        const profile = await CustomerProfile.findOne({ user_id: req.userId });
        const points = profile ? profile.reward_points : 0;
        return res.status(200).json({
            success: true,
            data,
            reward_point: points,
            reward_points: points
        });
    } catch (error) {
        return res.status(500).json({ message: "Error when get my booking: " + error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        let filter = {};
        if (req.role === 'VENDOR') {
            const myHotels = await Hotel.find({ vendor_id: req.userId }).select('_id');
            const myRooms = await Room.find({ hotel_id: { $in: myHotels.map(h => h._id) } }).select('_id');
            filter = { room_id: { $in: myRooms.map(r => r._id) } };
        }

        const data = await Booking.find(filter)
            .populate({
                path: 'room_id',
                select: 'room_number type price_per_night hotel_id',
                populate: { path: 'hotel_id', select: 'name location' }
            })
            .populate('user_id', 'email phone_number')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data });
    } catch (err) {
        return res.status(500).json({ message: "Error when get all bookings: " + err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        const allowedStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Chống IDOR: Vendor chỉ được xử lý đơn thuộc khách sạn của mình
        if (req.role === 'VENDOR') {
            const room = await Room.findById(booking.room_id).select('hotel_id');
            const ownsHotel = room && await Hotel.exists({ _id: room.hotel_id, vendor_id: req.userId });
            if (!ownsHotel) {
                return res.status(403).json({ success: false, message: "Bạn không có quyền xử lý đơn này" });
            }
        }

        const previousStatus = booking.status;
        booking.status = status;
        if (status === 'CHECKED_OUT') {
            booking.payment_type = 'FULL';
            booking.paid_amount = booking.total_price;
            booking.remaining_amount = 0;
        }
        await booking.save();

        if (status === 'CANCELLED' && previousStatus !== 'CANCELLED' && booking.check_in && booking.check_out) {
            await RoomAvailability.updateMany(
                { room_id: booking.room_id, date: { $gte: booking.check_in, $lt: booking.check_out }, booked_count: { $gt: 0 } },
                { $inc: { booked_count: -1 } }
            );
        }

        if (status === "CONFIRMED" && previousStatus !== "CONFIRMED" && booking.user_id) {
            const pointsEarned = Math.floor(booking.total_price / 10000);
            await CustomerProfile.findOneAndUpdate(
                { user_id: booking.user_id },
                {
                    $inc: { reward_points: pointsEarned },
                    $setOnInsert: { full_name: booking.customer_name || 'Khách hàng' }
                },
                { upsert: true }
            );
        }

        return res.status(200).json({ success: true, message: "Booking status updated" });
    } catch (err) {
        return res.status(500).json({ message: "Error when updating booking status: " + err.message });
    }
};

exports.cancelMyBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findOne({ _id: bookingId, user_id: req.userId });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
        }

        if (booking.status !== "PENDING") {
            return res.status(400).json({ success: false, message: "Chỉ có thể hủy đơn đặt phòng đang ở trạng thái chờ xử lý" });
        }
        booking.status = "CANCELLED";
        await booking.save();

        if (booking.check_in && booking.check_out) {
            await RoomAvailability.updateMany(
                { room_id: booking.room_id, date: { $gte: booking.check_in, $lt: booking.check_out }, booked_count: { $gt: 0 } },
                { $inc: { booked_count: -1 } }
            );
        }
        return res.status(200).json({ success: true, message: "Đã hủy phòng thành công" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi khi hủy phòng: " + error.message });
    }
};

exports.lookupGuestBooking = async (req, res) => {
    try {
        const { phoneNumber } = req.query;

        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: "Bạn cần điền số điện thoại" });
        }

        const booking = await Booking.find({ phone_number: phoneNumber })
            .populate({
                path: 'room_id',
                select: 'room_number name type price_per_night hotel_id',
                populate: { path: 'hotel_id', select: 'name location' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, message: "Tra cứu thành công", data: booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// LƯU Ý: Đây là luồng xác nhận thủ công phục vụ demo. Bản production cần để cổng thanh toán
// (PayOS/SePay/VNPAY) gọi webhook, xác thực chữ ký HMAC và chống xử lý trùng bằng transaction_id unique.
exports.confirmVietQRPayment = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { paymentType } = req.body || {};
        const isDeposit = paymentType === 'DEPOSIT';

        const existing = await Booking.findById(bookingId);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt phòng' });
        }
        if (existing.status === 'CANCELLED' || existing.status === 'CHECKED_OUT') {
            return res.status(409).json({ success: false, message: 'Đơn đã hủy hoặc đã trả phòng, không thể thanh toán' });
        }

        const paidAmount = isDeposit ? Math.round(existing.total_price * 0.3) : existing.total_price;

        // Chuyển trạng thái NGUYÊN TỬ PENDING -> CONFIRMED: chỉ 1 request thắng,
        // nên điểm thưởng không bị cộng trùng và không ghi đè đơn đã thanh toán.
        const booking = await Booking.findOneAndUpdate(
            { _id: bookingId, status: 'PENDING' },
            {
                $set: {
                    status: 'CONFIRMED',
                    payment_type: isDeposit ? 'DEPOSIT' : 'FULL',
                    paid_amount: paidAmount,
                    remaining_amount: Math.max(0, existing.total_price - paidAmount)
                }
            },
            { new: true }
        );

        if (!booking) {
            // Đơn đã được xác nhận trước đó: trả về trạng thái hiện tại (idempotent)
            return res.status(200).json({
                success: true,
                message: 'Đơn đặt phòng đã được thanh toán trước đó.',
                data: existing
            });
        }

        if (booking.user_id) {
            const pointsEarned = Math.floor(booking.total_price / 10000);
            await CustomerProfile.findOneAndUpdate(
                { user_id: booking.user_id },
                {
                    $inc: { reward_points: pointsEarned },
                    $setOnInsert: { full_name: booking.customer_name || 'Khách hàng' }
                },
                { upsert: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: isDeposit
                ? 'Đã nhận tiền cọc 30% thành công! Đơn đặt phòng đã được giữ chỗ & xác nhận.'
                : 'Thanh toán 100% qua VietQR thành công! Đơn đặt phòng đã được xác nhận.',
            data: booking
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
