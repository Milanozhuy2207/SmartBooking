const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', hotelController.getHotels);
router.get('/locations', hotelController.getLocations);
router.get('/:hotelId/rooms', hotelController.getRoomsByHotel);

// Admin Routes (Yêu cầu đăng nhập và có quyền ADMIN)
router.post('/', verifyToken, verifyAdmin, hotelController.createHotel);
router.post('/:hotelId/rooms', verifyToken, verifyAdmin, hotelController.createRoom);

module.exports = router;
