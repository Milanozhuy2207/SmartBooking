import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

                localStorage.setItem('user', JSON.stringify(res.data.user))

                toast.success('Đăng nhập thành công!', { id: loadingToast });
                setTimeout(() => {
                    if (res.data.user.role === 'ADMIN') {
                        navigate('/admin')
                    }
                    else {
                        navigate('/home')
                    }
                }, 1000);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
            toast.error(errorMessage, { id: loadingToast });
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat transition-all duration-1000 font-sans"
            style={{
                backgroundImage: `url("${bgImage}")`,
            }}
        >
            <Toaster position="top-right" />

            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

            <div className="relative z-10 w-full max-w-md p-10 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50">

                <div className="text-center mb-10 flex flex-col items-center">
                    <span className="flex items-center gap-1 text-3xl font-serif tracking-widest text-white mb-1">
                        <span className="text-[#C19D60] text-4xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                    </span>
                    <span className="text-[9px] tracking-[0.5em] font-bold text-white/60">LUXURY HOTEL</span>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">
                            <FiMail className="text-[#C19D60] text-sm" /> Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="namkh@vnpt.vn"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">
                            <FiLock className="text-[#C19D60] text-sm" /> Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold mt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-[#777]">
                            <input type="checkbox" className="w-3 h-3 text-[#C19D60] rounded border-white/20 bg-transparent focus:ring-[#C19D60]" />
                            <span>Remember Me</span>
                        </label>
                        <a href="#" className="text-[#C19D60] hover:text-white transition-colors">
                            Forgot Password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-10 py-4 rounded-xl text-xs font-bold text-white uppercase tracking-widest bg-[#C19D60] hover:bg-[#A8874E] transition-all duration-300 hover:shadow-lg hover:shadow-[#C19D60]/40 flex items-center justify-center gap-2"
                    >
                        <FiLogIn className="text-base" /> Sign In
                    </button>

                    <p className="text-center text-[10px] font-bold text-[#777] uppercase tracking-widest mt-8">
                        New Guest?{' '}
                        <Link to="/register" className="text-[#C19D60] hover:text-white transition-colors ml-1">
                            Create Account
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
