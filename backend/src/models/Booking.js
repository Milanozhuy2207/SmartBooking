const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    customer_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    total_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
        default: 'PENDING'
    }, check_in: { type: Date, required: true },
    check_out: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);