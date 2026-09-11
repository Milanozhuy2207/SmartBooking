import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bgImage, setBgImage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour <= 10) {
            setBgImage('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
        } else if (hour >= 11 && hour <= 16) {
            setBgImage('https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
        } else if (hour >= 17 && hour <= 18) {
            setBgImage('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
        } else {
            setBgImage('https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
        }
    }, []);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading('Đang kiểm tra thông tin...');

        try {
            const res = await axiosClient.post('/auth/login', { email, password });
            if (res.status === 200) {
                toast.success('Đăng nhập thành công!', { id: loadingToast });
                setTimeout(() => {
                    navigate('/home');
                }, 1000);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
            toast.error(errorMessage, { id: loadingToast });
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{
                backgroundImage: `url("${bgImage}")`,
            }}
        >
            <Toaster position="top-right" />

            <div className="absolute inset-0 bg-cyan-900/30 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-2xl">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 mb-2">
                        SmartBooking
                    </h1>
                    <p className="text-cyan-800/80 font-medium">Nghỉ dưỡng trong tầm tay</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-cyan-900 mb-2">
                            <FiMail className="text-cyan-600" /> Địa chỉ Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/70 border border-cyan-100 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-gray-400 text-gray-700 shadow-inner"
                            placeholder="namkh@vnpt.vn"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-cyan-900 mb-2">
                            <FiLock className="text-cyan-600" /> Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/70 border border-cyan-100 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-gray-400 text-gray-700 shadow-inner"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Tiện ích bổ sung: Ghi nhớ & Quên mật khẩu */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-cyan-900">
                            <input type="checkbox" className="w-4 h-4 text-cyan-600 rounded border-cyan-300 focus:ring-cyan-500" />
                            <span className="font-medium">Ghi nhớ đăng nhập</span>
                        </label>
                        <a href="#" className="font-bold text-cyan-700 hover:text-cyan-500 transition-colors">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full cursor-pointer mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/30"
                    >
                        <FiLogIn className="text-lg" /> ĐẶT CHÂN ĐẾN RESORT
                    </button>

                    <p className="text-center text-sm text-cyan-900 mt-6">
                        Chưa có tài khoản?{' '}
                        <a href="/register" className="font-bold text-cyan-700 hover:text-cyan-500 hover:underline transition-all">
                            Đăng ký ngay
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
