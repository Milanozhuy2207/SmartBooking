import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiBox, FiMapPin, FiStar, FiImage, FiArrowLeft, FiSun, FiMoon } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface Hotel {
    _id: string;
    name: string;
    location: string;
    star_rating: number;
    description: string;
    image_url: string;
}

interface Room {
    _id: string;
    room_number: string;
    type: 'STANDARD' | 'DELUXE' | 'VIP';
    price_per_night: number;
}

const AdminHotelPage = () => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [roomForm, setRoomForm] = useState({
        room_number: '',
        type: 'STANDARD',
        price_per_night: 100
    }); const [formData, setFormData] = useState({
        name: '',
        location: '',
        star_rating: 5,
        description: '',
        image_url: ''
    });

    const navigate = useNavigate();

    const fetchHotels = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/hotels');
            setHotels(response.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error fetching hotels');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleOpenManageRooms = async (hotel: Hotel) => {
        setSelectedHotel(hotel)
        try {
            const res = await axiosClient.get(`/hotels/${hotel._id}/rooms`)
            setRooms(res.data.data)

        } catch (error: any) {
            toast.error("Can't fetch rooms")
        }
    }

    const handleCreateHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosClient.post('/hotels', formData);
            toast.success('Hotel created successfully!');
            setShowModal(false);
            setFormData({ name: '', location: '', star_rating: 5, description: '', image_url: '' });
            fetchHotels();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create hotel');
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedHotel) return
        try {
            await axiosClient.post(`/hotels/${selectedHotel._id}/rooms`, roomForm);
            toast.success('Room added successfully!')
            setRoomForm({ room_number: '', type: 'STANDARD', price_per_night: 100 })
            handleOpenManageRooms(selectedHotel)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Can't add room")
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111] transition-colors duration-500 font-sans text-[#222] dark:text-gray-100">
            <Toaster position="top-right" />

            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="fixed bottom-8 right-8 z-50 bg-white dark:bg-[#222] p-4 rounded-full shadow-2xl border border-gray-200 dark:border-white/10 text-xl hover:scale-110 transition-all duration-300 group"
            >
                {isDarkMode ? <FiSun className="text-yellow-500 group-hover:rotate-90 transition-transform duration-500" /> : <FiMoon className="text-[#222] group-hover:-rotate-12 transition-transform duration-500" />}
            </button>

            {/* HEADER */}
            <header className="bg-white dark:bg-[#1a1a1a] shadow-md border-b border-[#EAE3D2] dark:border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-[#C19D60] text-3xl font-black">S</span>
                        <div>
                            <h1 className="font-serif tracking-widest font-bold leading-tight text-lg">MARTBOOKING</h1>
                            <p className="text-[9px] tracking-[0.3em] font-bold text-[#777] uppercase">Hotel Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-[#777] hover:text-[#C19D60] transition-colors text-xs font-bold uppercase tracking-widest">
                            <FiArrowLeft className="text-lg" /> Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-serif mb-2">Hotel Properties</h2>
                        <p className="text-[#777] text-sm">Manage your portfolio of luxury hotels.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#222] dark:bg-white text-white dark:text-[#222] px-6 py-3 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:bg-[#C19D60] dark:hover:bg-[#C19D60] transition-colors"
                    >
                        <FiPlus className="text-base" /> Add New Hotel
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full text-center text-[#777] animate-pulse py-20">Loading properties...</div>
                    ) : hotels.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-[#1a1a1a] p-16 text-center border border-[#EAE3D2] dark:border-[#333]">
                            <FiBox className="text-4xl text-[#C19D60]/50 mx-auto mb-4" />
                            <p className="text-[#777]">No hotels found. Add your first property!</p>
                        </div>
                    ) : (
                        hotels.map((hotel) => (
                            <div key={hotel._id} className="bg-white dark:bg-[#1a1a1a] border border-[#EAE3D2] dark:border-[#333] overflow-hidden group hover:border-[#C19D60] transition-colors">
                                <div className="h-48 overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                                    {hotel.image_url ? (
                                        <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300"><FiImage className="text-4xl" /></div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 flex items-center gap-1 text-xs font-bold">
                                        <FiStar className="text-[#C19D60]" /> {hotel.star_rating}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-serif font-bold mb-2">{hotel.name}</h3>
                                    <p className="text-xs text-[#777] uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <FiMapPin className="text-[#C19D60]" /> {hotel.location}
                                    </p>
                                    <button
                                        onClick={() => handleOpenManageRooms(hotel)}
                                        className="w-full py-2 border border-[#EAE3D2] dark:border-[#333] text-xs uppercase tracking-widest font-bold text-center hover:bg-[#FDFBF7] dark:hover:bg-[#222] transition-colors"
                                    >
                                        Manage Rooms
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* CREATE HOTEL MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg border border-[#EAE3D2] dark:border-[#333] shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#777] hover:text-red-500 text-xl"><FiArrowLeft /></button>
                        <div className="p-8">
                            <h3 className="text-2xl font-serif mb-6 text-center">Add New Property</h3>
                            <form onSubmit={handleCreateHotel} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Hotel Name *</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm" placeholder="e.g. The Ritz-Carlton" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Location *</label>
                                    <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm" placeholder="e.g. New York, NY" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Star Rating</label>
                                    <input type="number" min="1" max="5" value={formData.star_rating} onChange={e => setFormData({ ...formData, star_rating: parseInt(e.target.value) })} className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Image URL</label>
                                    <input value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm" placeholder="https://..." />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-[#222] dark:bg-white text-white dark:text-[#222] py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#C19D60] dark:hover:bg-[#C19D60] transition-colors">
                                        Save Property
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MANAGE ROOMS MODAL */}
            {selectedHotel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl border border-[#EAE3D2] dark:border-[#333] shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSelectedHotel(null)} className="absolute top-4 right-4 text-[#777] hover:text-red-500 text-xl"><FiArrowLeft /></button>
                        <div className="p-8">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C19D60] font-bold text-center mb-1">Room Inventory</p>
                            <h3 className="text-2xl font-serif mb-6 text-center">{selectedHotel.name}</h3>

                            {/* DANH SÁCH PHÒNG HIỆN CÓ */}
                            <div className="mb-8">
                                <h4 className="text-xs uppercase tracking-widest text-[#777] font-bold mb-3">Existing Rooms ({rooms.length})</h4>
                                {rooms.length === 0 ? (
                                    <p className="text-sm text-[#777] italic py-4 text-center border border-dashed border-[#EAE3D2] dark:border-[#333]">
                                        Chưa có phòng nào. Hãy thêm phòng đầu tiên bên dưới!
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {rooms.map((room) => (
                                            <div key={room._id} className="p-3 border border-[#EAE3D2] dark:border-[#333] flex justify-between items-center bg-[#FDFBF7] dark:bg-[#111]">
                                                <div>
                                                    <span className="font-serif font-bold text-base">Phòng {room.room_number}</span>
                                                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#C19D60]/20 text-[#C19D60] font-bold uppercase tracking-wider">
                                                        {room.type}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-[#C19D60]">
                                                    ${room.price_per_night}<span className="text-[10px] text-[#777] font-normal">/đêm</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* FORM THÊM PHÒNG MỚI */}
                            <div className="border-t border-[#EAE3D2] dark:border-[#333] pt-6">
                                <h4 className="text-xs uppercase tracking-widest text-[#777] font-bold mb-4">Add New Room</h4>
                                <form onSubmit={handleCreateRoom} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Room Number *</label>
                                        <input
                                            required
                                            value={roomForm.room_number}
                                            onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                                            className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm"
                                            placeholder="e.g. 101"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Room Type *</label>
                                        <select
                                            value={roomForm.type}
                                            onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                                            className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent dark:bg-[#1a1a1a] py-2 outline-none focus:border-[#C19D60] transition-colors text-sm"
                                        >
                                            <option value="STANDARD">STANDARD</option>
                                            <option value="DELUXE">DELUXE</option>
                                            <option value="VIP">VIP</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-[#777] font-bold mb-1">Price / Night ($) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={roomForm.price_per_night}
                                            onChange={e => setRoomForm({ ...roomForm, price_per_night: Number(e.target.value) })}
                                            className="w-full border-b border-[#EAE3D2] dark:border-[#333] bg-transparent py-2 outline-none focus:border-[#C19D60] transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="sm:col-span-3 pt-2">
                                        <button type="submit" className="w-full bg-[#222] dark:bg-white text-white dark:text-[#222] py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#C19D60] dark:hover:bg-[#C19D60] transition-colors">
                                            + Create Room (Auto-seed 30 days)
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHotelPage;
