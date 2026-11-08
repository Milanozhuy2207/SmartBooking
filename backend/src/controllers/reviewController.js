const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

exports.getReviewsByHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const reviews = await Review.find({ hotel_id: hotelId }).sort({ createdAt: -1 }).lean();
        const total = reviews.length;
        const avg = total > 0
            ? Number((reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / total).toFixed(1))
            : 5.0;

        return res.status(200).json({
            success: true,
            data: reviews,
            averageRating: avg,
            totalReviews: total
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        const { hotel_id, booking_id, customer_name, room_name, rating, comment } = req.body;
        if (!hotel_id || !customer_name || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ tên và nội dung đánh giá'
            });
        }

        const hotel = await Hotel.findById(hotel_id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn' });
        }

        const review = await Review.create({
            hotel_id,
            booking_id: booking_id || null,
            user_id: req.userId || null,
            customer_name,
            room_name: room_name || 'Khách lưu trú xác thực',
            rating: Math.min(5, Math.max(1, Number(rating) || 5)),
            comment
        });

        return res.status(201).json({
            success: true,
            message: 'Cảm ơn quý khách đã gửi đánh giá!',
            data: review
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
