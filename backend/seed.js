const mongoose = require('mongoose');
const Hotel = require('./src/models/Hotel');
const Room = require('./src/models/Room');

const hotelsData = [
  {
    name: "Vinpearl Resort & Spa",
    location: "Hải Phòng",
    star_rating: 5,
    image_url: "https://images.unsplash.com/photo-1582719478250-c894e4dc240e?auto=format&fit=crop&w=800&q=80",
    description: "Khu nghỉ dưỡng 5 sao bậc nhất tại Đảo Vũ Yên, Hải Phòng."
  },
  {
    name: "InterContinental Danang",
    location: "Đà Nẵng",
    star_rating: 5,
    image_url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    description: "Khu nghỉ dưỡng sang trọng trên bán đảo Sơn Trà."
  },
  {
    name: "JW Marriott Phu Quoc",
    location: "Phú Quốc",
    star_rating: 5,
    image_url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    description: "Trải nghiệm đẳng cấp hoàng gia bên Bãi Khem."
  }
];

mongoose.connect('mongodb://127.0.0.1:27017/smartbooking')
  .then(async () => {
    console.log('Connected to MongoDB. Clearing old data...');
    await Hotel.deleteMany({});
    await Room.deleteMany({}); // Delete old rooms because they don't have hotel_id

    for (let data of hotelsData) {
      const hotel = await Hotel.create(data);
      console.log(`Created hotel: ${hotel.name}`);
      
      // Create 3 rooms for each hotel
      const rooms = [
        { hotel_id: hotel._id, room_number: `${hotel.name.charAt(0)}101`, type: 'STANDARD', price_per_night: 500000 },
        { hotel_id: hotel._id, room_number: `${hotel.name.charAt(0)}102`, type: 'DELUXE', price_per_night: 1200000 },
        { hotel_id: hotel._id, room_number: `${hotel.name.charAt(0)}201`, type: 'VIP', price_per_night: 3500000 }
      ];
      await Room.insertMany(rooms);
    }

    console.log('Seed data successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
