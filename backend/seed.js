const mongoose = require('mongoose');
const Room = require('./src/models/Room');

mongoose.connect('mongodb://localhost:27017/smartbooking')
    .then(async () => {
        await Room.deleteMany({});
        await Room.create([
            { room_number: '101', type: 'STANDARD', price_per_night: 500000 },
            { room_number: '102', type: 'DELUXE', price_per_night: 800000 },
            { room_number: '201', type: 'VIP', price_per_night: 1500000 }
        ]);
        console.log('Seeded 3 rooms!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
