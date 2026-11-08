import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiLogOut,
    FiCheck,
    FiX,
    FiRefreshCcw,
    FiSun,
    FiMoon,
    FiHome,
    FiGrid,
    FiCalendar,
    FiDollarSign,
    FiTrendingUp,
    FiSearch,
    FiPlus,
    FiMapPin,
    FiStar,
    FiKey,
    FiExternalLink,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiBriefcase,
    FiBox
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface Room {
    _id: string;
    room_number: string;
    type: 'STANDARD' | 'DELUXE' | 'VIP';
    price_per_night: number;
}

interface Hotel {
    _id: string;
    name: string;
    location: string;
    star_rating: number;
    description: string;
    image_url: string;
    rooms?: Room[];
}

interface Booking {
    _id: string;
    room_id: {
        _id: string;
        room_number: string;
        type: string;
        hotel_id?: { name: string; location: string };
    };
    user_id?: { _id: string; email: string };
    customer_name: string;
    phone_number: string;
    total_price: number;
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    check_in: string;
    check_out: string;
    createdAt: string;
}

const VendorDashboard = () => {
    const currentUser = (() => {
        const u = localStorage.getItem('user');
        try {
            return u && u !== 'undefined' ? JSON.parse(u) : null;
        } catch {
            return null;
        }
    })();

    const [activeSection, setActiveSection] = useState<'overview' | 'properties' | 'bookings'>(
        currentUser?.role === 'RECEPTIONIST' ? 'bookings' : 'overview'
    );
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Filters
    const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showCreateHotelModal, setShowCreateHotelModal] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [hotelForm, setHotelForm] = useState({
        name: '',
        location: '',
        star_rating: 5,
        description: '',
        image_url: ''
    });
    const [roomForm, setRoomForm] = useState({
        room_number: '',
        type: 'STANDARD',
        price_per_night: 500000
    });

    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [hotelsRes, bookingsRes] = await Promise.all([
                axiosClient.get('/hotels/my-hotels'),
                axiosClient.get('/bookings/all')
            ]);
            setHotels(hotelsRes.data.data || []);
            setBookings(bookingsRes.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi tải dữ liệu Partner Extranet');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

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
        navigate('/login');
    };

    const handleOpenManageRooms = async (hotel: Hotel) => {
        setSelectedHotel(hotel);
        try {
            const res = await axiosClient.get(`/hotels/${hotel._id}/rooms`);
            setRooms(res.data.data || []);
        } catch {
            toast.error('Không thể tải danh sách phòng');
        }
    };

    const handleCreateHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosClient.post('/hotels', hotelForm);
            toast.success('Đã đăng ký khách sạn mới thành công!');
            setShowCreateHotelModal(false);
            setHotelForm({ name: '', location: '', star_rating: 5, description: '', image_url: '' });
            fetchDashboardData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo khách sạn');
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHotel) return;
        try {
            await axiosClient.post(`/hotels/${selectedHotel._id}/rooms`, roomForm);
            toast.success('Đã thêm phòng & mở lịch trống 30 ngày!');
            setRoomForm({ room_number: '', type: 'STANDARD', price_per_night: 500000 });
            handleOpenManageRooms(selectedHotel);
            fetchDashboardData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể thêm phòng');
        }
    };

    const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
        try {
            await axiosClient.put(`/bookings/${bookingId}/status`, { status });
            toast.success(`Đã cập nhật trạng thái đơn: ${status}`);
            fetchDashboardData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    // Tính toán KPI Đối tác (Vendor)
    const isRevenueStatus = (st: string) => st === 'CONFIRMED' || st === 'CHECKED_IN' || st === 'CHECKED_OUT';
    const totalRoomsCount = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const confirmedBookings = bookings.filter(b => isRevenueStatus(b.status));
    const checkedInBookings = bookings.filter(b => b.status === 'CHECKED_IN');
    const checkedOutBookings = bookings.filter(b => b.status === 'CHECKED_OUT');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    const grossRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const netPartnerPayout = Math.round(grossRevenue * 0.85); // 85% về Chủ khách sạn

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !q ||
            b._id.toLowerCase().includes(q) ||
            b.customer_name?.toLowerCase().includes(q) ||
            b.phone_number?.toLowerCase().includes(q) ||
            b.room_id?.room_number?.toLowerCase().includes(q) ||
            b.room_id?.hotel_id?.name?.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
    });

    return (
        <div className="h-screen overflow-hidden flex bg-[#F4F6F9] dark:bg-[#0d0e11] text-[#1e293b] dark:text-gray-100 font-sans transition-colors duration-300">
            <Toaster position="top-right" />

            {/* ================= SIDEBAR TRÁI (PARTNER EXTRANET) ================= */}
            <aside className="w-68 bg-[#12161f] text-gray-300 flex flex-col justify-between border-r border-white/10 shrink-0 select-none">
                <div>
                    {/* Brand Logo */}
                    <div className="h-20 px-6 flex items-center gap-3 border-b border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C19D60] to-[#8f6f38] flex items-center justify-center text-white font-serif font-black text-xl shadow-lg shadow-[#C19D60]/25">
                            S
                        </div>
                        <div>
                            <h1 className="font-serif tracking-widest text-white font-bold text-base leading-none">
                                SMARTBOOKING
                            </h1>
                            <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-400 font-bold block mt-1">
                                Partner Extranet
                            </span>
                        </div>
                    </div>

                    {/* Menu Navigation */}
                    <div className="p-4 space-y-1.5">
                        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            Kênh Đối Tác Khách Sạn
                        </p>

                        <button
                            onClick={() => setActiveSection('overview')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                activeSection === 'overview'
                                    ? 'bg-[#C19D60] text-white shadow-lg shadow-[#C19D60]/25'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <FiGrid className="text-base" /> Tổng quan Kinh doanh
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveSection('properties')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                activeSection === 'properties'
                                    ? 'bg-[#C19D60] text-white shadow-lg shadow-[#C19D60]/25'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <FiHome className="text-base" /> Khách sạn & Quỹ phòng
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                                activeSection === 'properties' ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-300'
                            }`}>
                                {hotels.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveSection('bookings')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                activeSection === 'bookings'
                                    ? 'bg-[#C19D60] text-white shadow-lg shadow-[#C19D60]/25'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <FiCalendar className="text-base" /> Đơn đặt phòng của khách
                            </span>
                            {pendingBookings.length > 0 && (
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                                    activeSection === 'bookings' ? 'bg-black/30 text-white' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                    {pendingBookings.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Partner Profile & Quick Actions */}
                <div className="p-4 border-t border-white/10 space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold">
                            <FiBriefcase />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{currentUser?.full_name || 'Hotel Partner'}</p>
                            <p className="text-[11px] text-gray-400 truncate">{currentUser?.email || 'vendor@smartbooking.com'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => navigate('/home')}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold transition-colors"
                        >
                            <FiExternalLink /> Trang chủ
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold transition-colors"
                        >
                            <FiLogOut /> Đăng xuất
                        </button>
                    </div>
                </div>
            </aside>

            {/* ================= KHU VỰC NỘI DUNG CHÍNH ================= */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOP HEADER BAR */}
                <header className="h-20 bg-white dark:bg-[#16191f] border-b border-gray-200 dark:border-white/10 px-8 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {activeSection === 'overview' && 'Tổng quan Kinh doanh Khách sạn'}
                            {activeSection === 'properties' && 'Quản lý Khách sạn & Quỹ phòng của tôi'}
                            {activeSection === 'bookings' && 'Đơn đặt phòng của khách hàng'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Cổng quản lý vận hành dành cho Đối tác Chủ khách sạn (Merchant Portal)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreateHotelModal(true)}
                            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C19D60] hover:bg-[#a9864c] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                        >
                            <FiPlus className="text-sm" /> Thêm Khách Sạn
                        </button>

                        <button
                            onClick={fetchDashboardData}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-gray-600 dark:text-gray-300 hover:text-[#C19D60] transition-colors"
                            title="Làm mới dữ liệu"
                        >
                            <FiRefreshCcw className={isLoading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-gray-600 dark:text-gray-300 hover:text-[#C19D60] transition-colors"
                            title="Đổi giao diện Sáng/Tối"
                        >
                            {isDarkMode ? <FiSun className="text-yellow-400" /> : <FiMoon />}
                        </button>
                    </div>
                </header>

                {/* WORKSPACE SCROLLABLE CONTENT */}
                <main className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* ==================== TAB 1: PARTNER OVERVIEW ==================== */}
                    {activeSection === 'overview' && (
                        <>
                            {/* 4 PARTNER KPI CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Doanh thu thực nhận (85%)
                                        </span>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">
                                            <FiDollarSign />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {netPartnerPayout.toLocaleString('vi-VN')} đ
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Sau khi trừ 15% phí nền tảng SmartBooking
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Tổng giá trị đặt phòng
                                        </span>
                                        <div className="w-10 h-10 rounded-xl bg-[#C19D60]/15 text-[#C19D60] flex items-center justify-center text-lg">
                                            <FiTrendingUp />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {grossRevenue.toLocaleString('vi-VN')} đ
                                    </p>
                                    <p className="text-xs text-[#C19D60] font-semibold mt-2">
                                        Từ {confirmedBookings.length} đơn đã xác nhận
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Đơn đặt phòng của khách
                                        </span>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">
                                            <FiCalendar />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {bookings.length} đơn
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                                        <span className="text-amber-500">{pendingBookings.length} chờ duyệt</span>
                                        <span>•</span>
                                        <span className="text-emerald-500">{confirmedBookings.length} đã duyệt</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Cơ sở & Quỹ phòng
                                        </span>
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg">
                                            <FiKey />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {hotels.length} Khách sạn • {totalRoomsCount} Phòng
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Tự động đồng bộ lịch trống 30 ngày
                                    </p>
                                </div>
                            </div>

                            {/* 2-COLUMN PARTNER WORKSPACE */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* CỘT TRÁI: CƠ SỞ LƯU TRÚ CỦA TÔI */}
                                <div className="lg:col-span-6 bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                                Cơ sở lưu trú của tôi ({hotels.length})
                                            </h3>
                                            <p className="text-xs text-gray-500">Bấm vào từng khách sạn để thêm hoặc xem phòng</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveSection('properties')}
                                            className="text-xs font-bold text-[#C19D60] hover:underline"
                                        >
                                            Quản lý chi tiết →
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {hotels.map(h => (
                                            <div key={h._id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#1e222b] border border-gray-200/60 dark:border-white/5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <img src={h.image_url} alt={h.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{h.name}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <FiMapPin className="text-[#C19D60]" /> {h.location} • {h.rooms?.length || 0} phòng
                                                        </p>
                                                        <p className="text-xs font-semibold text-[#C19D60] mt-1">
                                                            Giá từ: {h.rooms?.[0]?.price_per_night ? `${h.rooms[0].price_per_night.toLocaleString('vi-VN')}đ/đêm` : 'Chưa có phòng'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenManageRooms(h)}
                                                    className="px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-[#C19D60] dark:hover:bg-[#C19D60] dark:hover:text-white text-xs font-bold transition-colors shrink-0"
                                                >
                                                    Quản lý phòng
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CỘT PHẢI: ĐƠN ĐẶT PHÒNG MỚI CỦA KHÁCH */}
                                <div className="lg:col-span-6 bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                                Đơn đặt phòng cần duyệt ({pendingBookings.length})
                                            </h3>
                                            <p className="text-xs text-gray-500">Xác nhận giữ phòng cho khách hàng</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveSection('bookings')}
                                            className="text-xs font-bold text-[#C19D60] hover:underline"
                                        >
                                            Tất cả đơn ({bookings.length}) →
                                        </button>
                                    </div>

                                    {pendingBookings.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 text-sm">
                                            <FiCheckCircle className="text-3xl text-emerald-500 mx-auto mb-2" />
                                            Không có đơn đặt phòng nào đang chờ duyệt.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingBookings.map(b => (
                                                <div key={b._id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#1e222b] border border-gray-200/60 dark:border-white/5 flex items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{b.customer_name}</span>
                                                            <span className="text-xs text-gray-500">• {b.phone_number}</span>
                                                        </div>
                                                        <p className="text-xs text-[#C19D60] font-semibold mt-0.5">
                                                            Phòng {b.room_id?.room_number} ({b.room_id?.type}) — {b.total_price?.toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(b._id, 'CONFIRMED')}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                                                        >
                                                            <FiCheck /> Nhận đơn
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(b._id, 'CANCELLED')}
                                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                                                        >
                                                            <FiX /> Từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ==================== TAB 2: KHÁCH SẠN & QUỸ PHÒNG ==================== */}
                    {activeSection === 'properties' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white dark:bg-[#16191f] p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                        Danh sách Khách sạn thuộc sở hữu của bạn ({hotels.length})
                                    </h3>
                                    <p className="text-xs text-gray-500">Mỗi phòng mới tạo sẽ được hệ thống tự động sinh lịch trống 30 ngày</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateHotelModal(true)}
                                    className="px-5 py-2.5 rounded-xl bg-[#C19D60] hover:bg-[#a9864c] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#C19D60]/20 transition-all"
                                >
                                    <FiPlus className="text-base" /> Đăng Ký Khách Sạn Mới
                                </button>
                            </div>

                            {hotels.length === 0 ? (
                                <div className="bg-white dark:bg-[#16191f] p-16 text-center rounded-2xl border border-gray-200 dark:border-white/10">
                                    <FiBox className="text-4xl text-[#C19D60] mx-auto mb-3" />
                                    <p className="text-gray-500 mb-4">Bạn chưa có khách sạn nào.</p>
                                    <button onClick={() => setShowCreateHotelModal(true)} className="px-6 py-2.5 rounded-xl bg-[#C19D60] text-white text-xs font-bold uppercase">
                                        + Thêm khách sạn đầu tiên
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {hotels.map((hotel) => (
                                        <div key={hotel._id} className="bg-white dark:bg-[#16191f] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col">
                                            <div className="h-48 relative bg-gray-900 overflow-hidden">
                                                <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <FiStar className="text-[#C19D60]" /> {hotel.star_rating}
                                                </div>
                                                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                                    <FiKey className="text-[#C19D60]" /> {hotel.rooms?.length || 0} phòng đang mở bán
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{hotel.name}</h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
                                                        <FiMapPin className="text-[#C19D60]" /> {hotel.location}
                                                    </p>
                                                    {hotel.rooms && hotel.rooms.length > 0 && (
                                                        <div className="mb-5 flex flex-wrap gap-1.5">
                                                            {hotel.rooms.map(r => (
                                                                <span key={r._id} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#22262f] font-semibold text-gray-700 dark:text-gray-300">
                                                                    P.{r.room_number} ({r.type})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleOpenManageRooms(hotel)}
                                                    className="w-full py-2.5 rounded-xl bg-[#C19D60] hover:bg-[#a9864c] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    Quản lý Phòng & Giá ({hotel.rooms?.length || 0})
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ==================== TAB 3: ĐƠN ĐẶT PHÒNG CỦA KHÁCH ==================== */}
                    {activeSection === 'bookings' && (
                        <div className="bg-white dark:bg-[#16191f] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden">
                            {/* Filter Bar */}
                            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {(['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const).map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setBookingStatusFilter(st)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                bookingStatusFilter === st
                                                    ? 'bg-[#C19D60] text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-[#22262f] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {st === 'ALL' && `Tất cả (${bookings.length})`}
                                            {st === 'PENDING' && `Chờ duyệt (${pendingBookings.length})`}
                                            {st === 'CONFIRMED' && `Đã duyệt (${bookings.filter(b => b.status === 'CONFIRMED').length})`}
                                            {st === 'CHECKED_IN' && `Đang ở (${checkedInBookings.length})`}
                                            {st === 'CHECKED_OUT' && `Đã trả phòng (${checkedOutBookings.length})`}
                                            {st === 'CANCELLED' && `Đã hủy (${cancelledBookings.length})`}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full sm:w-72">
                                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Tìm theo tên khách, SĐT, số phòng..."
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-[#22262f] text-xs outline-none border border-transparent focus:border-[#C19D60]"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1c2029] border-b border-gray-200 dark:border-white/10 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                            <th className="p-4">Mã Đơn</th>
                                            <th className="p-4">Khách Hàng</th>
                                            <th className="p-4">Khách Sạn & Phòng</th>
                                            <th className="p-4">Nhận / Trả Phòng</th>
                                            <th className="p-4">Doanh Thu</th>
                                            <th className="p-4">Trạng Thái</th>
                                            <th className="p-4 text-center">Xử Lý</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200/70 dark:divide-white/5 text-sm">
                                        {filteredBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-gray-400">
                                                    Không có đơn đặt phòng nào khớp với bộ lọc.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBookings.map((b) => (
                                                <tr key={b._id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 font-mono text-xs font-bold text-gray-500">
                                                        #{b._id.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-gray-900 dark:text-white">{b.customer_name}</p>
                                                        <p className="text-xs text-gray-500">{b.phone_number}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                            {b.room_id?.hotel_id?.name}
                                                        </p>
                                                        <span className="text-xs font-bold text-[#C19D60]">
                                                            Phòng {b.room_id?.room_number} ({b.room_id?.type})
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                            In: {b.check_in ? new Date(b.check_in).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </p>
                                                        <p className="text-gray-500 mt-0.5">
                                                            Out: {b.check_out ? new Date(b.check_out).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-[#C19D60]">{b.total_price?.toLocaleString('vi-VN')} đ</p>
                                                        <p className="text-[11px] text-emerald-500 font-medium">
                                                            Thực nhận: {Math.round((b.total_price || 0) * 0.85).toLocaleString('vi-VN')}đ
                                                        </p>
                                                    </td>
                                                    <td className="p-4">
                                                        {b.status === 'CONFIRMED' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                <FiCheckCircle /> CONFIRMED
                                                            </span>
                                                        )}
                                                        {b.status === 'CHECKED_IN' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                                <FiKey /> CHECKED IN
                                                            </span>
                                                        )}
                                                        {b.status === 'CHECKED_OUT' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                                <FiCheckCircle /> CHECKED OUT
                                                            </span>
                                                        )}
                                                        {b.status === 'PENDING' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                <FiClock /> PENDING
                                                            </span>
                                                        )}
                                                        {b.status === 'CANCELLED' && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500">
                                                                <FiXCircle /> CANCELLED
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {b.status === 'PENDING' && (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(b._id, 'CONFIRMED')}
                                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                                                                >
                                                                    <FiCheck /> Nhận đơn
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(b._id, 'CANCELLED')}
                                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                                                                >
                                                                    <FiX /> Từ chối
                                                                </button>
                                                            </div>
                                                        )}
                                                        {b.status === 'CONFIRMED' && (
                                                            <button
                                                                    onClick={() => handleUpdateBookingStatus(b._id, 'CHECKED_IN')}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                                                            >
                                                                <FiKey /> Nhận phòng (Check-in)
                                                            </button>
                                                        )}
                                                        {b.status === 'CHECKED_IN' && (
                                                            <button
                                                                    onClick={() => handleUpdateBookingStatus(b._id, 'CHECKED_OUT')}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                                                            >
                                                                <FiCheckCircle /> Trả phòng (Check-out)
                                                            </button>
                                                        )}
                                                        {(b.status === 'CHECKED_OUT' || b.status === 'CANCELLED') && (
                                                            <span className="text-xs text-gray-400 italic">Hoàn tất</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* MODAL TẠO KHÁCH SẠN MỚI */}
            {showCreateHotelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#16191f] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-8 relative">
                        <button onClick={() => setShowCreateHotelModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 text-lg">
                            <FiX />
                        </button>
                        <h3 className="text-xl font-bold mb-6">Đăng Ký Khách Sạn Mới</h3>
                        <form onSubmit={handleCreateHotel} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên khách sạn *</label>
                                <input required value={hotelForm.name} onChange={e => setHotelForm({ ...hotelForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" placeholder="VD: Melia Vinpearl Nha Trang" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thành phố *</label>
                                    <input required value={hotelForm.location} onChange={e => setHotelForm({ ...hotelForm, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" placeholder="VD: Nha Trang" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạng sao (1-5)</label>
                                    <input type="number" min="1" max="5" value={hotelForm.star_rating} onChange={e => setHotelForm({ ...hotelForm, star_rating: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ảnh đại diện (URL) *</label>
                                <input required value={hotelForm.image_url} onChange={e => setHotelForm({ ...hotelForm, image_url: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" placeholder="https://images.unsplash.com/..." />
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl bg-[#C19D60] hover:bg-[#a9864c] text-white font-bold text-xs uppercase tracking-wider mt-2">
                                Lưu Khách Sạn
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QUẢN LÝ PHÒNG CỦA KHÁCH SẠN */}
            {selectedHotel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#16191f] w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSelectedHotel(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 text-lg">
                            <FiX />
                        </button>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#C19D60] mb-1">Room Inventory</p>
                        <h3 className="text-xl font-bold mb-6">{selectedHotel.name}</h3>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Danh sách phòng hiện tại ({rooms.length})</h4>
                            {rooms.length === 0 ? (
                                <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                    Chưa có phòng nào. Hãy thêm phòng bên dưới!
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                    {rooms.map(r => (
                                        <div key={r._id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#22262f] border border-gray-200/70 dark:border-white/5 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-sm">Phòng {r.room_number}</span>
                                                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-[#C19D60]/20 text-[#C19D60] font-bold">
                                                    {r.type}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-[#C19D60]">
                                                {r.price_per_night.toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleCreateRoom} className="border-t border-gray-200 dark:border-white/10 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số phòng *</label>
                                <input required value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" placeholder="VD: V301" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạng phòng *</label>
                                <select value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none">
                                    <option value="STANDARD">STANDARD</option>
                                    <option value="DELUXE">DELUXE</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá / Đêm (VNĐ) *</label>
                                <input type="number" min="1000" step="50000" required value={roomForm.price_per_night} onChange={e => setRoomForm({ ...roomForm, price_per_night: Number(e.target.value) })} className="w-full px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#22262f] text-sm outline-none" />
                            </div>
                            <div className="sm:col-span-3">
                                <button type="submit" className="w-full py-3 rounded-xl bg-[#C19D60] hover:bg-[#a9864c] text-white font-bold text-xs uppercase tracking-wider">
                                    + Thêm Phòng & Khởi Tạo Lịch Trống 30 Ngày
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;
