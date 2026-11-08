const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const RoomAvailability = require('../models/RoomAvailability');

exports.getHotels = async (req, res) => {
    try {
        const { location } = req.query;

        const filter = location ? {
            location: new RegExp(location, 'i')
        } : {};

        const hotels = await Hotel.find(filter).lean();
        const hotelIds = hotels.map(h => h._id);
        const allRooms = await Room.find({ hotel_id: { $in: hotelIds } }).sort({ price_per_night: 1 }).lean();

        const hotelsWithRooms = hotels.map(h => ({
            ...h,
            rooms: allRooms.filter(r => r.hotel_id.toString() === h._id.toString())
        }));

        res.status(200).json({ success: true, data: hotelsWithRooms });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, error: error.message });
    }
};

exports.getRoomsByHotel = async (req, res) => {
    try {
        const hotelId = req.params.hotelId;
        const { check_in, check_out } = req.query;

        let rooms = await Room.find({ hotel_id: hotelId }).sort({ room_number: 1 }).lean();

        if (!rooms || rooms.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        if (check_in && check_out) {
            const checkInDate = new Date(check_in);
            const checkOutDate = new Date(check_out);

            const unavailableRecords = await RoomAvailability.find({
                room_id: { $in: rooms.map(r => r._id) },
                date: { $gte: checkInDate, $lt: checkOutDate },
                $expr: { $lte: [{ $subtract: ["$total_inventory", { $add: ["$booked_count", "$held_count"] }] }, 0] }
            });

            const unavailableRoomIds = unavailableRecords.map(ua => ua.room_id.toString());
            rooms = rooms.filter(r => !unavailableRoomIds.includes(r._id.toString()));
        }

        res.status(200).json({ success: true, data: rooms });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createHotel = async (req, res) => {
    try {
        const { name, location, star_rating, description, image_url } = req.body;

        if (!name || !location) {
            return res.status(400).json({ success: false, message: "name and location are required" });
        }

        const hotel = await Hotel.create({
            name,
            location,
            star_rating,
            description,
            image_url,
            vendor_id: req.userId
        });

        return res.status(201).json({ success: true, data: hotel });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { room_number, type, price_per_night } = req.body;

        const hotel_id = req.params.hotelId;

        const hotel = await Hotel.findById(hotel_id);

        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        if (req.role === 'VENDOR' && hotel.vendor_id?.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized to add room to this hotel' })
        }



        if (!room_number || !type || !price_per_night) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const defaultRoomImages = {
            STANDARD: '/rooms/luxury-room-1.jpg',
            DELUXE: '/rooms/luxury-room-10.jpg',
            VIP: '/rooms/luxury-room-22.jpg'
        };
        const defaultDescriptions = {
            STANDARD: 'Phòng nghỉ tiêu chuẩn 5 sao với thiết kế tinh tế, trang bị đầy đủ tiện nghi cao cấp và tầm nhìn thoáng đãng.',
            DELUXE: 'Không gian nghỉ dưỡng Deluxe rộng rãi với ban công riêng, nội thất sang trọng và bồn tắm cẩm thạch.',
            VIP: 'Presidential / VIP Suite xa hoa bậc nhất với phòng khách riêng biệt, tầm nhìn toàn cảnh và đặc quyền quản gia 24/7.'
        };

        const room = await Room.create({
            hotel_id: hotel_id,
            image_url: req.body.image_url || defaultRoomImages[type] || '/rooms/luxury-room-1.jpg',
            description: req.body.description || defaultDescriptions[type] || defaultDescriptions.STANDARD,
            ...req.body
        });

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const availabilityRecords = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setUTCDate(today.getUTCDate() + i);
            availabilityRecords.push({
                room_id: room._id,
                date: date,
                price: room.price_per_night,
                total_inventory: 1,
                booked_count: 0,
                held_count: 0
            });
        }
        await RoomAvailability.insertMany(availabilityRecords);

        return res.status(201).json({ success: true, message: "Room created successfully", data: room });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLocations = async (req, res) => {
    try {
        const locations = await Hotel.distinct('location');
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

exports.getMyHotels = async (req, res) => {
    try {
        let hotels = [];
        if (req.role === 'ADMIN' || req.role === 'RECEPTIONIST') {
            hotels = await Hotel.find().lean();
        } else if (req.role === 'VENDOR') {
            hotels = await Hotel.find({ vendor_id: req.userId }).lean();
        }
        const hotelIds = hotels.map(h => h._id);
        const allRooms = await Room.find({ hotel_id: { $in: hotelIds } }).sort({ price_per_night: 1 }).lean();
        const hotelsWithRooms = hotels.map(h => ({
            ...h,
            rooms: allRooms.filter(r => r.hotel_id.toString() === h._id.toString())
        }));
        return res.status(200).json({ success: true, data: hotelsWithRooms });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};