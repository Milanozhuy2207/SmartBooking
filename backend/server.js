require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');


const authRoutes = require('./src/routes/authRoutes')
const roomRoutes = require('./src/routes/roomRoutes')
const bookingRoutes = require('./src/routes/bookingRoutes')
const hotelRoutes = require('./src/routes/hotelRoutes');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

//API routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/hotels', hotelRoutes);
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartbooking')
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', credentials: true }
});

io.on('connection', (socket) => {

    console.log(`User connected: ${socket.id}`);

    socket.on('request_lock_room', async (roomId) => {
        try {
            const Room = require('./src/models/Room')
            const room = await Room.findById(roomId)

            if (!room) {
                return
            }
            if (room.is_locked) {
                socket.emit('lock_room_response', { success: false, message: 'Room is locked' })
                return
            }

            room.is_locked = true
            room.locked_until = new Date(Date.now() + 10 * 60000)
            await room.save()

            io.emit('room_locked_broadcast', {
                roomId: room._id,
                lockedUntil: room.locked_until
            })

            socket.emit('lock_room_response', { success: true })

        } catch (error) {
            console.error('Failed to lock room:', error)
            socket.emit('lock_room_response', { success: false, message: 'Internal server error' })
        }
    })


    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('join_room', (data) => {
        const { room_id, user_id } = data
        socket.join(room_id)
        console.log(`User ${user_id} joined room ${room_id}`)
    })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SmartBooking Backend running on port ${PORT}`);
});
