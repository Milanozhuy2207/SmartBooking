import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
