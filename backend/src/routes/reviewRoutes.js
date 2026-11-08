const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { optionalVerifyToken } = require('../middlewares/authMiddleware');

router.get('/hotel/:hotelId', reviewController.getReviewsByHotel);
router.post('/', optionalVerifyToken, reviewController.createReview);

module.exports = router;
