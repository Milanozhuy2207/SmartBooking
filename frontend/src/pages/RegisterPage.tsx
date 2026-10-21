import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [full_name, setFull_name] = useState('');
    const [phone_number, setPhone_number] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = { email, password, full_name, phone_number };

        try {
            const data = await axiosClient.post('/auth/register', payload);
            if (data.status === 201) {
                toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
            toast.error(errorMessage, { id: 'register' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center font-sans p-4">
            <Toaster position="top-right" />
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

            <div className="relative z-10 w-full max-w-md p-10 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 my-8">
                <div className="text-center mb-10 flex flex-col items-center">
                    <span className="flex items-center gap-1 text-3xl font-serif tracking-widest text-white mb-1">
                        <span className="text-[#C19D60] text-4xl font-black mr-1">S</span>MART<span className="font-light">BOOKING</span>
                    </span>
                    <span className="text-[9px] tracking-[0.5em] font-bold text-white/60">LUXURY HOTEL</span>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={full_name}
                            onChange={(e) => setFull_name(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="namkh@vnpt.vn"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={phone_number}
                            onChange={(e) => setPhone_number(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="0987654321"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-[#777] mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-white/20 text-white px-2 py-3 outline-none focus:border-[#C19D60] transition-colors placeholder-white/20 text-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl text-xs font-bold text-white uppercase tracking-widest bg-[#C19D60] hover:bg-[#A8874E] transition-all duration-300 hover:shadow-lg hover:shadow-[#C19D60]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : 'Create Account'}
                        </button>
                    </div>

                    <p className="text-center text-[10px] font-bold text-[#777] uppercase tracking-widest mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#C19D60] hover:text-white transition-colors ml-1">
                            Sign In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;