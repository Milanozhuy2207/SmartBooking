import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiClock, FiMapPin, FiChevronLeft, FiMap, FiCheck, FiHeart, FiWifi, FiCoffee, FiUser, FiAlertCircle, FiSun, FiMoon, FiStar, FiCalendar } from 'react-icons/fi';
import { HiStar, HiOutlineLocationMarker } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import { useBookingStore, type Room, type Hotel } from '../store/useBookingStore';
import axiosClient from '../api/axiosClient';

const HomePage = () => {
    const { hotels, rooms, locations, isLoading, fetchHotels, fetchRoomsByHotel, fetchLocations, lockRoom, initSocketListeners } = useBookingStore();
    const navigate = useNavigate();

    const [selectedLocation, setSelectedLocation] = useState('Tất cả');
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [likedHotels, setLikedHotels] = useState<string[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

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

    const handleLogout = async () => {
        toast.success('Đã đăng xuất!');
        navigate('/login');
    };

    const handleSelectHotel = (hotel: Hotel) => {
        setSelectedHotel(hotel);
        fetchRoomsByHotel(hotel._id);
    };

    const handleLock = (room: Room) => {
        lockRoom(room._id);
        setSelectedRoom(room);
        setShowCheckoutModal(true);
    };

    const toggleLike = (e: React.MouseEvent, hotelId: string) => {
        e.stopPropagation();
        setLikedHotels(prev => prev.includes(hotelId) ? prev.filter(id => id !== hotelId) : [...prev, hotelId]);
    }

    const handleConfirmBooking = async () => {
        if (!customerName || !phoneNumber) return toast.error('Vui lòng nhập đủ thông tin!');
        const loadingId = toast.loading('Đang xử lý đặt phòng...');
        try {
            const res = await axiosClient.post('/bookings/checkout', {
                roomId: selectedRoom?._id,
                customerName,
                phoneNumber
            });
            if (res.data.success) {
                toast.success('Đã đặt thành công phòng!', { id: loadingId });
                setShowCheckoutModal(false);
                if (selectedHotel) fetchRoomsByHotel(selectedHotel._id);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi đặt phòng', { id: loadingId });
        }
    };

    return (
        <div className={`min-h-screen font-sans selection:bg-[#C19D60] selection:text-white pb-20 transition-colors duration-500 ${isDarkMode ? 'dark bg-[#111] text-white' : 'bg-[#FDFBF7] text-[#222]'}`}>
                        {/* FLOATING DARK MODE TOGGLE */}
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="fixed bottom-8 right-8 z-[100] p-4 rounded-full shadow-2xl bg-white dark:bg-[#222] border border-[#EAE3D2] dark:border-[#444] hover:scale-110 transition-all duration-300 flex items-center justify-center group"
                title="Toggle Dark Mode"
            >
                {isDarkMode ? <FiSun className="text-2xl text-[#C19D60] group-hover:animate-spin-slow" /> : <FiMoon className="text-2xl text-[#C19D60] group-hover:-rotate-12 transition-transform" />}
            </button>
            <Toaster position="top-center" toastOptions={{ style: { borderRadius: '0', backgroundColor: '#222', color: '#fff' } }} />

            {/* RIGHT SIDEBAR (OFFCANVAS MENU) */}
            <div className={`fixed inset-0 z-[200] transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
                
                {/* Sidebar */}
                <div className={`absolute top-0 right-0 h-full w-80 md:w-[400px] bg-[#111] shadow-2xl transition-transform duration-500 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-8 md:p-12 flex justify-between items-center border-b border-white/10">
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 text-2xl font-serif tracking-[0.1em] text-white">
                                <span className="text-[#C19D60] text-3xl font-black">S</span>MARTBOOKING
                            </span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-[#C19D60] transition-colors text-4xl leading-none">&times;</button>
                    </div>
                    
                    <div className="p-8 md:p-12 flex-1 overflow-y-auto">
                        <h4 className="text-white font-serif text-2xl mb-6">About Us</h4>
                        <p className="text-[#777] text-sm leading-relaxed mb-12 font-light">
                            Discover the perfect blend of luxury and comfort. We provide world-class accommodation and unparalleled services to make your stay unforgettable.
                        </p>
                        
                        <h4 className="text-white font-serif text-2xl mb-6">Contact Info</h4>
                        <ul className="space-y-6 mb-12">
                            <li className="flex items-start gap-4 text-[#777] text-sm font-light hover:text-[#C19D60] transition-colors cursor-pointer">
                                <FiMapPin className="text-[#C19D60] mt-1 text-xl" />
                                <span>88 Broklyn Golden Street,<br/>New York, USA</span>
                            </li>
                            <li className="flex items-center gap-4 text-[#777] text-sm font-light hover:text-[#C19D60] transition-colors cursor-pointer">
                                <FiCoffee className="text-[#C19D60] text-xl" />
                                <span>needhelp@company.com</span>
                            </li>
                            <li className="flex items-center gap-4 text-[#777] text-sm font-light hover:text-[#C19D60] transition-colors cursor-pointer">
                                <span className="text-[#C19D60] font-bold text-xl">☏</span>
                                <span>+1 234 567 890</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="p-8 md:p-12 border-t border-white/10">
                        <div className="flex gap-4 text-white/80">
                            <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C19D60] hover:border-[#C19D60] cursor-pointer transition-colors">f</span>
                            <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C19D60] hover:border-[#C19D60] cursor-pointer transition-colors">ig</span>
                            <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C19D60] hover:border-[#C19D60] cursor-pointer transition-colors">in</span>
                            <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C19D60] hover:border-[#C19D60] cursor-pointer transition-colors">X</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHECKOUT */}
            {showCheckoutModal && selectedRoom && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCheckoutModal(false)}></div>
                    <div className="relative bg-[#FDFBF7] dark:bg-[#111] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300 rounded-none border border-[#EAE3D2] dark:border-[#333]">
                        <div className="bg-[#111111] p-8 text-center border-b border-[#333]">
                            <h3 className="text-2xl text-white font-serif tracking-wider uppercase mb-2">Reservation</h3>
                            <p className="text-[#C19D60] font-medium text-sm flex items-center justify-center gap-1 uppercase tracking-widest"><HiOutlineLocationMarker /> {selectedHotel?.name}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center pb-6 border-b border-[#EAE3D2] dark:border-[#333]">
                                <div>
                                    <p className="text-xs text-[#777] uppercase tracking-widest mb-1">SELECTED ROOM</p>
                                    <p className="text-xl font-serif text-[#222] dark:text-gray-100">Room {selectedRoom.room_number}</p>
                                    <span className="text-xs font-bold text-[#C19D60] tracking-widest uppercase mt-1 block">{selectedRoom.type}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#777] uppercase tracking-widest mb-1">PRICE</p>
                                    <p className="text-xl font-serif text-[#222] dark:text-gray-100">{selectedRoom.price_per_night.toLocaleString('vi-VN')}₫</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-[#222] dark:text-gray-100 uppercase tracking-widest mb-2">Guest Name</label>
                                    <input type="text" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] focus:border-[#C19D60] focus:ring-1 focus:ring-[#C19D60] outline-none transition-all placeholder:text-[#AAA]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#222] dark:text-gray-100 uppercase tracking-widest mb-2">Phone Number</label>
                                    <input type="tel" placeholder="+84 987 654 321" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] focus:border-[#C19D60] focus:ring-1 focus:ring-[#C19D60] outline-none transition-all placeholder:text-[#AAA]" />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 pt-0 flex gap-4">
                            <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-4 text-xs font-bold text-[#222] dark:text-gray-100 uppercase tracking-widest border border-[#222] hover:bg-[#222] hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleConfirmBooking} className="flex-1 py-4 text-xs font-bold text-white uppercase tracking-widest bg-[#C19D60] hover:bg-[#A8874E] transition-colors flex items-center justify-center gap-2">Confirm <FiCheck /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER WRAPPER */}
            <div className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${isScrolled || selectedHotel ? 'bg-white dark:bg-[#111] border-[#EAE3D2] dark:border-white/10 shadow-2xl' : 'bg-transparent border-white/20 dark:border-white/20'}`}>
                
                {/* TOP BAR (Hidden on mobile & when scrolled) */}
                <div className={`hidden md:flex justify-between items-center px-10 py-2.5 border-b border-white/10 transition-all duration-300 ${isScrolled ? 'h-0 py-0 opacity-0 overflow-hidden' : 'h-10 opacity-100'}`}>
                    <div className="flex gap-5 text-white/80 dark:text-white/80 text-sm font-bold">
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">f</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">ig</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">in</span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">X</span>
                    </div>
                    <div className="flex gap-8 text-white/80 dark:text-white/80 text-[11px] font-bold tracking-widest">
                        <span className="flex items-center gap-2"><FiCoffee className="text-[#C19D60] text-sm"/> needhelp@company.com</span>
                        <span className="flex items-center gap-2"><FiMapPin className="text-[#C19D60] text-sm"/> 88 Broklyn Golden Street, New York</span>
                    </div>
                </div>

                {/* MAIN NAV */}
                <header className="px-6 md:px-10 py-5 flex justify-between items-center">
                    {/* LOGO */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedHotel(null)}>
                        <div className="flex flex-col">
                            <span className={`flex items-center gap-1 text-2xl md:text-3xl font-serif tracking-widest ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                                <span className="text-[#C19D60] text-4xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                            </span>
                            <span className={`text-[9px] tracking-[0.5em] ml-[44px] -mt-1 font-bold ${isScrolled || selectedHotel ? 'text-[#777] dark:text-white/60' : 'text-white/60'}`}>LUXURY HOTEL</span>
                        </div>
                    </div>

                    {/* DESKTOP MENU */}
                    <nav className={`hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.15em] ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors text-[#C19D60]">HOME <span className="text-[10px]">▼</span></span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">ROOMS & SUITES <span className="text-[10px]">▼</span></span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">PAGES <span className="text-[10px]">▼</span></span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">NEWS <span className="text-[10px]">▼</span></span>
                        <span className="hover:text-[#C19D60] cursor-pointer transition-colors">CONTACT</span>
                    </nav>

                    {/* ICONS & ACTIONS */}
                    <div className={`flex items-center gap-6 ${isScrolled || selectedHotel ? 'text-[#222] dark:text-white' : 'text-white'}`}>
                        <div className="hidden sm:block hover:text-[#C19D60] cursor-pointer transition-colors">
                            <FiMap className="text-xl" />
                        </div>
                        
                        {/* Icon History (Fake Cart) */}
                        <div className="relative hover:text-[#C19D60] cursor-pointer transition-colors flex items-center gap-1" onClick={() => navigate('/my-bookings')} title="My Bookings">
                            <FiClock className="text-xl" />
                            <span className="bg-[#C19D60] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full -ml-2 -mt-3">0</span>
                        </div>
                        
                        {/* Menu & Logout */}
                        <div className={`flex items-center gap-4 pl-4 border-l ${isScrolled || selectedHotel ? 'border-[#EAE3D2] dark:border-white/20' : 'border-white/20'}`}>
                            <FiLogOut onClick={handleLogout} className="text-xl hover:text-red-400 cursor-pointer transition-colors" title="Logout" />
                            <div className="space-y-1.5 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setIsSidebarOpen(true)}>
                                <div className={`w-6 h-0.5 ${isScrolled || selectedHotel ? 'bg-[#222] dark:bg-white' : 'bg-white'}`}></div>
                                <div className={`w-6 h-0.5 ${isScrolled || selectedHotel ? 'bg-[#222] dark:bg-white' : 'bg-white'}`}></div>
                                <div className={`w-6 h-0.5 ${isScrolled || selectedHotel ? 'bg-[#222] dark:bg-white' : 'bg-white'}`}></div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

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
                                Book Your Dream Hotel<br/>with SmartBooking
                            </h2>
                            <p className="text-white/90 max-w-lg text-center mb-10 text-base font-light">
                                Lorem ipsum dolor sit amet consectetur adipiscing elit tincidunt hendrer cursus integer ridiculus eros bibendum dictum.
                            </p>
                            <button className="border border-white text-white px-8 py-3 uppercase tracking-widest text-sm font-bold hover:bg-white hover:text-black transition-colors duration-300">
                                BOOK NOW
                            </button>
                        </div>
                    </section>
                    
                    {/* HOTELER BOOKING BAR (DARK WIDE) */}
                    <section className="w-full bg-[#1e1e1e] dark:bg-[#111] py-8 px-6 border-b-4 border-[#C19D60]">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
                            {/* Destination */}
                            <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-8">
                                <label className="block text-white uppercase tracking-widest font-bold text-xs mb-2">Destination</label>
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
                                    <FiMap className="text-[#777] text-lg" />
                                </div>
                            </div>
                            
                            {/* Check In / Out */}
                            <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-8 opacity-50 cursor-not-allowed">
                                <label className="block text-white uppercase tracking-widest font-bold text-xs mb-2">Check In - Out</label>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#C19D60] font-serif text-sm">Select Dates</span>
                                    <FiCalendar className="text-[#777] text-lg" />
                                </div>
                            </div>
                            
                            {/* Room */}
                            <div className="flex-1 w-full md:pr-8 opacity-50 cursor-not-allowed">
                                <label className="block text-white uppercase tracking-widest font-bold text-xs mb-2">Room</label>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#C19D60] font-serif text-sm">Standard Room Size</span>
                                    <FiUser className="text-[#777] text-lg" />
                                </div>
                            </div>
                            
                            {/* Button */}
                            <button className="bg-[#C19D60] text-white px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-[#A8874E] transition-colors w-full md:w-auto shrink-0 whitespace-nowrap" onClick={() => {}}>
                                CHECK NOW
                            </button>
                        </div>
                    </section>

                    {/* ABOUT SECTION */}
                    <section className="py-24 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 relative">
                            <div className="absolute -inset-4 border border-[#C19D60] z-0 hidden md:block"></div>
                            <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop" className="w-full h-[500px] object-cover relative z-10 shadow-2xl" alt="About Luxury" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Since 1990</p>
                            <h3 className="text-4xl md:text-5xl font-serif text-[#222] dark:text-gray-100 mb-6 leading-tight">Experience The <br/>Ultimate Luxury</h3>
                            <p className="text-[#777] leading-relaxed font-light mb-8">
                                Welcome to SmartBooking, where elegance meets unparalleled service. 
                                Immerse yourself in a world of refined comfort and create unforgettable memories in our meticulously designed properties.
                                We offer world-class hospitality, blending modern amenities with classic charm to ensure every moment of your stay is perfect.
                            </p>
                            <button className="px-8 py-4 bg-[#222] hover:bg-[#C19D60] text-white text-xs uppercase tracking-widest font-bold transition-colors shadow-lg">
                                Discover More
                            </button>
                        </div>
                    </section>

                    {/* FACILITIES SECTION */}
                    <section className="bg-white dark:bg-[#111] py-24 text-center mt-12 mb-20 relative overflow-hidden transition-colors duration-500">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="max-w-7xl mx-auto px-6 relative z-10">
                            <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Hotel Facilities</p>
                            <h3 className="text-4xl font-serif text-[#222] dark:text-white mb-16">Unparalleled Services</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { icon: <FiCoffee />, title: 'Restaurant', desc: 'Fine dining experiences with world-class chefs' },
                                    { icon: <FiWifi />, title: 'High-Speed Wifi', desc: 'Stay connected anywhere on the property' },
                                    { icon: <FiUser />, title: 'Spa & Wellness', desc: 'Rejuvenate your body and mind' },
                                    { icon: <FiHeart />, title: 'Fitness Center', desc: 'State-of-the-art equipment for your workout' }
                                ].map((item, idx) => (
                                    <div key={idx} className="group border border-white/10 p-10 hover:border-[#C19D60] bg-white dark:bg-[#1a1a1a]/5 backdrop-blur-sm transition-all duration-500">
                                        <div className="text-4xl text-[#C19D60] mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                                        <h4 className="text-xl font-serif text-white mb-3">{item.title}</h4>
                                        <p className="text-[#999] text-sm font-light leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <main className="max-w-7xl mx-auto px-6 pt-24">
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
                                    <div key={hotel._id} onClick={() => handleSelectHotel(hotel)} className="group cursor-pointer bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] hover:border-[#C19D60] transition-colors duration-500 flex flex-col h-full">
                                        <div className="relative h-72 overflow-hidden bg-[#111]">
                                            <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-100" />
                                            <div className="absolute top-4 right-4 flex text-[#C19D60] text-sm">
                                                {[...Array(hotel.star_rating)].map((_, i) => <HiStar key={i} className="drop-shadow-md" />)}
                                            </div>
                                            <button
                                                onClick={(e) => toggleLike(e, hotel._id)}
                                                className="absolute bottom-4 right-4 p-3 bg-white dark:bg-[#1a1a1a]/10 hover:bg-[#C19D60] backdrop-blur-md rounded-full transition-colors z-10 border border-white/20"
                                            >
                                                <FiHeart className={`text-lg transition-colors ${likedHotels.includes(hotel._id) ? 'fill-white text-white' : 'text-white'}`} />
                                            </button>
                                        </div>
                                        <div className="p-8 text-center flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[#C19D60] text-xs uppercase tracking-widest font-bold mb-3 flex items-center justify-center gap-1"><FiMapPin /> {hotel.location}</p>
                                                <h3 className="text-2xl font-serif text-[#222] dark:text-gray-100 mb-4 group-hover:text-[#C19D60] transition-colors line-clamp-1">{hotel.name}</h3>
                                                <p className="text-[#777] text-sm line-clamp-3 leading-relaxed font-light">{hotel.description}</p>
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-[#EAE3D2] dark:border-[#333]">
                                                <span className="text-xs uppercase tracking-widest font-bold text-[#222] dark:text-gray-100 pb-1 border-b-2 border-[#C19D60] group-hover:border-[#222] transition-colors">Explore Rooms</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </>
            ) : (
                <div className="animate-in fade-in duration-700 bg-white dark:bg-[#1a1a1a] min-h-screen pb-20">
                    <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-center">
                        <div className="absolute inset-0 bg-[#111]">
                            <img src={selectedHotel.image_url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent"></div>
                        </div>
                        <div className="absolute top-24 left-6 md:left-12 z-10">
                            <button onClick={() => setSelectedHotel(null)} className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a]/10 hover:bg-[#C19D60] backdrop-blur-md text-white px-5 py-2.5 font-semibold transition-colors border border-white/20 uppercase tracking-widest text-xs">
                                <FiChevronLeft className="text-xl" /> Back
                            </button>
                        </div>
                        <div className="relative z-10 px-6 max-w-4xl mx-auto pt-10">
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className="flex text-[#C19D60] text-xl drop-shadow-md">
                                    {[...Array(selectedHotel.star_rating)].map((_, i) => <HiStar key={i} />)}
                                </span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg tracking-wide">{selectedHotel.name}</h2>
                            <p className="text-white/80 flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-bold"><HiOutlineLocationMarker className="text-[#C19D60] text-lg" /> {selectedHotel.location}</p>
                        </div>
                    </section>

                    <main className="max-w-7xl mx-auto px-6 py-20">
                        <div className="text-center mb-16">
                            <p className="text-[#C19D60] uppercase tracking-[0.2em] font-bold text-sm mb-3">Accommodation</p>
                            <h3 className="text-4xl font-serif text-[#222] dark:text-gray-100">Rooms & Suites</h3>
                            <div className="w-24 h-0.5 bg-[#C19D60] mx-auto mt-6"></div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {[1, 2].map(i => <div key={i} className="h-96 bg-[#FDFBF7] dark:bg-[#111] border border-[#EAE3D2] dark:border-[#333] animate-pulse"></div>)}
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="text-center py-32 border border-[#EAE3D2] dark:border-[#333] bg-[#FDFBF7] dark:bg-[#111]">
                                <FiAlertCircle className="text-6xl text-[#EAE3D2] mx-auto mb-6" />
                                <h4 className="text-2xl font-serif text-[#222] dark:text-gray-100 mb-2">Fully Booked</h4>
                                <p className="text-[#777] font-light">There are no rooms available at this property right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {rooms.map((room) => (
                                    <div key={room._id} className="flex flex-col md:flex-row border border-[#EAE3D2] dark:border-[#333] bg-[#FDFBF7] dark:bg-[#111] hover:shadow-2xl hover:shadow-[#C19D60]/10 transition-all duration-500 group relative">

                                        <div className="w-full md:w-2/5 relative overflow-hidden bg-[#111] min-h-[300px]">
                                            <img src={`https://images.unsplash.com/photo-${room.type === 'VIP' ? '1582719478250-c89fae4237d8' : '1611892440504-42a792e24d32'}?q=80&w=1000&auto=format&fit=crop`} alt={room.type} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000" />
                                            {room.type === 'VIP' && (
                                                <div className="absolute top-4 left-4 bg-[#C19D60] text-white text-xs font-bold py-1 px-3 uppercase tracking-widest border border-[#A8874E]">VIP SUITE</div>
                                            )}
                                        </div>

                                        <div className="w-full md:w-3/5 p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-3xl font-serif text-[#222] dark:text-gray-100 mb-2">Room {room.room_number}</h4>
                                                        <p className="text-[#C19D60] text-xs uppercase tracking-widest font-bold">{room.type} CATEGORY</p>
                                                    </div>
                                                </div>
                                                <p className="text-[#777] text-sm leading-relaxed mb-6 font-light">Experience the perfect blend of comfort and luxury in our elegantly designed spaces, tailored for an unforgettable stay.</p>

                                                <div className="flex gap-4 text-[#777] mb-8 border-y border-[#EAE3D2] dark:border-[#333] py-4">
                                                    <span className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold" title="Free Wifi"><FiWifi className="text-[#C19D60] text-lg" /> WiFi</span>
                                                    <span className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold" title="Breakfast"><FiCoffee className="text-[#C19D60] text-lg" /> B'fast</span>
                                                    <span className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold" title="2 Guests"><FiUser className="text-[#C19D60] text-lg" /> 2 PPL</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs text-[#777] uppercase tracking-widest mb-1">From</p>
                                                    <p className="text-3xl font-serif text-[#222] dark:text-gray-100">{room.price_per_night.toLocaleString('vi-VN')}₫<span className="text-sm text-[#777] font-sans font-light italic"> /night</span></p>
                                                </div>

                                                {room.is_locked ? (
                                                    <button disabled className="w-full sm:w-auto px-8 py-4 bg-[#EAE3D2] dark:bg-[#333] text-[#777] text-xs uppercase tracking-widest font-bold cursor-not-allowed">
                                                        Reserved
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleLock(room)} className="w-full sm:w-auto px-8 py-4 bg-[#222] hover:bg-[#C19D60] text-white text-xs uppercase tracking-widest font-bold transition-colors">
                                                        Book Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
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