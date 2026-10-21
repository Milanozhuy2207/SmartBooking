import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiCheck, FiX, FiRefreshCcw, FiSun, FiMoon } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface Booking {
    _id: string;
    room_id: { _id: string; room_number: string; type: string };
    user_id: { _id: string; name: string; email: string };
    customer_name: string;
    phone_number: string;
    total_price: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    check_in: string;
    check_out: string;
    createdAt: string;
}

const AdminDashboard = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const navigate = useNavigate();

    const fetchAllBookings = async () => {
        setIsLoading(true);
        try {
            // NOTE: The backend API must be implemented by the user
            const response = await axiosClient.get('/bookings/all');
            setBookings(response.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error fetching bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleUpdateStatus = async (bookingId: string, status: string) => {
        try {
            await axiosClient.put(`/bookings/${bookingId}/status`, { status });
            toast.success(`Booking marked as ${status}`);
            fetchAllBookings(); // Refresh the list
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111] transition-colors duration-500 font-sans text-[#222] dark:text-gray-100">
            <Toaster position="top-right" />

            {/* Dark Mode Toggle */}
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
                            <p className="text-[9px] tracking-[0.3em] font-bold text-[#777] uppercase">Admin Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/admin/hotels')} className="flex items-center gap-2 text-[#777] hover:text-[#C19D60] transition-colors text-xs font-bold uppercase tracking-widest">
                            Manage Hotels
                        </button>
                        <button onClick={fetchAllBookings} className="text-[#777] hover:text-[#C19D60] transition-colors" title="Refresh">
                            <FiRefreshCcw className="text-xl" />
                        </button>
                        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors text-xs font-bold uppercase tracking-widest">
                            <FiLogOut className="text-lg" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h2 className="text-3xl font-serif mb-2">Reservation Management</h2>
                    <p className="text-[#777] text-sm">Overview of all hotel bookings, statuses, and revenue.</p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] shadow-xl border border-[#EAE3D2] dark:border-[#333] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f9f8f5] dark:bg-[#222] border-b border-[#EAE3D2] dark:border-[#333]">
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Booking ID</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Guest</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Room</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Dates</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Revenue</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold">Status</th>
                                    <th className="p-4 text-xs uppercase tracking-widest text-[#777] font-bold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-[#777] animate-pulse">Loading records...</td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-[#777]">No bookings found in the system.</td>
                                    </tr>
                                ) : (
                                    bookings.map((b) => (
                                        <tr key={b._id} className="border-b border-[#EAE3D2] dark:border-[#333] hover:bg-[#FDFBF7] dark:hover:bg-[#111] transition-colors">
                                            <td className="p-4 font-mono text-xs text-[#999]">{b._id.slice(-6).toUpperCase()}</td>
                                            <td className="p-4">
                                                <p className="font-bold text-sm">{b.customer_name}</p>
                                                <p className="text-xs text-[#777]">{b.phone_number}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-[#C19D60]">Room {b.room_id?.room_number}</p>
                                                <p className="text-[10px] uppercase tracking-widest bg-[#EAE3D2] dark:bg-[#333] inline-block px-1 mt-1 rounded text-[#555] dark:text-[#aaa]">{b.room_id?.type}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs">{b.check_in ? new Date(b.check_in).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                                <p className="text-xs text-[#777]">to {b.check_out ? new Date(b.check_out).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                            </td>
                                            <td className="p-4 font-serif text-[#C19D60] font-bold">
                                                {b.total_price?.toLocaleString('vi-VN')} đ
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${
                                                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                    b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {b.status === 'PENDING' && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(b._id, 'CONFIRMED')}
                                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors" title="Approve"
                                                        >
                                                            <FiCheck />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(b._id, 'CANCELLED')}
                                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors" title="Reject"
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
