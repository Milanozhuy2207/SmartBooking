import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const RegisterPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [full_name, setFull_name] = useState("")
    const [phone_number, setPhone_number] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const payload = { email, password, full_name, phone_number }

        try {
            const data = await axiosClient.post('/auth/register', payload)
            if (data.status === 201) {
                toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
                setTimeout(() => navigate('/login'), 1500)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
            toast.error(errorMessage, { id: 'register' });
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            <Toaster />
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"></div>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl my-8">
                <h2 className="text-3xl font-black text-center text-cyan-700 mb-8">Tạo tài khoản mới</h2>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên</label>
                        <input type="text" required value={full_name} onChange={(e) => setFull_name(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" placeholder="Nguyễn Văn A" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" placeholder="namkh@vnpt.vn" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
                        <input type="tel" required value={phone_number} onChange={(e) => setPhone_number(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" placeholder="0987654321" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" placeholder="••••••••" />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full py-4 text-white font-bold bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
                        </button>
                    </div>

                    <p className="text-center text-sm font-bold text-gray-500 pt-2">
                        Đã có tài khoản? <Link to="/login" className="text-cyan-600 hover:underline">Đăng nhập ngay</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
export default RegisterPage;