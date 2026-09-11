import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheckCircle, FiHome } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface Booking {
    _id: string;
    room_id: { room_number: string; type: string; price_per_night: number };
    total_price: number;
    status: string;
    createdAt: string;
}

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooking = async () => {
            setIsLoading(true);
            try {
                const response = await axiosClient.get('/bookings/my-bookings');
                setBookings(response.data.data);
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Lỗi tải danh sách hóa đơn';
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Toaster />
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/home')} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-cyan-100 hover:text-cyan-600 transition-colors">
                            <FiArrowLeft className="text-xl" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-800">Lịch sử đặt phòng</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {isLoading ? (
                    <div className="text-center text-gray-500 font-bold animate-pulse mt-10">Đang tải dữ liệu...</div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 mt-10">
                        <div className="w-20 h-20 bg-cyan-50 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            <FiHome />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bạn chưa đặt phòng nào</h2>
                        <Link to="/home" className="inline-block mt-4 text-cyan-600 font-bold hover:underline">Quay lại xem phòng</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((b) => (
                            <div key={b._id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-md transition-shadow gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        Phòng {b.room_id?.room_number || 'N/A'}
                                        <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-lg">{b.room_id?.type || 'N/A'}</span>
                                    </h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1">
                                        <FiClock /> {new Date(b.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-xl font-black text-cyan-600">{b.total_price.toLocaleString('vi-VN')} VNĐ</p>
                                    <p className="text-sm font-bold text-green-500 flex items-center justify-start md:justify-end gap-1 mt-1">
                                        <FiCheckCircle /> ĐÃ ĐẶT
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookingsPage;