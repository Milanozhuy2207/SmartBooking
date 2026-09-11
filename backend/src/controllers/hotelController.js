const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const axios = require('axios')

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
        const hotelId = req.params.hotelId
        const rooms = await Room.find({ hotel_id: hotelId });

        if (!rooms || rooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Rooms not found for hotel ID: ' + hotelId })
        }

        res.status(200).json({ success: true, data: rooms })
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, error: error.message })
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