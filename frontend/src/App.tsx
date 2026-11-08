import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminHotelPage from './pages/AdminHotelPage';
import VendorDashboard from './pages/VendorDashboard';

const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    try {
        return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    } catch {
        localStorage.removeItem('user');
        return null;
    }
};

const PageTitleManager = () => {
    const location = useLocation();

    useEffect(() => {
        const routeTitles: Record<string, string> = {
            '/home': 'SmartBooking | Tuyệt Tác Nghỉ Dưỡng 5-6 Sao Việt Nam',
            '/login': 'Đăng Nhập | SmartBooking Luxury Hospitality',
            '/register': 'Đăng Ký Thành Viên | SmartBooking Luxury Hospitality',
            '/my-bookings': 'Kỳ Nghỉ & Lịch Sử Đặt Phòng | SmartBooking',
            '/vendor': 'Partner Extranet | SmartBooking Quản Lý Đối Tác',
            '/admin': 'Admin Command Center | SmartBooking Quản Trị Hệ Thống',
            '/admin/hotels': 'Quản Lý Khách Sạn & Phòng | SmartBooking'
        };
        document.title = routeTitles[location.pathname] || 'SmartBooking | Luxury Hotel & Resort Booking';
    }, [location.pathname]);

    return null;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const user = getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
};

const VendorRoute = ({ children }: { children: React.ReactNode }) => {
    const user = getCurrentUser();
    if (!user || (user.role !== "VENDOR" && user.role !== "RECEPTIONIST" && user.role !== "ADMIN")) {
        return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <PageTitleManager />
            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/vendor" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/hotels" element={<VendorRoute><AdminHotelPage /></VendorRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
