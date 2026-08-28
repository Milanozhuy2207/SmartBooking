const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    room_number: { type: String, required: true, unique: true },
    type: { type: String, enum: ['STANDARD', 'DELUXE', 'VIP'], default: 'STANDARD' },
    price_per_night: { type: Number, required: true },

    is_locked: { type: Boolean, default: false },
    locked_by_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    locked_until: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
