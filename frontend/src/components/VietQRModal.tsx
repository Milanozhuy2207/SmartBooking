import { useState } from 'react';
import { FiCheck, FiX, FiShield, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface VietQRModalProps {
    booking: {
        _id: string;
        total_price: number;
        customer_name: string;
        phone_number?: string;
        room_id?: {
            room_number?: string;
            type?: string;
            hotel_id?: { name?: string };
        };
        room_number?: string;
        hotel_name?: string;
    } | null;
    mode?: 'CUSTOMER' | 'CHECKOUT';
    onClose: () => void;
    onPaymentConfirmed: () => void;
}

const VietQRModal = ({ booking, mode = 'CUSTOMER', onClose, onPaymentConfirmed }: VietQRModalProps) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!booking) return null;

    const shortCode = booking._id.slice(-6).toUpperCase();
    const roomNum = booking.room_id?.room_number || booking.room_number || '';
    const hotelName = booking.room_id?.hotel_id?.name || booking.hotel_name || 'SmartBooking Hotel';
    const transferContent = mode === 'CHECKOUT'
        ? `CHECKOUT ${roomNum} ${shortCode}`.trim()
        : `SMARTBOOKING ${shortCode}`;
    const qrUrl = `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${booking.total_price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('SMARTBOOKING LUXURY OTA')}`;

    const handleConfirmPaid = async () => {
        setIsConfirming(true);
        try {
            if (mode === 'CHECKOUT') {
                await axiosClient.put(`/bookings/${booking._id}/status`, { status: 'CHECKED_OUT' });
                toast.success(`Đã thanh toán QR & hoàn tất trả phòng (CHECKED_OUT) cho khách ${booking.customer_name}!`);
                onPaymentConfirmed();
                onClose();
            } else {
                const res = await axiosClient.put(`/bookings/${booking._id}/pay`);
                if (res.data?.success) {
                    toast.success('Đã xác nhận thanh toán VietQR! Đơn phòng chuyển sang CONFIRMED.');
                    onPaymentConfirmed();
                    onClose();
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xác nhận thanh toán');
        } finally {
            setIsConfirming(false);
        }
    };

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#161616] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#EAE3D2] dark:border-white/10 relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#141414] to-[#242424] px-6 py-5 text-white flex items-center justify-between border-b border-[#C19D60]/30">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold block">
                            {mode === 'CHECKOUT' ? 'Hóa Đơn Trả Phòng • Lễ Tân (Check-out)' : 'Cổng Thanh Toán Napas 247'}
                        </span>
                        <h3 className="text-xl font-serif font-bold mt-0.5">
                            {mode === 'CHECKOUT' ? `Thanh Toán Trả Phòng ${roomNum ? '#' + roomNum : ''}` : 'Quét Mã VietQR Tự Động'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {mode === 'CHECKOUT' && (
                        <div className="bg-[#C19D60]/10 border border-[#C19D60]/30 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between">
                            <div>
                                <span className="text-[#777] dark:text-gray-400 block text-[10px] uppercase font-bold">Khách lưu trú trả phòng</span>
                                <strong className="text-[#222] dark:text-white">{booking.customer_name}</strong>
                                {roomNum && <span className="text-[#C19D60] font-bold ml-1.5">• Phòng {roomNum}</span>}
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-[#C19D60] text-white px-2 py-0.5 rounded">
                                #{shortCode}
                            </span>
                        </div>
                    )}

                    <div className="bg-[#FDFBF7] dark:bg-[#1f1f1f] p-4 rounded-2xl border border-[#EAE3D2] dark:border-white/10 flex flex-col items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-md border border-[#EAE3D2]">
                            <img
                                src={qrUrl}
                                alt="VietQR Payment"
                                className="w-56 h-56 object-contain"
                            />
                        </div>
                        <p className="text-[11px] text-[#777] dark:text-gray-400 mt-3 text-center">
                            {mode === 'CHECKOUT'
                                ? `Đưa mã QR này cho khách ${booking.customer_name} quét để tất toán hóa đơn lưu trú tại ${hotelName}`
                                : 'Mở ứng dụng Ngân hàng bất kỳ hoặc Ví điện tử để quét mã QR (Tự động điền đúng số tiền & nội dung)'}
                        </p>
                    </div>

                    {/* Thông tin chuyển khoản chi tiết */}
                    <div className="space-y-2.5 text-xs bg-[#F8F5F0] dark:bg-[#1d1d1d] p-4 rounded-2xl border border-[#EAE3D2] dark:border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="text-[#777]">Ngân hàng thụ hưởng:</span>
                            <span className="font-bold text-[#222] dark:text-white">Vietcombank (VCB)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#777]">Số tài khoản:</span>
                            <button
                                onClick={() => copyText('1029384756', 'Số tài khoản')}
                                className="font-mono font-bold text-[#222] dark:text-white flex items-center gap-1.5 hover:text-[#C19D60]"
                            >
                                1029384756 <FiCopy className="text-[#C19D60]" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#777]">Chủ tài khoản:</span>
                            <span className="font-bold text-[#222] dark:text-white">SMARTBOOKING LUXURY OTA</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#EAE3D2] dark:border-white/10">
                            <span className="text-[#777]">Tổng tiền quyết toán:</span>
                            <span className="text-base font-serif font-bold text-[#C19D60]">
                                {booking.total_price?.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#777]">Nội dung CK:</span>
                            <button
                                onClick={() => copyText(transferContent, 'Nội dung chuyển khoản')}
                                className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                            >
                                {transferContent} <FiCopy />
                            </button>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5">
                        <button
                            onClick={handleConfirmPaid}
                            disabled={isConfirming}
                            className="w-full py-3.5 rounded-xl bg-[#C19D60] hover:bg-[#a68347] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#C19D60]/30 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FiCheck className="text-base" />
                            {isConfirming
                                ? 'Đang xử lý...'
                                : mode === 'CHECKOUT'
                                    ? 'Khách Đã Quét QR • Hoàn Tất Trả Phòng (CHECKED_OUT)'
                                    : 'Tôi Đã Chuyển Khoản (Xác Nhận Ngay)'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-[#777] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                        >
                            {mode === 'CHECKOUT' ? 'Đóng cửa sổ QR' : 'Thanh Toán Sau (Giữ đơn Chờ Duyệt)'}
                        </button>
                    </div>

                    <p className="text-[10px] text-center text-[#777] flex items-center justify-center gap-1.5">
                        <FiShield className="text-[#C19D60]" />
                        {mode === 'CHECKOUT'
                            ? 'Sau khi hoàn tất trả phòng, khách hàng có thể đánh giá kỳ nghỉ trên hệ thống'
                            : 'Tự động cộng điểm thưởng thành viên ngay khi xác nhận'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VietQRModal;
