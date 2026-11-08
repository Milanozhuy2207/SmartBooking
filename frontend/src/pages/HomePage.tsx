import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiLogIn, FiClock, FiMapPin, FiChevronLeft, FiMap, FiCheck, FiWifi, FiCoffee, FiUser, FiSun, FiMoon, FiStar, FiShield } from 'react-icons/fi';
import { HiStar, HiOutlineLocationMarker } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { useBookingStore, type Room, type Hotel } from '../store/useBookingStore';
import axiosClient from '../api/axiosClient';

const HomePage = () => {
    const { hotels, rooms, locations, isLoading, fetchHotels, fetchRoomsByHotel, fetchLocations, lockRoom, initSocketListeners, confirmBookingDone } = useBookingStore();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState<any>(() => {
        const userStr = localStorage.getItem('user');
        try {
            return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    });
    const [myBookingsCount, setMyBookingsCount] = useState(0);

    const [selectedLocation, setSelectedLocation] = useState('Tất cả');
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [selectedRoomType, setSelectedRoomType] = useState<'ALL' | 'STANDARD' | 'DELUXE' | 'VIP'>('ALL');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [showCheckoutModal, setShowCheckoutModal] = useState(false); useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Mốc cuộn trang
    const hotelSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        initSocketListeners();
        fetchLocations();

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchLocations, initSocketListeners]);

    useEffect(() => {
        if (currentUser) {
            axiosClient.get('/bookings/my-bookings')
                .then(res => {
                    if (Array.isArray(res.data?.data)) {
                        setMyBookingsCount(res.data.data.length);
                    }
                })
                .catch(err => {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('user');
                        setCurrentUser(null);
                    }
                });
        } else {
            setMyBookingsCount(0);
        }
    }, [currentUser]);

    useEffect(() => {
        const locQuery = selectedLocation === 'Tất cả' ? '' : selectedLocation;
        fetchHotels(locQuery);
    }, [selectedLocation, fetchHotels]);

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
            // ignore network error on logout
        }
        localStorage.removeItem('user');
        setCurrentUser(null);
        setMyBookingsCount(0);
        toast.success('Đã đăng xuất!');
        navigate('/login');
    };

    const handleSelectHotel = (hotel: Hotel) => {
        setSelectedHotel(hotel);
        setSelectedRoomType('ALL');
        fetchRoomsByHotel(hotel._id, checkInDate, checkOutDate);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLock = (room: Room) => {
        setSelectedRoom(room);
        if (currentUser) {
            if (!customerName && currentUser.full_name) {
                setCustomerName(currentUser.full_name);
            }
            if (!phoneNumber && currentUser.phone_number) {
                setPhoneNumber(currentUser.phone_number);
            }
        }
        setShowCheckoutModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!checkInDate || !checkOutDate) {
            return toast.error('Vui lòng chọn ngày Check-in và Check-out!');
        }

        if (!customerName || !phoneNumber) return toast.error('Vui lòng nhập đủ thông tin!');
        const loadingId = toast.loading('Đang xử lý đặt phòng...');
        try {
            const canLock = await lockRoom(selectedRoom!._id, checkInDate, checkOutDate);
            if (!canLock) {
                return toast.error('Phòng đã hết chỗ trong khoảng ngày này!', { id: loadingId });
            }

            const res = await axiosClient.post('/bookings/checkout', {
                roomId: selectedRoom?._id,
                customerName,
                phoneNumber,
                checkInDate,
                checkOutDate
            });
            if (res.data.success) {
                toast.success('Đặt phòng thành công!', { id: loadingId });

                // Hủy timeout đếm ngược giữ phòng trên server
                confirmBookingDone(selectedRoom!._id);

                setShowCheckoutModal(false);
                setSelectedRoom(null);
                if (currentUser) {
                    setMyBookingsCount(prev => prev + 1);
                } else {
                    setCustomerName('');
                    setPhoneNumber('');
                }
                fetchRoomsByHotel(selectedHotel!._id, checkInDate, checkOutDate);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi đặt phòng', { id: loadingId });
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

            {/* OFFCANVAS SIDEBAR */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-[#1a1a1a] shadow-2xl z-[100] transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-12 border-b border-[#EAE3D2] dark:border-white/10 pb-6">
                        <span className="flex items-center gap-1 text-2xl font-serif tracking-widest text-[#222] dark:text-white">
                            <span className="text-[#C19D60] text-3xl font-black mr-1">S</span>MARTBOOKING
                        </span>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-[#222] dark:text-white hover:text-[#C19D60] transition-colors">
                            <FiCheck className="text-2xl rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1">
                        <p className="text-[#777] leading-relaxed mb-8 text-sm">Discover the perfect blend of luxury and comfort with our exclusive hotel selections. Your dream stay is just a click away.</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-[#222] dark:text-gray-200">
                                <div className="w-10 h-10 border border-[#EAE3D2] dark:border-white/10 rounded-full flex items-center justify-center text-[#C19D60]"><FiMapPin /></div>
                                <div><p className="text-xs text-[#777] uppercase tracking-widest font-bold mb-1">Address</p><p className="text-sm font-serif">123 Luxury Avenue, NY</p></div>
                            </div>
                            <div className="flex items-center gap-4 text-[#222] dark:text-gray-200">
                                <div className="w-10 h-10 border border-[#EAE3D2] dark:border-white/10 rounded-full flex items-center justify-center text-[#C19D60]"><FiCoffee /></div>
                                <div><p className="text-xs text-[#777] uppercase tracking-widest font-bold mb-1">Email</p><p className="text-sm font-serif">booking@smartbooking.com</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-[#EAE3D2] dark:border-white/10 pt-6">
                        <p className="text-[#777] text-xs uppercase tracking-widest font-bold mb-4">Follow Us</p>
                        <div className="flex gap-4 text-[#222] dark:text-gray-200 font-bold text-sm">
                            <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Fb</span>
                            <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Ig</span>
                            <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Tw</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MẶT NẠ ĐEN KHI SIDEBAR MỞ */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* HEADER COMPONENT */}
            <header className={`fixed w-full top-0 z-[80] transition-all duration-500 ${isScrolled || selectedHotel ? 'bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md shadow-xl py-0' : 'bg-transparent py-0'}`}>
                {/* TOP BAR (Hidden on mobile & when scrolled) */}
                <div className={`hidden md:flex justify-between items-center px-10 py-2.5 border-b border-white/10 dark:border-white/10 transition-all duration-300 ${isScrolled || selectedHotel ? 'h-0 py-0 opacity-0 overflow-hidden' : 'h-10 opacity-100'}`}>
                    <div className="flex gap-8 text-[11px] font-bold tracking-widest text-white/80">
                        <span className="flex items-center gap-2"><FiCoffee className="text-[#C19D60] text-sm" /> booking@smartbooking.com</span>
                        <span className="flex items-center gap-2"><FiMapPin className="text-[#C19D60] text-sm" /> 123 Luxury Avenue, New York</span>
                    </div>
                    <div className="flex gap-5 text-sm font-bold text-white/80">
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Fb</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Ig</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">In</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">Tw</span>
                    </div>
                </div>

                {/* MAIN NAV */}
                <div className="px-6 md:px-10 py-5">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-12">
                            <div className="flex flex-col cursor-pointer group" onClick={() => { setSelectedHotel(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                <span className={`flex items-center gap-1 text-2xl md:text-3xl font-serif tracking-widest group-hover:text-[#C19D60] transition-colors ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                                    <span className="text-[#C19D60] text-4xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                                </span>
                                <span className={`text-[9px] tracking-[0.5em] ml-[44px] -mt-1 font-bold transition-colors ${isScrolled || selectedHotel ? 'text-[#777] dark:text-white/60 group-hover:text-[#C19D60]/80' : 'text-white/60 group-hover:text-white/90'}`}>LUXURY HOTEL</span>
                            </div>

                            <nav className={`hidden lg:flex gap-8 text-[11px] font-bold tracking-widest uppercase ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                                <button onClick={() => { setSelectedHotel(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-[#C19D60] transition-colors flex items-center gap-1 uppercase">Home</button>
                                <button onClick={() => { setSelectedHotel(null); setTimeout(() => hotelSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-[#C19D60] transition-colors flex items-center gap-1 uppercase">Hotels & Suites</button>
                                <button onClick={() => navigate('/my-bookings')} className="hover:text-[#C19D60] transition-colors flex items-center gap-1 uppercase">My Bookings</button>
                            </nav>
                        </div>

                        <div className={`flex items-center gap-5 md:gap-6 ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                            {currentUser?.role === 'ADMIN' && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#C19D60] text-white hover:bg-[#A8874E] transition-colors"
                                >
                                    <FiShield className="text-xs" /> Admin Portal
                                </button>
                            )}
                            {(currentUser?.role === 'VENDOR' || currentUser?.role === 'RECEPTIONIST') && (
                                <button
                                    onClick={() => navigate('/vendor')}
                                    className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#C19D60] text-white hover:bg-[#A8874E] transition-colors"
                                >
                                    <FiShield className="text-xs" /> {currentUser.role === 'RECEPTIONIST' ? 'Front Desk' : 'Vendor Portal'}
                                </button>
                            )}

                            {/* Icon History (My Bookings) */}
                            <div
                                className="relative hover:text-[#C19D60] cursor-pointer transition-colors flex items-center gap-1"
                                onClick={() => navigate('/my-bookings')}
                                title="Lịch sử đặt phòng"
                            >
                                <FiClock className="text-xl" />
                                <span className="bg-[#C19D60] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full -ml-2 -mt-3">
                                    {myBookingsCount}
                                </span>
                            </div>

                            {currentUser ? (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => navigate('/my-bookings')}
                                        className="hidden sm:flex items-center gap-2 text-xs font-bold tracking-wider px-3.5 py-1.5 rounded-full border border-[#C19D60]/50 hover:border-[#C19D60] hover:text-[#C19D60] transition-colors"
                                        title={currentUser.email}
                                    >
                                        <FiUser className="text-[#C19D60]" />
                                        <span className="max-w-[130px] truncate">
                                            {currentUser.full_name || currentUser.email?.split('@')[0]}
                                        </span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="hover:text-red-500 cursor-pointer transition-colors flex items-center"
                                        title="Đăng xuất"
                                    >
                                        <FiLogOut className="text-xl" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-[#C19D60] text-white hover:bg-[#A8874E] transition-colors"
                                >
                                    <FiLogIn className="text-sm" /> Sign In
                                </button>
                            )}

                            {/* HAMBURGER ICON */}
                            <div className="cursor-pointer group flex flex-col gap-1.5" onClick={() => setIsSidebarOpen(true)}>
                                <div className="w-8 h-[2px] bg-current group-hover:bg-[#C19D60] transition-colors"></div>
                                <div className="w-6 h-[2px] bg-current group-hover:bg-[#C19D60] transition-colors ml-auto"></div>
                                <div className="w-8 h-[2px] bg-current group-hover:bg-[#C19D60] transition-colors"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-0">
                {!selectedHotel ? (
                    /* ================= MÀN HÌNH 1: DANH SÁCH KHÁCH SẠN ================= */
                    <>
                        {/* HERO SECTION */}
                        <section className="relative h-screen min-h-[850px] flex items-center justify-center text-center overflow-hidden">
                            <div className="absolute inset-0 bg-[#111]">
                                <img src="https://html.kodesolution.com/2025/hoteler-html/images/banner/banner2-1.jpg" alt="Luxury Hotel" className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_20s_ease-in-out_infinite]" />
                            </div>

                            {/* FROSTED GLASS BOX */}
                            <div className="relative z-10 px-10 py-24 md:px-24 md:py-32 w-[95%] max-w-6xl mx-auto border border-[#C19D60]/40 rounded-[2rem] bg-black/40 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center mt-20">
                                <div className="flex gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map(i => <FiStar key={i} className="text-[#C19D60] fill-[#C19D60]" />)}
                                </div>
                                <h2 className="text-[38px] md:text-[62px] font-serif text-white mb-6 leading-tight drop-shadow-xl text-center">
                                    Book Your Dream Hotel<br />with SmartBooking
                                </h2>
                                <p className="text-white/90 max-w-lg text-center mb-10 text-base font-light">
                                    Trải nghiệm kỳ nghỉ thượng lưu tại hệ thống khách sạn và resort 5 sao hàng đầu Việt Nam với ưu đãi tích điểm thành viên độc quyền.
                                </p>
                                <button
                                    onClick={() => hotelSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="border border-white text-white px-8 py-3 uppercase tracking-widest text-sm font-bold hover:bg-white hover:text-black transition-colors duration-300">
                                    BOOK NOW
                                </button>
                            </div>
                        </section>

                        {/* GLASSMORPHISM BOOKING BAR */}
                        <section className="max-w-6xl mx-auto px-6 relative z-30 -mt-20 mb-10">
                            <div className="bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-between">
                                {/* Destination */}
                                <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-[#EAE3D2] dark:border-white/10 pb-4 md:pb-0 md:pr-8">
                                    <label className="block text-[#222] dark:text-gray-300 uppercase tracking-widest font-bold text-[10px] mb-2">Destination</label>
                                    <div className="flex items-center justify-between">
                                        <select
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                            className="w-full bg-transparent text-[#C19D60] font-serif text-sm outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="Tất cả">All Destinations</option>
                                            {Array.isArray(locations) && locations.map((loc: any, index: number) => {
                                                const locName = loc.name || loc.province_name || loc.title || loc;
                                                return <option key={loc.id || loc.code || index} value={locName}>{locName}</option>;
                                            })}
                                        </select>
                                        <FiMap className="text-[#C19D60] text-lg pointer-events-none opacity-50" />
                                    </div>
                                </div>

                                {/* Check In / Out */}
                                <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-[#EAE3D2] dark:border-white/10 pb-4 md:pb-0 md:pr-8">
                                    <label className="block text-[#222] dark:text-gray-300 uppercase tracking-widest font-bold text-[10px] mb-2">Check In - Out</label>
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={checkInDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setCheckInDate(e.target.value)} className="w-full bg-transparent text-[#C19D60] font-serif text-sm outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" />
                                        <span className="text-[#C19D60] opacity-50">-</span>
                                        <input type="date" value={checkOutDate} min={checkInDate || new Date().toISOString().split('T')[0]} onChange={(e) => setCheckOutDate(e.target.value)} className="w-full bg-transparent text-[#C19D60] font-serif text-sm outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]" />
                                    </div>
                                </div>

                                {/* Room */}
                                <div className="flex-1 w-full md:pr-8 opacity-75">
                                    <label className="block text-[#222] dark:text-gray-300 uppercase tracking-widest font-bold text-[10px] mb-2">Guests & Rooms</label>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#C19D60] font-serif text-sm">2 Adults • 1 Room</span>
                                        <FiUser className="text-[#C19D60] text-lg pointer-events-none" />
                                    </div>
                                </div>

                                {/* Button */}
                                <button
                                    onClick={() => hotelSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-[#C19D60] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#A8874E] hover:shadow-lg hover:shadow-[#C19D60]/30 transition-all duration-300 w-full md:w-auto shrink-0 whitespace-nowrap">
                                    CHECK NOW
                                </button>
                            </div>
                        </section>

                        <main ref={hotelSectionRef} className="max-w-7xl mx-auto px-6 pt-24">
                            <div className="text-center mb-12">
                                <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Vietnam Luxury Collection</p>
                                <h3 className="text-4xl font-serif text-[#222] dark:text-gray-100">Tinh Hoa Khách Sạn & Resort Việt Nam</h3>
                                <div className="w-24 h-0.5 bg-[#C19D60] mx-auto mt-6"></div>
                            </div>

                            {/* THANH PILLS CHỌN NHANH ĐIỂM ĐẾN */}
                            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-14">
                                {['Tất cả', ...locations.map((l: any) => l.name || l.province_name || l.title || l)].map((locName: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedLocation(locName)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                                            selectedLocation === locName
                                                ? 'bg-[#C19D60] text-white border-[#C19D60] shadow-lg shadow-[#C19D60]/30'
                                                : 'bg-white dark:bg-[#1a1a1a] text-[#555] dark:text-gray-300 border-[#EAE3D2] dark:border-[#333] hover:border-[#C19D60] hover:text-[#C19D60]'
                                        }`}
                                    >
                                        {locName === 'Tất cả' ? `Tất cả (${hotels.length})` : locName}
                                    </button>
                                ))}
                            </div>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white dark:bg-[#1a1a1a] p-4 animate-pulse border border-[#EAE3D2] dark:border-[#333]">
                                            <div className="h-72 bg-[#EAE3D2] dark:bg-[#333] mb-6"></div>
                                            <div className="h-6 bg-[#EAE3D2] dark:bg-[#333] w-3/4 mb-3 mx-auto"></div>
                                            <div className="h-4 bg-[#EAE3D2] dark:bg-[#333] w-1/2 mx-auto"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {hotels.map((hotel) => (
                                        <div key={hotel._id} onClick={() => handleSelectHotel(hotel)} className="group cursor-pointer bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] hover:border-[#C19D60] rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full">
                                            <div className="relative h-72 overflow-hidden rounded-t-2xl bg-[#111]">
                                                <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-100" />
                                                <div className="absolute top-4 right-4 flex items-center gap-0.5 text-[#C19D60] text-sm bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-[#C19D60]/30 shadow-md">
                                                    {[...Array(hotel.star_rating)].map((_, i) => <HiStar key={i} className="drop-shadow-md" />)}
                                                    <span className="ml-1.5 text-[10px] font-bold tracking-wider text-white">{hotel.star_rating}★</span>
                                                </div>
                                                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                                    {hotel.rooms?.length || 0} phòng nghỉ
                                                </div>
                                            </div>
                                            <div className="p-8 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 text-[#777] text-[10px] font-bold uppercase tracking-widest mb-2.5">
                                                    <HiOutlineLocationMarker className="text-[#C19D60] text-lg" />
                                                    {hotel.location}
                                                </div>
                                                <h3 className="text-2xl font-serif text-[#222] dark:text-gray-100 mb-2.5 group-hover:text-[#C19D60] transition-colors">{hotel.name}</h3>
                                                {hotel.description && (
                                                    <p className="text-xs text-[#777] dark:text-gray-400 leading-relaxed line-clamp-2 mb-5 font-light">
                                                        {hotel.description}
                                                    </p>
                                                )}
                                                <div className="mt-auto pt-6 border-t border-[#EAE3D2] dark:border-[#333] flex justify-between items-center">
                                                    <p className="text-xs text-[#777] uppercase tracking-widest font-bold">Giá khởi điểm</p>
                                                    <p className="text-xl font-serif text-[#C19D60]">
                                                        {hotel.rooms?.[0]?.price_per_night ? `${hotel.rooms[0].price_per_night.toLocaleString('vi-VN')}đ` : 'Xem chi tiết'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </main>
                    </>
                ) : (
                    /* ================= MÀN HÌNH 2: DANH SÁCH PHÒNG CỦA KHÁCH SẠN ================= */
                    <div className="pt-32 max-w-7xl mx-auto px-6">
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <button
                                    onClick={() => setSelectedHotel(null)}
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C19D60] hover:text-[#222] dark:hover:text-white mb-4 transition-colors"
                                >
                                    <FiChevronLeft className="text-base" /> Quay lại danh sách khách sạn
                                </button>
                                <h2 className="text-4xl md:text-5xl font-serif text-[#222] dark:text-gray-100 mb-3">{selectedHotel.name}</h2>
                                <div className="flex items-center gap-6 text-[#777] text-sm">
                                    <span className="flex items-center gap-1"><HiOutlineLocationMarker className="text-[#C19D60] text-lg" /> {selectedHotel.location}</span>
                                    <span className="flex items-center gap-1 text-[#C19D60]">
                                        {[...Array(selectedHotel.star_rating)].map((_, i) => <HiStar key={i} />)}
                                    </span>
                                </div>
                            </div>

                            {/* Bộ lọc ngày nhanh ngay trong trang chi tiết khách sạn */}
                            <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
                                <div>
                                    <span className="block text-[9px] uppercase tracking-widest text-[#777] font-bold mb-1">Check-In</span>
                                    <input
                                        type="date"
                                        value={checkInDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            setCheckInDate(e.target.value);
                                            if (checkOutDate) fetchRoomsByHotel(selectedHotel._id, e.target.value, checkOutDate);
                                        }}
                                        className="bg-transparent text-xs font-medium text-[#C19D60] outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                                <span className="text-[#C19D60]">→</span>
                                <div>
                                    <span className="block text-[9px] uppercase tracking-widest text-[#777] font-bold mb-1">Check-Out</span>
                                    <input
                                        type="date"
                                        value={checkOutDate}
                                        min={checkInDate || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            setCheckOutDate(e.target.value);
                                            if (checkInDate) fetchRoomsByHotel(selectedHotel._id, checkInDate, e.target.value);
                                        }}
                                        className="bg-transparent text-xs font-medium text-[#C19D60] outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* THANH CHỌN NHANH CÁC HẠNG PHÒNG: STANDARD | DELUXE | VIP */}
                        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE3D2] dark:border-white/10 pb-6">
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { key: 'ALL', label: 'Tất cả hạng phòng', count: rooms.length },
                                    { key: 'STANDARD', label: 'Hạng Standard', count: rooms.filter(r => r.type === 'STANDARD').length },
                                    { key: 'DELUXE', label: 'Hạng Deluxe', count: rooms.filter(r => r.type === 'DELUXE').length },
                                    { key: 'VIP', label: 'Hạng VIP & Villa', count: rooms.filter(r => r.type === 'VIP').length }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setSelectedRoomType(tab.key as any)}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border flex items-center gap-2 ${
                                            selectedRoomType === tab.key
                                                ? 'bg-[#C19D60] text-white border-[#C19D60] shadow-lg shadow-[#C19D60]/30'
                                                : 'bg-white dark:bg-[#1a1a1a] text-[#555] dark:text-gray-300 border-[#EAE3D2] dark:border-white/10 hover:border-[#C19D60] hover:text-[#C19D60]'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                            selectedRoomType === tab.key ? 'bg-black/25 text-white' : 'bg-[#F4EFE6] dark:bg-white/10 text-[#C19D60]'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[#777] italic">
                                Đang hiển thị <strong className="text-[#C19D60] not-italic">{selectedRoomType === 'ALL' ? rooms.length : rooms.filter(r => r.type === selectedRoomType).length}</strong> phòng trống thực tế tại {selectedHotel.name}
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="space-y-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-64 bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] animate-pulse flex">
                                        <div className="w-1/3 bg-[#EAE3D2] dark:bg-[#333]"></div>
                                        <div className="w-2/3 p-8">
                                            <div className="h-8 bg-[#EAE3D2] dark:bg-[#333] w-1/2 mb-4"></div>
                                            <div className="h-4 bg-[#EAE3D2] dark:bg-[#333] w-1/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="bg-white dark:bg-[#1a1a1a] p-16 text-center rounded-2xl border border-[#EAE3D2] dark:border-white/10">
                                <p className="text-lg font-serif text-[#222] dark:text-white mb-2">Hết phòng trống trong khoảng ngày này</p>
                                <p className="text-sm text-[#777]">Vui lòng chọn khoảng ngày Check-in / Check-out khác để tìm phòng trống.</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {([
                                    {
                                        type: 'STANDARD' as const,
                                        badge: 'MỤC 01 • STANDARD COLLECTION',
                                        title: 'Hạng Phòng Tiêu Chuẩn (Standard & Classic Rooms)',
                                        subtitle: 'Không gian nghỉ dưỡng tinh tế, đầy đủ tiện nghi 5 sao với ban công thoáng đãng hướng vườn, phố cổ hoặc vịnh biển.'
                                    },
                                    {
                                        type: 'DELUXE' as const,
                                        badge: 'MỤC 02 • DELUXE PREMIER COLLECTION',
                                        title: 'Hạng Phòng Cao Cấp (Deluxe Suites & Club Rooms)',
                                        subtitle: 'Diện tích rộng rãi, tầm nhìn Panorama đắt giá kèm đặc quyền Club Lounge, trà chiều hoặc hồ bơi riêng.'
                                    },
                                    {
                                        type: 'VIP' as const,
                                        badge: 'MỤC 03 • VIP SUITE & POOL VILLA',
                                        title: 'Hạng Tổng Thống & Biệt Thự (Presidential Suites & Villas)',
                                        subtitle: 'Đỉnh cao xa xỉ dành cho giới thượng lưu với hồ bơi vô cực riêng biệt, quản gia Butler 24/7 và không gian biệt lập tuyệt đối.'
                                    }
                                ])
                                    .filter(section => selectedRoomType === 'ALL' || selectedRoomType === section.type)
                                    .map((section) => {
                                        const sectionRooms = rooms.filter(r => r.type === section.type);
                                        if (sectionRooms.length === 0) return null;
                                        const isExpanded = !!expandedSections[section.type] || selectedRoomType !== 'ALL';
                                        const displayedRooms = isExpanded ? sectionRooms : sectionRooms.slice(0, 6);

                                        return (
                                            <section key={section.type} className="space-y-8">
                                                {/* Header của từng Mục (STANDARD / DELUXE / VIP) + Sơ đồ chọn nhanh 60 phòng */}
                                                <div className="bg-white dark:bg-[#161616] border border-[#EAE3D2] dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-[#C19D60] bg-[#C19D60]/10 px-3 py-1 rounded-full mb-2.5">
                                                                {section.badge}
                                                            </span>
                                                            <h3 className="text-2xl md:text-3xl font-serif text-[#222] dark:text-white mb-1.5">
                                                                {section.title}
                                                            </h3>
                                                            <p className="text-xs md:text-sm text-[#777] dark:text-gray-400 font-light">
                                                                {section.subtitle}
                                                            </p>
                                                        </div>
                                                        <div className="shrink-0 text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-[#EAE3D2] dark:border-white/10">
                                                            <p className="text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">
                                                                Quỹ phòng hạng {section.type}
                                                            </p>
                                                            <p className="text-2xl font-serif text-[#C19D60] font-bold">
                                                                {sectionRooms.length} phòng
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Sơ đồ Mã phòng chọn nhanh (Quick Room Matrix) */}
                                                    <div className="pt-4 border-t border-[#EAE3D2] dark:border-white/10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[10px] uppercase tracking-widest font-bold text-[#777]">
                                                                Sơ đồ chọn nhanh theo Số phòng ({sectionRooms.length} phòng • Bấm vào mã phòng để đặt ngay):
                                                            </p>
                                                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Còn trống
                                                                </span>
                                                                <span className="flex items-center gap-1 text-gray-400">
                                                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> Đang giữ chỗ
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {sectionRooms.map((r) => (
                                                                <button
                                                                    key={r._id}
                                                                    disabled={r.is_locked}
                                                                    onClick={() => handleLock(r)}
                                                                    title={`${r.name || r.room_number} - ${r.price_per_night.toLocaleString('vi-VN')}đ/đêm`}
                                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all border ${
                                                                        r.is_locked
                                                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/5 cursor-not-allowed line-through'
                                                                            : 'bg-[#FDFBF7] dark:bg-[#222] text-[#222] dark:text-gray-200 border-[#EAE3D2] dark:border-white/10 hover:bg-[#C19D60] hover:text-white hover:border-[#C19D60] shadow-xs'
                                                                    }`}
                                                                >
                                                                    {r.room_number}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Danh sách các thẻ phòng chi tiết trong Mục */}
                                                <div className="space-y-8">
                                                    {displayedRooms.map((room) => (
                                                        <div key={room._id} className="flex flex-col md:flex-row border border-[#EAE3D2] dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">

                                                            <div className="w-full md:w-2/5 relative overflow-hidden bg-[#111] min-h-[300px]">
                                                                <img
                                                                    src={room.image_url || (room.type === 'VIP' ? '/rooms/luxury-room-22.jpg' : '/rooms/luxury-room-1.jpg')}
                                                                    alt={room.name || `Room ${room.room_number}`}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/rooms/luxury-room-1.jpg';
                                                                    }}
                                                                    className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:scale-110 transition-transform duration-1000"
                                                                />
                                                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                                                    {room.type === 'VIP' && (
                                                                        <span className="bg-[#C19D60] text-white text-[10px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest border border-[#A8874E] shadow-lg shadow-[#C19D60]/30 backdrop-blur-md">
                                                                            VIP SUITE & VILLA
                                                                        </span>
                                                                    )}
                                                                    {room.type === 'DELUXE' && (
                                                                        <span className="bg-black/70 text-[#C19D60] text-[10px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest border border-[#C19D60]/40 backdrop-blur-md">
                                                                            DELUXE PREMIER
                                                                        </span>
                                                                    )}
                                                                    {room.type === 'STANDARD' && (
                                                                        <span className="bg-black/65 text-white text-[10px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest border border-white/20 backdrop-blur-md">
                                                                            STANDARD LUXURY
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1 rounded-lg border border-white/15">
                                                                    Mã phòng: <span className="text-[#C19D60]">{room.room_number}</span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full md:w-3/5 p-8 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                                                        <div>
                                                                            <p className="text-[#C19D60] text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
                                                                                {room.type} CATEGORY • PHÒNG {room.room_number}
                                                                            </p>
                                                                            <h4 className="text-2xl md:text-3xl font-serif text-[#222] dark:text-gray-100 group-hover:text-[#C19D60] transition-colors">
                                                                                {room.name || `Room ${room.room_number}`}
                                                                            </h4>
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-[#777] dark:text-gray-400 text-sm leading-relaxed mb-6 font-light">
                                                                        {room.description || 'Không gian nghỉ dưỡng sang trọng bậc nhất, kết hợp hài hòa giữa kiến trúc tinh tế và tiện nghi 5 sao.'}
                                                                    </p>

                                                                    <div className="flex flex-wrap gap-2.5 text-[#555] dark:text-gray-300 mb-8 border-y border-[#EAE3D2] dark:border-white/10 py-4">
                                                                        {room.area && (
                                                                            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                                📐 {room.area}
                                                                            </span>
                                                                        )}
                                                                        {room.bed_type && (
                                                                            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                                🛏️ {room.bed_type}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                            <FiUser className="text-[#C19D60]" /> {room.max_guests || 2} Khách
                                                                        </span>
                                                                        {room.view && (
                                                                            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                                <FiMapPin className="text-[#C19D60]" /> {room.view}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                            <FiCoffee className="text-[#C19D60]" /> Bữa sáng 5★
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1.5 rounded-lg border border-[#EAE3D2] dark:border-white/5">
                                                                            <FiWifi className="text-[#C19D60]" /> Free WiFi
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                                    <div className="text-center sm:text-left">
                                                                        <p className="text-[10px] text-[#777] uppercase tracking-widest font-bold mb-1">Giá niêm yết / đêm</p>
                                                                        <p className="text-3xl font-serif text-[#222] dark:text-gray-100">
                                                                            {room.price_per_night.toLocaleString('vi-VN')}đ
                                                                            <span className="text-xs text-[#777] font-sans font-light italic"> /đêm</span>
                                                                        </p>
                                                                    </div>

                                                                    {room.is_locked ? (
                                                                        <button disabled className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-200/50 dark:bg-white/5 text-[#777] text-xs uppercase tracking-widest font-bold cursor-not-allowed backdrop-blur-sm border border-transparent dark:border-white/10">
                                                                            Đang được giữ chỗ
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => handleLock(room)} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#222] hover:bg-[#C19D60] text-white text-xs uppercase tracking-widest font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#C19D60]/40">
                                                                            Đặt Phòng Ngay
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {selectedRoomType === 'ALL' && sectionRooms.length > 6 && (
                                                    <div className="text-center pt-2">
                                                        <button
                                                            onClick={() => setExpandedSections(prev => ({ ...prev, [section.type]: !prev[section.type] }))}
                                                            className="px-8 py-3.5 rounded-full border border-[#C19D60] text-[#C19D60] hover:bg-[#C19D60] hover:text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm"
                                                        >
                                                            {isExpanded
                                                                ? `Thu gọn danh sách hạng ${section.type}`
                                                                : `Xem toàn bộ ${sectionRooms.length} phòng hạng ${section.type} (+${sectionRooms.length - 6} phòng)`}
                                                        </button>
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODERN OTA CHECKOUT MODAL */}
            {showCheckoutModal && selectedRoom && (
                <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[110] flex items-center justify-center p-4 transition-opacity">
                    <div className="bg-white dark:bg-[#161616] w-full max-w-3xl shadow-2xl shadow-black/50 rounded-3xl overflow-hidden relative border border-[#EAE3D2] dark:border-white/10 grid grid-cols-1 md:grid-cols-12 max-h-[92vh] overflow-y-auto">

                        {/* CỘT TRÁI: THÔNG TIN PHÒNG & BẢNG TÍNH TIỀN (OTA SUMMARY) */}
                        <div className="md:col-span-5 bg-[#F8F5F0] dark:bg-[#1f1f1f] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#EAE3D2] dark:border-white/10">
                            <div>
                                <div className="relative h-44 rounded-2xl overflow-hidden mb-5 shadow-md">
                                    <img
                                        src={selectedRoom.image_url || (selectedRoom.type === 'VIP' ? '/rooms/luxury-room-22.jpg' : '/rooms/luxury-room-1.jpg')}
                                        alt={selectedRoom.room_number}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/rooms/luxury-room-1.jpg';
                                        }}
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-3 left-3 bg-[#C19D60] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow">
                                        {selectedRoom.type}
                                    </span>
                                </div>

                                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold mb-1">
                                    {selectedHotel?.name} • Phòng {selectedRoom.room_number}
                                </p>
                                <h4 className="text-xl font-serif text-[#222] dark:text-white mb-2 leading-snug">
                                    {selectedRoom.name || `Room ${selectedRoom.room_number}`}
                                </h4>
                                <p className="text-xs text-[#777] flex items-center gap-1.5 mb-5">
                                    <FiMapPin className="text-[#C19D60]" /> {selectedRoom.view ? `${selectedRoom.view} • ${selectedHotel?.location}` : selectedHotel?.location}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {selectedRoom.area && (
                                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                            📐 {selectedRoom.area}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                        <FiUser className="text-[#C19D60]" /> {selectedRoom.max_guests || 2} Khách
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                        <FiCoffee className="text-[#C19D60]" /> Bữa sáng 5★
                                    </span>
                                </div>
                            </div>

                            {/* CHI TIẾT GIÁ (PRICE BREAKDOWN) */}
                            {(() => {
                                const nights = checkInDate && checkOutDate
                                    ? Math.max(0, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
                                    : 0;
                                const totalPrice = nights * selectedRoom.price_per_night;
                                return (
                                    <div className="border-t border-[#EAE3D2] dark:border-white/10 pt-4 space-y-2.5 text-sm">
                                        <div className="flex justify-between text-[#666] dark:text-gray-400">
                                            <span>Đơn giá mỗi đêm</span>
                                            <span className="font-semibold text-[#222] dark:text-gray-200">{selectedRoom.price_per_night.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between text-[#666] dark:text-gray-400">
                                            <span>Thời gian lưu trú</span>
                                            <span className="font-semibold text-[#222] dark:text-gray-200">{nights > 0 ? `${nights} đêm` : 'Chưa chọn ngày'}</span>
                                        </div>
                                        <div className="flex justify-between text-[#666] dark:text-gray-400">
                                            <span>Thuế & Phí dịch vụ</span>
                                            <span className="text-green-600 dark:text-green-400 text-xs font-bold uppercase">Miễn phí</span>
                                        </div>
                                        <div className="flex justify-between items-baseline border-t border-[#EAE3D2] dark:border-white/10 pt-3 mt-2">
                                            <span className="text-xs uppercase tracking-widest font-bold text-[#222] dark:text-white">Tổng thanh toán</span>
                                            <span className="text-xl font-serif font-bold text-[#C19D60]">
                                                {(nights > 0 ? totalPrice : selectedRoom.price_per_night).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* CỘT PHẢI: CHỌN LỊCH CHECK-IN/OUT & THÔNG TIN KHÁCH HÀNG */}
                        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold">Reservation</p>
                                        <h3 className="text-2xl font-serif text-[#222] dark:text-gray-100">Complete Your Stay</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowCheckoutModal(false)}
                                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center hover:bg-[#C19D60] hover:text-white transition-colors"
                                    >
                                        <FiCheck className="text-lg rotate-45" />
                                    </button>
                                </div>

                                {/* BƯỚC 1: CHỌN NGÀY TRONG MODAL (GIỐNG AIRBNB / BOOKING.COM) */}
                                <div className="mb-6">
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">
                                        1. Select Dates (Check-in & Check-out) *
                                    </label>
                                    <div className="grid grid-cols-2 border border-[#EAE3D2] dark:border-white/15 rounded-xl overflow-hidden bg-[#FDFBF7] dark:bg-[#222]/60">
                                        <div className="p-3 border-r border-[#EAE3D2] dark:border-white/15">
                                            <span className="block text-[9px] uppercase tracking-widest text-[#C19D60] font-bold mb-1">Check-In</span>
                                            <input
                                                type="date"
                                                value={checkInDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                className="w-full bg-transparent text-xs md:text-sm font-medium text-[#222] dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <span className="block text-[9px] uppercase tracking-widest text-[#C19D60] font-bold mb-1">Check-Out</span>
                                            <input
                                                type="date"
                                                value={checkOutDate}
                                                min={checkInDate || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setCheckOutDate(e.target.value)}
                                                className="w-full bg-transparent text-xs md:text-sm font-medium text-[#222] dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* BƯỚC 2: THÔNG TIN KHÁCH HÀNG */}
                                <div className="space-y-4">
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777]">
                                        2. Guest Information *
                                    </label>
                                    <div>
                                        <span className="block text-[10px] text-[#777] mb-1">Full Name</span>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full bg-[#FDFBF7] dark:bg-[#222]/60 border border-[#EAE3D2] dark:border-white/15 rounded-xl text-[#222] dark:text-white px-4 py-3 text-sm outline-none focus:border-[#C19D60] transition-colors"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-[#777] mb-1">Phone Number</span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full bg-[#FDFBF7] dark:bg-[#222]/60 border border-[#EAE3D2] dark:border-white/15 rounded-xl text-[#222] dark:text-white px-4 py-3 text-sm outline-none focus:border-[#C19D60] transition-colors"
                                            placeholder="0901 234 567"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* NÚT XÁC NHẬN ĐẶT PHÒNG */}
                            <div className="pt-6 mt-6 border-t border-[#EAE3D2] dark:border-white/10 flex gap-3">
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="px-6 py-3.5 rounded-xl text-xs font-bold text-[#777] dark:text-gray-300 uppercase tracking-widest border border-[#EAE3D2] dark:border-white/15 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    className="flex-1 py-3.5 rounded-xl text-xs font-bold text-white uppercase tracking-widest bg-[#C19D60] hover:bg-[#A8874E] transition-all duration-300 shadow-lg shadow-[#C19D60]/25 flex items-center justify-center gap-2"
                                >
                                    Confirm & Book Now <FiCheck className="text-base" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="bg-white dark:bg-[#111] border-t border-[#EAE3D2] dark:border-white/10 pt-20 pb-10 px-6 mt-20 transition-colors duration-500">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
                    <div>
                        <h1 className="text-3xl font-serif tracking-widest uppercase text-[#222] dark:text-white mb-6">Smart<span className="text-[#C19D60]">Booking</span></h1>
                        <p className="text-[#777] font-light text-sm leading-relaxed">Experience the highest level of luxury and comfort. Your perfect getaway begins right here with us.</p>
                    </div>
                    <div>
                        <h4 className="text-[#222] dark:text-white font-serif text-lg mb-6">Contact Us</h4>
                        <p className="text-[#777] text-sm mb-3 hover:text-[#C19D60] transition-colors cursor-pointer">123 Luxury Avenue, NY 10001</p>
                        <p className="text-[#777] text-sm mb-3 hover:text-[#C19D60] transition-colors cursor-pointer">+1 234 567 890</p>
                        <p className="text-[#777] text-sm hover:text-[#C19D60] transition-colors cursor-pointer">booking@smartbooking.com</p>
                    </div>
                    <div>
                        <h4 className="text-[#222] dark:text-white font-serif text-lg mb-6">Quick Links</h4>
                        <ul className="text-[#777] text-sm space-y-3 font-light">
                            <li className="hover:text-[#C19D60] transition-colors cursor-pointer">About Us</li>
                            <li className="hover:text-[#C19D60] transition-colors cursor-pointer">Our Rooms</li>
                            <li className="hover:text-[#C19D60] transition-colors cursor-pointer">Services</li>
                            <li className="hover:text-[#C19D60] transition-colors cursor-pointer">Blog</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[#222] dark:text-white font-serif text-lg mb-6">Newsletter</h4>
                        <p className="text-[#777] text-sm font-light mb-4">Subscribe to our newsletter for exclusive offers and updates.</p>
                        <div className="flex">
                            <input type="email" placeholder="Email Address" className="bg-transparent border border-[#EAE3D2] dark:border-white/20 text-[#222] dark:text-white px-4 py-3 w-full outline-none focus:border-[#C19D60] text-sm" />
                            <button className="bg-[#C19D60] text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#A8874E] transition-colors">GO</button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto text-center border-t border-[#EAE3D2] dark:border-white/10 pt-8 text-[#555] text-xs font-bold uppercase tracking-widest">
                    &copy; 2026 SmartBooking. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
