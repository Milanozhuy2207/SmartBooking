require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');


const authRoutes = require('./src/routes/authRoutes')
const roomRoutes = require('./src/routes/roomRoutes')

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartbooking')
    .then(() => console.log('Da ket noi MongoDB thanh cong!'))
    .catch(err => console.error('Loi ket noi DB:', err));

const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', credentials: true }
});

io.on('connection', (socket) => {
    console.log(`Khach moi truy cap: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Khach da thoat: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SmartBooking Backend running on port ${PORT}`);
});
