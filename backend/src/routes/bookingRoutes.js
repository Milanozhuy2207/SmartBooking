const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.post('/checkout', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);

// Admin Routes (Yêu cầu đăng nhập và có quyền ADMIN)
router.get('/all', verifyToken, verifyAdmin, bookingController.getAllBookings);
router.put('/:id/status', verifyToken, verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;
