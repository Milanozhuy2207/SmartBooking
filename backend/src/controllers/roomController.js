const Room = require('../models/Room')

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
        res.status(200).json(rooms)
    }
    catch (err) {
        res.status(500).json({ message: 'Error get all rooms ' + err.message })
    }
}
