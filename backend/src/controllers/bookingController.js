const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomAvailability = require('../models/RoomAvailability');

exports.createBooking = async (req, res) => {
    try {
        const { roomId, customerName, phoneNumber, checkInDate, checkOutDate } = req.body;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const difftime = Math.abs(checkOut - checkIn);
        const nights = Math.ceil(difftime / (1000 * 60 * 60 * 24));

        const room = await Room.findById(roomId)
        if (!room) {
            res.status(500).json({ success: false, message: "Invalid room Id" })
            return
        }

        const unavailable = await RoomAvailability.findOne({
            room_id: roomId,
            date: { $gte: checkIn, $lt: checkOut },
            $expr: { $gte: ["$booked_count", "$total_inventory"] }
        })
        if (unavailable) {
            return res.status(404).json({ success: false, message: "Room is not available for these dates" })
        }

        const booking = new Booking({
            room_id: roomId,
            user_id: req.userId,
            customer_name: customerName,
            phone_number: phoneNumber,
            total_price: room.price_per_night * nights,
            status: "PENDING",
            check_in: checkIn,
            check_out: checkOut,
        })

        await booking.save()

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
        const data = await Booking.find({ user_id: req.userId }).populate('room_id', 'room_number type price_per_night')

        return res.status(200).json({ success: true, data })
    } catch (error) {
        return res.status(500).json({ message: "Error when get my booking" + error.message })
    }

}

exports.getAllBookings = async (req, res) => {
    try {
        const data = await Booking.find().populate('room_id', 'room_number').populate('user_id', 'name')
        return res.status(200).json({ success: true, data })
    } catch (err) {
        return res.status(500).json({ message: "Error when get all bookings:" + err.message })
    }
}

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.status = status;
        await booking.save();

        // If the booking is cancelled, unlock the room so others can book it
        if (status === 'CANCELLED') {
            const RoomAvailability = require('../models/RoomAvailability');
            await RoomAvailability.updateMany(
                { room_id: booking.room_id, date: { $gte: booking.check_in, $lt: booking.check_out } },
                { $inc: { booked_count: -1 } }
            );
        }

        return res.status(200).json({ success: true, message: "Booking status updated" });
    } catch (err) {
        return res.status(500).json({ message: "Error when updating booking status: " + err.message })
    }
}