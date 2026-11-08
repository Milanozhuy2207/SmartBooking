import { useEffect, useState } from 'react';
import { FiMessageSquare, FiSend, FiUser, FiCheck } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface ReviewItem {
    _id: string;
    customer_name: string;
    room_name: string;
    rating: number;
    comment: string;
    createdAt: string;
}

interface HotelReviewsSectionProps {
    hotelId: string;
    hotelName: string;
    currentUser: any;
}

const HotelReviewsSection = ({ hotelId, hotelName, currentUser }: HotelReviewsSectionProps) => {
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [averageRating, setAverageRating] = useState(5.0);
    const [customerName, setCustomerName] = useState(currentUser?.full_name || '');
    const [roomName, setRoomName] = useState('Hạng Deluxe / VIP Suite');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReviews = async () => {
        try {
            const res = await axiosClient.get(`/reviews/hotel/${hotelId}`);
            if (res.data?.success) {
                setReviews(res.data.data || []);
                setAverageRating(res.data.averageRating || 5.0);
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [hotelId]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !comment.trim()) {
            toast.error('Vui lòng nhập họ tên và nội dung nhận xét!');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axiosClient.post('/reviews', {
                hotel_id: hotelId,
                customer_name: customerName,
                room_name: roomName,
                rating,
                comment
            });
            if (res.data?.success) {
                toast.success('Đã đăng đánh giá kỳ nghỉ thành công!');
                setComment('');
                fetchReviews();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-20 pt-14 border-t border-[#EAE3D2] dark:border-white/10">
            {/* Header tổng quan điểm đánh giá */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C19D60] bg-[#C19D60]/10 px-3.5 py-1 rounded-full mb-3">
                        <FiMessageSquare /> VERIFIED GUEST REVIEWS
                    </span>
                    <h3 className="text-3xl md:text-4xl font-serif text-[#222] dark:text-white">
                        Đánh Giá Thực Tế Từ Khách Lưu Trú
                    </h3>
                    <p className="text-xs md:text-sm text-[#777] dark:text-gray-400 mt-1">
                        Trải nghiệm được xác thực từ các kỳ nghỉ tại {hotelName}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] px-6 py-4 rounded-2xl border border-[#EAE3D2] dark:border-white/10 shadow-xs">
                    <div className="text-4xl font-serif font-bold text-[#C19D60]">
                        {averageRating.toFixed(1)}
                    </div>
                    <div>
                        <div className="flex text-[#C19D60] text-base">
                            {[...Array(5)].map((_, idx) => (
                                <HiStar key={idx} />
                            ))}
                        </div>
                        <p className="text-xs text-[#777] font-bold uppercase tracking-wider mt-0.5">
                            Tuyệt Hảo ({reviews.length} đánh giá)
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Danh sách đánh giá */}
                <div className="lg:col-span-7 space-y-5">
                    {reviews.map((rev) => (
                        <div
                            key={rev._id}
                            className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-[#EAE3D2] dark:border-white/10 shadow-xs"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#C19D60]/15 text-[#C19D60] flex items-center justify-center font-serif font-bold text-sm">
                                        <FiUser />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#222] dark:text-white flex items-center gap-2">
                                            {rev.customer_name}
                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                                                <FiCheck /> Đã lưu trú
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-[#C19D60] font-semibold">
                                            {rev.room_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center text-[#C19D60] text-sm">
                                    {[...Array(rev.rating || 5)].map((_, i) => (
                                        <HiStar key={i} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-[#555] dark:text-gray-300 leading-relaxed font-light">
                                “{rev.comment}”
                            </p>
                        </div>
                    ))}
                </div>

                {/* Form viết đánh giá mới */}
                <div className="lg:col-span-5">
                    <form
                        onSubmit={handleSubmitReview}
                        className="bg-white dark:bg-[#1a1a1a] p-6 md:p-8 rounded-2xl border border-[#EAE3D2] dark:border-white/10 shadow-sm space-y-4 sticky top-28"
                    >
                        <h4 className="text-xl font-serif text-[#222] dark:text-white">
                            Chia Sẻ Trải Nghiệm Của Quý Khách
                        </h4>
                        <p className="text-xs text-[#777]">
                            Đánh giá của Quý khách giúp nâng tầm chất lượng dịch vụ tại {hotelName}.
                        </p>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1.5">
                                Mức độ hài lòng
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-transform hover:scale-110 ${
                                            star <= rating ? 'text-[#C19D60]' : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                    >
                                        <HiStar />
                                    </button>
                                ))}
                                <span className="ml-2 text-xs font-bold text-[#C19D60]">
                                    {rating}/5 Sao
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1.5">
                                Họ & Tên Quý Khách
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="VD: Nguyễn Văn Huy"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#222] border border-[#EAE3D2] dark:border-white/10 text-xs text-[#222] dark:text-white outline-none focus:border-[#C19D60]"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1.5">
                                Hạng phòng đã trải nghiệm
                            </label>
                            <select
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#222] border border-[#EAE3D2] dark:border-white/10 text-xs text-[#222] dark:text-white outline-none focus:border-[#C19D60]"
                            >
                                <option value="Hạng Standard Classic">Hạng Standard Classic</option>
                                <option value="Hạng Deluxe / Club Suite">Hạng Deluxe / Club Suite</option>
                                <option value="Hạng VIP Suite & Pool Villa">Hạng VIP Suite & Pool Villa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1.5">
                                Nhận xét chi tiết
                            </label>
                            <textarea
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ cảm nhận về không gian phòng, tầm nhìn, ẩm thực và dịch vụ..."
                                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#222] border border-[#EAE3D2] dark:border-white/10 text-xs text-[#222] dark:text-white outline-none focus:border-[#C19D60]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-xl bg-[#222] hover:bg-[#C19D60] text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FiSend />
                            {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HotelReviewsSection;
