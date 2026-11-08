const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    hotel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room_number: { type: String, required: true },
    name: { type: String, default: '' },
    type: { type: String, enum: ['STANDARD', 'DELUXE', 'VIP'], default: 'STANDARD' },
    price_per_night: { type: Number, required: true },
    image_url: { type: String, default: '' },
    description: { type: String, default: '' },
    area: { type: String, default: '48m²' },
    bed_type: { type: String, default: '1 Giường King' },
    max_guests: { type: Number, default: 2 },
    view: { type: String, default: 'Hướng toàn cảnh' }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
