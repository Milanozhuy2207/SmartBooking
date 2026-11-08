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
        const difftime = Math.abs(checkOut - checkIn);
        const nights = Math.max(1, Math.ceil(difftime / (1000 * 60 * 60 * 24)));

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: "Invalid room Id" });
        }

        const unavailable = await RoomAvailability.findOne({
            room_id: roomId,
            date: { $gte: checkIn, $lt: checkOut },
            $expr: { $gte: ["$booked_count", "$total_inventory"] }
        });
        if (unavailable) {
            return res.status(404).json({ success: false, message: "Room is not available for these dates" });
        }

        const booking = new Booking({
            room_id: roomId,
            user_id: req.userId || null,
            customer_name: customerName,
            phone_number: phoneNumber,
            total_price: room.price_per_night * nights,
            status: "PENDING",
            check_in: checkIn,
            check_out: checkOut,
        });

        await booking.save();

        await RoomAvailability.updateMany(
            { room_id: roomId, date: { $gte: checkIn, $lt: checkOut } },
            { $inc: { held_count: -1, booked_count: 1 } }
        );

        res.status(200).json({ success: true, message: 'Booking success!' });
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

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const previousStatus = booking.status;
        booking.status = status;
        await booking.save();

        if (status === 'CANCELLED' && previousStatus !== 'CANCELLED' && booking.check_in && booking.check_out) {
            await RoomAvailability.updateMany(
                { room_id: booking.room_id, date: { $gte: booking.check_in, $lt: booking.check_out } },
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
                { room_id: booking.room_id, date: { $gte: booking.check_in, $lt: booking.check_out } },
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
                select: 'room_number type price_per_night hotel_id',
                populate: { path: 'hotel_id', select: 'name location' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, message: "Tra cứu thành công", data: booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
