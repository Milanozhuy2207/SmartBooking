import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCheckCircle, FiHome, FiSun, FiMoon, FiAward, FiCalendar, FiXCircle, FiSearch, FiPhone, FiArrowLeft, FiUser, FiLogOut, FiLogIn, FiMapPin } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface Booking {
    _id: string;
    room_id: {
        room_number: string;
        type: string;
        price_per_night: number;
        hotel_id?: { name: string; location: string };
    };
    customer_name: string;
    phone_number: string;
    total_price: number;
    status: string;
    check_in: string;
    check_out: string;
    createdAt: string;
}

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [guestPhone, setGuestPhone] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(() => {
        const u = localStorage.getItem('user');
        try {
            return u && u !== 'undefined' ? JSON.parse(u) : null;
        } catch {
            return null;
        }
    });
    const isLoggedIn = Boolean(currentUser);
    const navigate = useNavigate();

    const fetchBooking = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/bookings/my-bookings');
            setBookings(response.data.data || []);
            setRewardPoints(response.data.reward_points ?? response.data.reward_point ?? 0);
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                setCurrentUser(null);
            } else {
                const errorMessage = error.response?.data?.message || 'Lỗi tải danh sách hóa đơn';
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchBooking();
        } else {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    // Dark mode toggle effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogout = async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch {
            // ignore
        }
        localStorage.removeItem('user');
        setCurrentUser(null);
        setBookings([]);
        toast.success('Đã đăng xuất!');
        navigate('/login');
    };

    const handleCancelMyBooking = async (bookingId: string) => {
        try {
            const res = await axiosClient.put(`/bookings/${bookingId}/cancel`);
            if (res.data.success) {
                toast.success('Đã hủy đặt phòng thành công');
                fetchBooking();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể hủy đơn');
        }
    };

    const handleLookupGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestPhone.trim()) {
            return toast.error('Vui lòng nhập số điện thoại!');
        }
        setIsLoading(true);
        try {
            const res = await axiosClient.get('/bookings/lookup', {
                params: { phoneNumber: guestPhone.trim() }
            });
            setBookings(res.data.data || []);
            if (!res.data.data || res.data.data.length === 0) {
                toast.error('Không tìm thấy đơn đặt phòng nào với SĐT này!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi tra cứu đơn đặt phòng');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111] transition-colors duration-500 font-sans relative">
            <Toaster position="top-right" />

            {/* Nút bật tắt Dark Mode Floating */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="fixed top-1/2 right-4 -translate-y-1/2 z-50 bg-white dark:bg-[#222] p-4 rounded-full shadow-2xl border border-gray-200 dark:border-white/10 text-xl hover:scale-110 transition-all duration-300 group"
            >
                {isDarkMode ? <FiSun className="text-yellow-500 group-hover:rotate-90 transition-transform duration-500" /> : <FiMoon className="text-[#222] group-hover:-rotate-12 transition-transform duration-500" />}
            </button>

            {/* HEADER COMPONENT (ĐÃ FIX VỠ CHIỀU CAO & BỔ SUNG NÚT ĐIỀU HƯỚNG) */}
            <header className="fixed w-full top-0 z-[80] bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md shadow-md border-b border-[#EAE3D2] dark:border-white/10 py-4 transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#777] dark:text-gray-300 hover:text-[#C19D60] transition-colors"
                    >
                        <FiArrowLeft className="text-base text-[#C19D60]" />
                        <span className="hidden sm:inline">Trang chủ</span>
                    </button>

                    <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/home')}>
                        <span className="flex items-center gap-1 text-xl md:text-2xl font-serif tracking-widest text-[#222] dark:text-white group-hover:text-[#C19D60] transition-colors">
                            <span className="text-[#C19D60] text-2xl md:text-3xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                        </span>
                        <span className="text-[8px] tracking-[0.5em] font-bold text-[#777] dark:text-white/60 group-hover:text-[#C19D60]/80 transition-colors">LUXURY HOTEL</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <>
                                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#222] dark:text-white px-3 py-1.5 rounded-full bg-[#FDFBF7] dark:bg-[#222] border border-[#EAE3D2] dark:border-white/10">
                                    <FiUser className="text-[#C19D60]" />
                                    <span className="max-w-[120px] truncate">{currentUser.full_name || currentUser.email?.split('@')[0]}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-[#777] hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
                                    title="Đăng xuất"
                                >
                                    <FiLogOut className="text-lg" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-[#C19D60] text-white hover:bg-[#A8874E] transition-colors"
                            >
                                <FiLogIn className="text-sm" /> Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-10">
                    <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Your History</p>
                    <h3 className="text-4xl font-serif text-[#222] dark:text-gray-100">My Bookings</h3>
                    <div className="w-16 h-0.5 bg-[#C19D60] mx-auto mt-6"></div>
                </div>

                {/* PHÂN NHÁNH GIAO DIỆN: THÀNH VIÊN (THẺ ĐIỂM THƯỞNG) vs KHÁCH VÃNG LAI (TRA CỨU SĐT) */}
                {isLoggedIn ? (
                    <div className="mb-10 bg-gradient-to-r from-[#1a1a1a] via-[#262626] to-[#1a1a1a] text-white p-6 md:p-8 rounded-2xl shadow-2xl border border-[#C19D60]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[#C19D60]/20 border border-[#C19D60] flex items-center justify-center text-[#C19D60] text-2xl shrink-0">
                                <FiAward />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C19D60] font-bold mb-1">
                                    SmartBooking Privilege • {currentUser?.full_name || currentUser?.email}
                                </p>
                                <h4 className="text-xl font-serif">
                                    {rewardPoints >= 500 ? 'Platinum Member' : rewardPoints >= 100 ? 'Gold Member' : 'Silver Member'}
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Tích lũy 1 điểm cho mỗi 10.000đ khi đơn đặt phòng được xác nhận (CONFIRMED).
                                </p>
                            </div>
                        </div>
                        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Reward Points</p>
                            <p className="text-3xl font-serif font-bold text-[#C19D60]">
                                {rewardPoints.toLocaleString('vi-VN')} <span className="text-xs font-sans uppercase tracking-widest text-white">pts</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleLookupGuest} className="mb-10 bg-white dark:bg-[#1a1a1a] p-6 md:p-8 rounded-2xl shadow-xl border border-[#EAE3D2] dark:border-[#333]">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold mb-2">
                            Guest Booking Lookup
                        </p>
                        <h4 className="text-xl font-serif text-[#222] dark:text-white mb-4">
                            Tra cứu đơn đặt phòng bằng Số điện thoại
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C19D60]" />
                                <input
                                    type="tel"
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="Nhập số điện thoại lúc đặt phòng (VD: 0934281259)..."
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FDFBF7] dark:bg-[#222] border border-[#EAE3D2] dark:border-white/15 text-sm text-[#222] dark:text-white outline-none focus:border-[#C19D60] transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-[#C19D60] hover:bg-[#A8874E] text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                <FiSearch className="text-base" /> Tra cứu ngay
                            </button>
                        </div>
                    </form>
                )}

                {isLoading ? (
                    <div className="text-center text-[#777] font-bold animate-pulse mt-10 tracking-widest uppercase text-sm">Loading Data...</div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a1a] p-16 text-center shadow-2xl border border-[#EAE3D2] dark:border-[#333] mt-10 rounded-2xl transition-colors duration-500">
                        <div className="w-24 h-24 border-2 border-[#C19D60]/30 text-[#C19D60] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                            <FiHome />
                        </div>
                        <h2 className="text-2xl font-serif text-[#222] dark:text-white mb-4">No Bookings Yet</h2>
                        <p className="text-[#777] font-light mb-8 max-w-sm mx-auto">Bạn chưa có đơn đặt phòng nào. Hãy khám phá danh sách khách sạn và đặt kỳ nghỉ ngay hôm nay.</p>
                        <button onClick={() => navigate('/home')} className="bg-[#222] dark:bg-white text-white dark:text-[#222] px-8 py-3 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-[#C19D60] dark:hover:bg-[#C19D60] dark:hover:text-white transition-colors">
                            Explore Hotels
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((b) => (
                            <div key={b._id} className="bg-white dark:bg-[#1a1a1a] p-8 shadow-xl border border-[#EAE3D2] dark:border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between hover:border-[#C19D60] dark:hover:border-[#C19D60] transition-all duration-300 gap-6 group rounded-2xl">
                                <div className="space-y-2.5">
                                    {b.room_id?.hotel_id && (
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#C19D60] flex items-center gap-1.5">
                                            <FiMapPin /> {b.room_id.hotel_id.name} ({b.room_id.hotel_id.location})
                                        </p>
                                    )}
                                    <h3 className="text-2xl font-serif text-[#222] dark:text-white flex items-center gap-3">
                                        Room {b.room_id?.room_number || 'N/A'}
                                        <span className="text-[10px] font-sans bg-[#C19D60] text-white px-2.5 py-1 uppercase tracking-widest font-bold rounded">{b.room_id?.type || 'STANDARD'}</span>
                                    </h3>

                                    {b.check_in && b.check_out && (
                                        <p className="text-xs font-medium text-[#555] dark:text-gray-300 flex items-center gap-2">
                                            <FiCalendar className="text-[#C19D60]" />
                                            <span>Check-in: <strong>{new Date(b.check_in).toLocaleDateString('vi-VN')}</strong></span>
                                            <span>→</span>
                                            <span>Check-out: <strong>{new Date(b.check_out).toLocaleDateString('vi-VN')}</strong></span>
                                        </p>
                                    )}

                                    <p className="text-xs text-[#777] flex items-center gap-3">
                                        <span>Khách: <strong className="text-[#222] dark:text-gray-200">{b.customer_name}</strong></span>
                                        <span>•</span>
                                        <span>SĐT: <strong className="text-[#222] dark:text-gray-200">{b.phone_number}</strong></span>
                                    </p>

                                    <p className="text-[11px] font-bold text-[#777] uppercase tracking-widest flex items-center gap-2 pt-1">
                                        <FiClock className="text-[#C19D60] text-sm group-hover:rotate-12 transition-transform" /> Đặt lúc: {new Date(b.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>

                                <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-[#EAE3D2] dark:border-[#333] pt-4 md:pt-0 md:pl-8 w-full md:w-auto flex flex-col items-start md:items-end gap-2">
                                    <div>
                                        <p className="text-xs text-[#777] uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-2xl font-serif text-[#C19D60]">{b.total_price.toLocaleString('vi-VN')} đ</p>
                                    </div>

                                    {b.status === 'CONFIRMED' && (
                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 uppercase tracking-[0.2em]">
                                            <FiCheckCircle className="text-base" /> CONFIRMED
                                        </span>
                                    )}
                                    {b.status === 'CHECKED_IN' && (
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 uppercase tracking-[0.2em]">
                                            <FiCheckCircle className="text-base" /> CHECKED IN (ĐANG LƯU TRÚ)
                                        </span>
                                    )}
                                    {b.status === 'CHECKED_OUT' && (
                                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 uppercase tracking-[0.2em]">
                                            <FiCheckCircle className="text-base" /> CHECKED OUT (ĐÃ TRẢ PHÒNG)
                                        </span>
                                    )}
                                    {b.status === 'PENDING' && (
                                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-[0.2em]">
                                            <FiClock className="text-base" /> PENDING
                                        </span>
                                    )}
                                    {b.status === 'CANCELLED' && (
                                        <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 uppercase tracking-[0.2em]">
                                            <FiXCircle className="text-base" /> CANCELLED
                                        </span>
                                    )}

                                    {isLoggedIn && b.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleCancelMyBooking(b._id)}
                                            className="mt-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-500/40 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            Hủy đặt phòng
                                        </button>
                                    )}
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
