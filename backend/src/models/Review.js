const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customer_name: { type: String, required: true },
    room_name: { type: String, default: 'Hạng Deluxe / Suite' },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
