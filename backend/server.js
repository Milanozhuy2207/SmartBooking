require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const authRoutes = require('./src/routes/authRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const hotelRoutes = require('./src/routes/hotelRoutes');
const RoomAvailability = require('./src/models/RoomAvailability');
const Room = require('./src/models/Room');

const app = express();
const server = http.createServer(app);
const holds = new Map();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hotels', hotelRoutes);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartbooking')
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', credentials: true }
});

const releaseRoom = async (key) => {
    const hold = holds.get(key);
    if (!hold) return;

    clearTimeout(hold.timeoutId);
    holds.delete(key);

    await RoomAvailability.updateMany(
        { room_id: hold.roomId, date: { $gte: hold.checkInDate, $lt: hold.checkOutDate } },
        { $inc: { held_count: -1 } }
    );

    io.emit('room_unlocked_broadcast', { roomId: hold.roomId });
};

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('request_lock_room', async (data) => {
        try {
            const { roomId, checkIn, checkOut } = data;

            const room = await Room.findById(roomId);
            if (!room) return;

            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            const unavailable = await RoomAvailability.findOne({
                room_id: roomId,
                date: { $gte: checkInDate, $lt: checkOutDate },
                $expr: { $lte: [{ $subtract: ["$total_inventory", { $add: ["$booked_count", "$held_count"] }] }, 0] }
            });

            if (unavailable) {
                socket.emit('lock_room_response', { success: false, message: 'Room is no longer available for these dates' });
                return;
            }

            await RoomAvailability.updateMany(
                { room_id: roomId, date: { $gte: checkInDate, $lt: checkOutDate } },
                { $inc: { held_count: 1 } }
            );

            // Lưu timeout vào Map để có thể hủy khi thanh toán hoặc ngắt kết nối
            const key = socket.id + roomId;
            holds.set(key, {
                timeoutId: setTimeout(() => releaseRoom(key), 5 * 60000),
                roomId,
                checkInDate,
                checkOutDate
            });

            io.emit('room_locked_broadcast', {
                roomId: room._id,
                lockedUntil: new Date(Date.now() + 5 * 60000)
            });

            socket.emit('lock_room_response', { success: true });

        } catch (error) {
            console.error('Failed to lock room:', error);
            socket.emit('lock_room_response', { success: false, message: 'Internal server error' });
        }
    });

    // Khi khách đóng tab / ngắt kết nối -> nhả phòng ngay lập tức
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const key of holds.keys()) {
            if (key.startsWith(socket.id)) {
                releaseRoom(key);
            }
        }
    });

    // Khi khách thanh toán thành công -> hủy timeout đếm ngược
    socket.on('booking_done', ({ roomId }) => {
        const key = socket.id + roomId;
        const hold = holds.get(key);
        if (hold) {
            clearTimeout(hold.timeoutId);
            holds.delete(key);
        }
    });

    socket.on('join_room', (data) => {
        const { room_id, user_id } = data;
        socket.join(room_id);
        console.log(`User ${user_id} joined room ${room_id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SmartBooking Backend running on port ${PORT}`);
});
