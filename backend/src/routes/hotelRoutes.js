const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/', hotelController.getHotels);
router.get('/locations', hotelController.getLocations);
router.get('/:hotelId/rooms', hotelController.getRoomsByHotel);

module.exports = router;