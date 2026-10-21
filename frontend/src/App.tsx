import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminHotelPage from './pages/AdminHotelPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/hotels" element={<AdminHotelPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;