const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, verifyVendorOrAdmin, optionalVerifyToken } = require('../middlewares/authMiddleware');

router.post('/checkout', optionalVerifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.get('/lookup', bookingController.lookupGuestBooking);
router.put('/:id/pay', optionalVerifyToken, bookingController.confirmVietQRPayment);

router.get('/all', verifyToken, verifyVendorOrAdmin, bookingController.getAllBookings);
router.put('/:id/status', verifyToken, verifyVendorOrAdmin, bookingController.updateBookingStatus);
router.put('/:id/cancel', verifyToken, bookingController.cancelMyBooking);

module.exports = router;
