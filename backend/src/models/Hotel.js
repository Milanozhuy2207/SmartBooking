const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    star_rating: { type: Number, default: 5 },
    image_url: { type: String, required: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
