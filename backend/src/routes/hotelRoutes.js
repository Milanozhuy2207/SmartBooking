const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { verifyToken, verifyAdmin, verifyVendorOrAdmin } = require('../middlewares/authMiddleware');

router.get('/', hotelController.getHotels);
router.get('/locations', hotelController.getLocations);
router.get('/my-hotels', verifyToken, verifyVendorOrAdmin, hotelController.getMyHotels);
router.get('/:hotelId/rooms', hotelController.getRoomsByHotel);

router.post('/', verifyToken, verifyVendorOrAdmin, hotelController.createHotel);
router.post('/:hotelId/rooms', verifyToken, verifyVendorOrAdmin, hotelController.createRoom);

module.exports = router;
