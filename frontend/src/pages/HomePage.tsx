import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiClock, FiMapPin, FiChevronLeft, FiMap, FiCheck, FiWifi, FiCoffee, FiUser, FiSun, FiMoon, FiStar } from 'react-icons/fi';
import { HiStar, HiOutlineLocationMarker } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { useBookingStore, type Room, type Hotel } from '../store/useBookingStore';
import axiosClient from '../api/axiosClient';

const HomePage = () => {
    const { hotels, rooms, locations, isLoading, fetchHotels, fetchRoomsByHotel, fetchLocations, lockRoom, initSocketListeners, confirmBookingDone } = useBookingStore();
    const navigate = useNavigate();

    const [selectedLocation, setSelectedLocation] = useState('Tất cả');
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

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
        const locQuery = selectedLocation === 'Tất cả' ? '' : selectedLocation;
        fetchHotels(locQuery);
    }, [selectedLocation, fetchHotels]);

    // Dark mode toggle effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleLogout = async () => {
        localStorage.removeItem('user');
        toast.success('Đã đăng xuất!');
        navigate('/login');
    };

    const handleSelectHotel = (hotel: Hotel) => {
        setSelectedHotel(hotel);
        fetchRoomsByHotel(hotel._id, checkInDate, checkOutDate);
    };

    const handleLock = async (room: Room) => {
        if (!checkInDate || !checkOutDate) {
            hotelSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            return toast.error('Vui lòng chọn ngày Check-in và Check-out trước!');
        }
        const success = await lockRoom(room._id, checkInDate, checkOutDate);
        if (success) {
            setSelectedRoom(room);
            setShowCheckoutModal(true);
        } else {
            toast.error('Phòng này đã có người khóa. Vui lòng chọn phòng khác!');
        }
    };

    const handleConfirmBooking = async () => {
        if (!customerName || !phoneNumber) return toast.error('Vui lòng nhập đủ thông tin!');
        const loadingId = toast.loading('Đang xử lý đặt phòng...');
        try {
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
                setCustomerName('');
                setPhoneNumber('');
                fetchRoomsByHotel(selectedHotel!._id, checkInDate, checkOutDate); // refresh rooms
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
            <header className={`fixed w-full top-0 z-[80] transition-all duration-500 ${isScrolled ? 'bg-white dark:bg-[#1a1a1a] shadow-xl py-0' : 'bg-transparent py-0'}`}>
                {/* TOP BAR (Hidden on mobile & when scrolled) */}
                <div className={`hidden md:flex justify-between items-center px-10 py-2.5 border-b border-white/10 dark:border-white/10 transition-all duration-300 ${isScrolled ? 'h-0 py-0 opacity-0 overflow-hidden' : 'h-10 opacity-100'}`}>
                    <div className={`flex gap-8 text-[11px] font-bold tracking-widest ${selectedHotel ? 'text-[#777] dark:text-white/80' : 'text-white/80'}`}>
                        <span className="flex items-center gap-2"><FiCoffee className="text-[#C19D60] text-sm" /> booking@smartbooking.com</span>
                        <span className="flex items-center gap-2"><FiMapPin className="text-[#C19D60] text-sm" /> 123 Luxury Avenue, New York</span>
                    </div>
                    <div className={`flex gap-5 text-sm font-bold ${selectedHotel ? 'text-[#777] dark:text-white/80' : 'text-white/80'}`}>
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

                            <nav className={`hidden md:flex gap-8 text-[11px] font-bold tracking-widest uppercase ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                                <a href="#" className="hover:text-[#C19D60] transition-colors flex items-center gap-1">Home <FiChevronLeft className="-rotate-90" /></a>
                                <a href="#" className="hover:text-[#C19D60] transition-colors flex items-center gap-1">Rooms & Suites <FiChevronLeft className="-rotate-90" /></a>
                                <a href="#" className="hover:text-[#C19D60] transition-colors flex items-center gap-1">Pages <FiChevronLeft className="-rotate-90" /></a>
                                <a href="#" className="hover:text-[#C19D60] transition-colors flex items-center gap-1">News <FiChevronLeft className="-rotate-90" /></a>
                                <a href="#" className="hover:text-[#C19D60] transition-colors">Contact</a>
                            </nav>
                        </div>

                        <div className={`flex items-center gap-8 ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                            <FiMapPin className="text-xl hover:text-[#C19D60] cursor-pointer transition-colors hidden md:block" />

                            {/* Icon History (Fake Cart) */}
                            <div className="relative hover:text-[#C19D60] cursor-pointer transition-colors flex items-center gap-1" onClick={() => navigate('/my-bookings')} title="My Bookings">
                                <FiClock className="text-xl" />
                                <span className="bg-[#C19D60] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full -ml-2 -mt-3">0</span>
                            </div>

                            <FiLogOut className="text-xl hover:text-red-500 cursor-pointer transition-colors" onClick={handleLogout} title="Logout" />

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
                                    Lorem ipsum dolor sit amet consectetur adipiscing elit tincidunt hendrer cursus integer ridiculus eros bibendum dictum.
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
                                <div className="flex-1 w-full md:pr-8 opacity-50 cursor-not-allowed">
                                    <label className="block text-[#222] dark:text-gray-300 uppercase tracking-widest font-bold text-[10px] mb-2">Room</label>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#C19D60] font-serif text-sm">Standard Room Size</span>
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
                            <div className="text-center mb-16">
                                <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Our Collection</p>
                                <h3 className="text-4xl font-serif text-[#222] dark:text-gray-100">Handpicked Hotels</h3>
                                <div className="w-24 h-0.5 bg-[#C19D60] mx-auto mt-6"></div>
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
                                                <div className="absolute top-4 right-4 flex text-[#C19D60] text-sm">
                                                    {[...Array(hotel.star_rating)].map((_, i) => <HiStar key={i} className="drop-shadow-md" />)}
                                                </div>
                                            </div>
                                            <div className="p-8 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 text-[#777] text-[10px] font-bold uppercase tracking-widest mb-3">
                                                    <HiOutlineLocationMarker className="text-[#C19D60] text-lg" />
                                                    {hotel.location}
                                                </div>
                                                <h3 className="text-2xl font-serif text-[#222] dark:text-gray-100 mb-4 group-hover:text-[#C19D60] transition-colors">{hotel.name}</h3>
                                                <div className="mt-auto pt-6 border-t border-[#EAE3D2] dark:border-[#333] flex justify-between items-center">
                                                    <p className="text-xs text-[#777] uppercase tracking-widest font-bold">Starting from</p>
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
                    <div className="pt-40 max-w-7xl mx-auto px-6">
                        <div className="mb-16">
                            <h2 className="text-5xl font-serif text-[#222] dark:text-gray-100 mb-4">{selectedHotel.name}</h2>
                            <div className="flex items-center gap-6 text-[#777] text-sm">
                                <span className="flex items-center gap-1"><HiOutlineLocationMarker className="text-[#C19D60] text-lg" /> {selectedHotel.location}</span>
                                <span className="flex items-center gap-1 text-[#C19D60]">
                                    {[...Array(selectedHotel.star_rating)].map((_, i) => <HiStar key={i} />)}
                                </span>
                            </div>
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
                        ) : (
                            <div className="space-y-10">
                                {rooms.map((room) => (
                                    <div key={room._id} className="flex flex-col md:flex-row border border-[#EAE3D2] dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative">

                                        <div className="w-full md:w-2/5 relative overflow-hidden bg-[#111] min-h-[300px] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                                            <img src={`https://images.unsplash.com/photo-${room.type === 'VIP' ? '1582719478250-c89fae4237d8' : '1611892440504-42a792e24d32'}?q=80&w=1000&auto=format&fit=crop`} alt={room.type} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000" />
                                            {room.type === 'VIP' && (
                                                <div className="absolute top-4 left-4 bg-[#C19D60] text-white text-[10px] font-bold py-1.5 px-4 rounded-full uppercase tracking-widest border border-[#A8874E] shadow-lg shadow-[#C19D60]/30 backdrop-blur-md">VIP SUITE</div>
                                            )}
                                        </div>

                                        <div className="w-full md:w-3/5 p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-3xl font-serif text-[#222] dark:text-gray-100 mb-2 group-hover:text-[#C19D60] transition-colors">Room {room.room_number}</h4>
                                                        <p className="text-[#C19D60] text-xs uppercase tracking-widest font-bold">{room.type} CATEGORY</p>
                                                    </div>
                                                </div>
                                                <p className="text-[#777] text-sm leading-relaxed mb-6 font-light">Experience the perfect blend of comfort and luxury in our elegantly designed spaces, tailored for an unforgettable stay.</p>

                                                <div className="flex gap-4 text-[#777] mb-8 border-y border-[#EAE3D2] dark:border-white/10 py-4">
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1 rounded-md" title="Free Wifi"><FiWifi className="text-[#C19D60] text-base" /> WiFi</span>
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1 rounded-md" title="Breakfast"><FiCoffee className="text-[#C19D60] text-base" /> B'fast</span>
                                                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-[#FDFBF7] dark:bg-[#222] px-3 py-1 rounded-md" title="2 Guests"><FiUser className="text-[#C19D60] text-base" /> 2 PPL</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs text-[#777] uppercase tracking-widest mb-1">From</p>
                                                    <p className="text-3xl font-serif text-[#222] dark:text-gray-100">{room.price_per_night.toLocaleString('vi-VN')}đ<span className="text-sm text-[#777] font-sans font-light italic"> /night</span></p>
                                                </div>

                                                {room.is_locked ? (
                                                    <button disabled className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-200/50 dark:bg-white/5 text-[#777] text-xs uppercase tracking-widest font-bold cursor-not-allowed backdrop-blur-sm border border-transparent dark:border-white/10">
                                                        Reserved
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleLock(room)} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#222] hover:bg-[#C19D60] text-white text-xs uppercase tracking-widest font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#C19D60]/40">
                                                        Book Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                        src={`https://images.unsplash.com/photo-${selectedRoom.type === 'VIP' ? '1582719478250-c89fae4237d8' : '1611892440504-42a792e24d32'}?q=80&w=800&auto=format&fit=crop`}
                                        alt={selectedRoom.room_number}
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-3 left-3 bg-[#C19D60] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow">
                                        {selectedRoom.type}
                                    </span>
                                </div>

                                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold mb-1">
                                    {selectedHotel?.name}
                                </p>
                                <h4 className="text-2xl font-serif text-[#222] dark:text-white mb-2">
                                    Room {selectedRoom.room_number}
                                </h4>
                                <p className="text-xs text-[#777] flex items-center gap-1.5 mb-5">
                                    <FiMapPin className="text-[#C19D60]" /> {selectedHotel?.location}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                        <FiWifi className="text-[#C19D60]" /> Free WiFi
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                        <FiCoffee className="text-[#C19D60]" /> Breakfast
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white dark:bg-[#2a2a2a] px-2.5 py-1 rounded-md text-[#555] dark:text-gray-300">
                                        <FiUser className="text-[#C19D60]" /> 2 Guests
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
