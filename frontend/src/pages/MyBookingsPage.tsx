import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCheckCircle, FiHome, FiSun, FiMoon } from 'react-icons/fi';
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
    const [isDarkMode, setIsDarkMode] = useState(false);
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

    // Dark mode toggle effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

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

            {/* HEADER COMPONENT */}
            <header className="fixed w-full top-0 z-[80] bg-white dark:bg-[#1a1a1a] shadow-xl py-5 transition-colors duration-500">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative">
                    <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 cursor-pointer group" onClick={() => navigate('/home')}>
                        <span className="flex items-center gap-1 text-2xl font-serif tracking-widest text-[#222] dark:text-white group-hover:text-[#C19D60] transition-colors">
                            <span className="text-[#C19D60] text-3xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                        </span>
                        <span className="text-[9px] tracking-[0.5em] font-bold text-[#777] dark:text-white/60 group-hover:text-[#C19D60]/80 transition-colors">LUXURY HOTEL</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="text-center mb-16">
                    <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Your History</p>
                    <h3 className="text-4xl font-serif text-[#222] dark:text-gray-100">My Bookings</h3>
                    <div className="w-16 h-0.5 bg-[#C19D60] mx-auto mt-6"></div>
                </div>

                {isLoading ? (
                    <div className="text-center text-[#777] font-bold animate-pulse mt-10 tracking-widest uppercase text-sm">Loading Data...</div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a1a] p-16 text-center shadow-2xl border border-[#EAE3D2] dark:border-[#333] mt-10 transition-colors duration-500">
                        <div className="w-24 h-24 border-2 border-[#C19D60]/30 text-[#C19D60] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                            <FiHome />
                        </div>
                        <h2 className="text-2xl font-serif text-[#222] dark:text-white mb-4">No Bookings Yet</h2>
                        <p className="text-[#777] font-light mb-8 max-w-sm mx-auto">You haven't made any reservations. Discover our luxurious rooms and book your perfect stay.</p>
                        <button onClick={() => navigate('/home')} className="bg-[#222] dark:bg-white text-white dark:text-[#222] px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#C19D60] dark:hover:bg-[#C19D60] transition-colors">
                            Explore Rooms
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((b) => (
                            <div key={b._id} className="bg-white dark:bg-[#1a1a1a] p-8 shadow-xl border border-[#EAE3D2] dark:border-[#333] flex flex-col md:flex-row items-start md:items-center justify-between hover:border-[#C19D60] dark:hover:border-[#C19D60] transition-all duration-300 gap-6 group">
                                <div>
                                    <h3 className="text-2xl font-serif text-[#222] dark:text-white flex items-center gap-4 mb-2">
                                        Room {b.room_id?.room_number || 'N/A'}
                                        <span className="text-[10px] font-sans bg-[#C19D60] text-white px-2 py-1 uppercase tracking-widest font-bold">{b.room_id?.type || 'N/A'}</span>
                                    </h3>
                                    <p className="text-xs font-bold text-[#777] uppercase tracking-widest flex items-center gap-2">
                                        <FiClock className="text-[#C19D60] text-base group-hover:rotate-12 transition-transform" /> {new Date(b.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-[#EAE3D2] dark:border-[#333] pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
                                    <p className="text-xs text-[#777] uppercase tracking-widest mb-1">Total Amount</p>
                                    <p className="text-2xl font-serif text-[#C19D60] mb-2">{b.total_price.toLocaleString('vi-VN')} đ</p>
                                    <p className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center justify-start md:justify-end gap-1 uppercase tracking-[0.2em]">
                                        <FiCheckCircle className="text-base" /> CONFIRMED
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