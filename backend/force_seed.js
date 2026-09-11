
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Room = require('./src/models/Room');

mongoose.connect('mongodb://127.0.0.1:27017/smartbooking')
    .then(async () => {
        console.log('Connecting...');
        const hash = await bcrypt.hash('123456', 10);
        await User.findOneAndUpdate(
            { email: 'namkh@vnpt.vn' },
            { 
                email: 'namkh@vnpt.vn', 
                phone_number: '0987654321', 
                password_hash: hash, 
                role: 'CUSTOMER', 
                status: 'ACTIVE' 
            },
            { upsert: true, new: true }
        );
        console.log('User OK');

        await Room.deleteMany({});
        await Room.insertMany([
            { room_number: '101', type: 'STANDARD', price_per_night: 500000, is_locked: false },
            { room_number: '102', type: 'DELUXE', price_per_night: 1200000, is_locked: false },
            { room_number: '201', type: 'VIP', price_per_night: 2500000, is_locked: false }
        ]);
        console.log('Rooms OK');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });

