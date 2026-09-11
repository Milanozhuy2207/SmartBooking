const Booking = require('../models/Booking');
const Room = require('../models/Room');

exports.createBooking = async (req, res) => {
    try {
        const { roomId, customerName, phoneNumber } = req.body;

        const room = await Room.findById(roomId)
        if (!room) {
            res.status(500).json({ success: false, message: "Invalid room Id" })
            return
        }

        const booking = new Booking({
            room_id: roomId,
            user_id: req.userId,
            customer_name: customerName,
            phone_number: phoneNumber,
            total_price: room.price_per_night,
            status: "PENDING",
        })

        await booking.save()

        await Room.findByIdAndUpdate(roomId, {
            is_locked: true,
            locked_by_user: req.userId,
            locked_until: new Date(Date.now() + 5 * 60 * 1000)
        })


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