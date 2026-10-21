const mongoose = require('mongoose');
const Room = require('./src/models/Room');
const RoomAvailability = require('./src/models/RoomAvailability');
require('dotenv').config();

async function seedAvailability() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartbooking');
    console.log('Connected to DB');

    const rooms = await Room.find({});
    console.log('Found ' + rooms.length + ' rooms');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const room of rooms) {
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setUTCDate(today.getUTCDate() + i);

            await RoomAvailability.findOneAndUpdate(
                { room_id: room._id, date: date },
                {
                    price: room.price_per_night,
                    total_inventory: 1,
                    booked_count: 0,
                    held_count: 0
                },
                { upsert: true, new: true }
            );
        }
    }
    console.log('Successfully seeded 30 days of availability for all rooms!');
    process.exit(0);
}

seedAvailability().catch(console.error);
