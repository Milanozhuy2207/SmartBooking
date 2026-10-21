const mongoose = require('mongoose');

const RoomAvailabilitySchema = new mongoose.Schema({
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: Date, required: true }, // Lưu chuẩn UTC (00:00:00Z)
    price: { type: Number, required: true }, // Giá bán của ngày hôm đó (có thể biến động)
    total_inventory: { type: Number, required: true, default: 1 }, // Số lượng phòng trống ban đầu
    booked_count: { type: Number, default: 0 }, // Số phòng ĐÃ ĐẶT (đã checkout thành công)
    held_count: { type: Number, default: 0 } // Số phòng ĐANG BỊ KHÓA TẠM THỜI (Socket.io hold)
}, { timestamps: true });

// Compound index để query nhanh theo phòng và khoảng thời gian (rất quan trọng cho Core Engine)
RoomAvailabilitySchema.index({ room_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('RoomAvailability', RoomAvailabilitySchema);
