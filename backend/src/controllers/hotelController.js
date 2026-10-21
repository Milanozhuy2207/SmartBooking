const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const axios = require('axios')
const RoomAvailability = require('../models/RoomAvailability');

exports.getHotels = async (req, res) => {
    try {
        const { location } = req.query

        const filter = location ? {
            location: new RegExp(location, 'i')
        } : {}

        const hotels = await Hotel.find(filter)

        res.status(200).json({ success: true, data: hotels })

    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, error: error.message })
    }
}

exports.getRoomsByHotel = async (req, res) => {
    try {
        const hotelId = req.params.hotelId;
        const { check_in, check_out } = req.query;

        let rooms = await Room.find({ hotel_id: hotelId }).lean();

        if (!rooms || rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Rooms not found' });
        }

        if (check_in && check_out) {
            const checkInDate = new Date(check_in);
            const checkOutDate = new Date(check_out);
            const RoomAvailability = require('../models/RoomAvailability');

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
}

exports.createHotel = async (req, res) => {
    try {
        const { name, location, star_rating, description, image_url } = req.body

        if (!name || !location) {
            return res.status(400).json({ success: false, message: "name and location are required" })
        }

        const hotel = await Hotel.create({
            name,
            location,
            star_rating,
            description,
            image_url
        })

        return res.status(201).json({ success: true, data: hotel })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

exports.createRoom = async (req, res) => {
    try {
        const { room_number, type, price_per_night } = req.body

        const hotel_id = req.params.hotelId

        const hotel = await Hotel.findById(hotel_id)

        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" })
        }

        if (!room_number || !type || !price_per_night) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        const room = await Room.create({
            hotel_id: hotel_id,
            ...req.body
        })

        // Tạo sẵn 30 ngày "lịch" (RoomAvailability) cho phòng mới
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

        return res.status(201).json({ success: true, message: "Room created successfully", data: room })

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

exports.getLocations = async (req, res) => {
    try {
        const locations = await Hotel.distinct('location');
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false })
    }
}
