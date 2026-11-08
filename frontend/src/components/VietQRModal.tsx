import { useState } from 'react';
import { FiCheck, FiX, FiShield, FiCopy, FiCreditCard, FiPercent } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

interface VietQRModalProps {
    booking: {
        _id: string;
        total_price: number;
        payment_type?: 'UNPAID' | 'DEPOSIT' | 'FULL';
        paid_amount?: number;
        remaining_amount?: number;
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
    const [paymentOption, setPaymentOption] = useState<'FULL' | 'DEPOSIT'>('FULL');

    if (!booking) return null;

    const totalPrice = booking.total_price || 0;
    const depositAmount = Math.round(totalPrice * 0.3);
    const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);

    // Tính số tiền đã trả và còn thiếu cho chế độ Lễ tân Trả phòng (CHECKOUT)
    const paidSoFar =
        booking.paid_amount !== undefined && booking.paid_amount > 0
            ? booking.paid_amount
            : booking.payment_type === 'FULL'
                ? totalPrice
                : booking.payment_type === 'DEPOSIT'
                    ? depositAmount
                    : 0;

    const checkoutRemaining =
        booking.remaining_amount !== undefined && booking.payment_type && booking.payment_type !== 'UNPAID'
            ? booking.remaining_amount
            : Math.max(0, totalPrice - paidSoFar);

    // Số tiền hiển thị trên mã QR
    const qrAmount =
        mode === 'CHECKOUT'
            ? checkoutRemaining
            : paymentOption === 'DEPOSIT'
                ? depositAmount
                : totalPrice;

    const shortCode = booking._id.slice(-6).toUpperCase();
    const roomNum = booking.room_id?.room_number || booking.room_number || '';
    const hotelName = booking.room_id?.hotel_id?.name || booking.hotel_name || 'SmartBooking Hotel';

    const transferContent =
        mode === 'CHECKOUT'
            ? `CHECKOUT ${roomNum} ${shortCode}`.trim()
            : paymentOption === 'DEPOSIT'
                ? `SMARTBOOKING COC30 ${shortCode}`
                : `SMARTBOOKING FULL ${shortCode}`;

    const qrUrl = `https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('SMARTBOOKING LUXURY OTA')}`;

    const handleConfirmPaid = async () => {
        setIsConfirming(true);
        try {
            if (mode === 'CHECKOUT') {
                await axiosClient.put(`/bookings/${booking._id}/status`, { status: 'CHECKED_OUT' });
                toast.success(`Đã tất toán & hoàn tất trả phòng (CHECKED_OUT) cho khách ${booking.customer_name}!`);
                onPaymentConfirmed();
                onClose();
            } else {
                const res = await axiosClient.put(`/bookings/${booking._id}/pay`, {
                    paymentType: paymentOption
                });
                if (res.data?.success) {
                    toast.success(
                        paymentOption === 'DEPOSIT'
                            ? `Đã xác nhận đặt cọc 30% (${depositAmount.toLocaleString('vi-VN')}đ)! Đơn phòng đã chuyển sang CONFIRMED.`
                            : 'Đã xác nhận thanh toán 100% qua VietQR! Đơn phòng đã chuyển sang CONFIRMED.'
                    );
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#161616] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#EAE3D2] dark:border-white/10 relative my-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#141414] to-[#242424] px-6 py-4 text-white flex items-center justify-between border-b border-[#C19D60]/30">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#C19D60] font-bold block">
                            {mode === 'CHECKOUT' ? 'Hóa Đơn Trả Phòng • Lễ Tân (Check-out)' : 'Cổng Thanh Toán Napas 247'}
                        </span>
                        <h3 className="text-lg md:text-xl font-serif font-bold mt-0.5">
                            {mode === 'CHECKOUT' ? `Quyết Toán Trả Phòng ${roomNum ? '#' + roomNum : ''}` : 'Quét Mã VietQR Tự Động'}
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
                <div className="p-5 md:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    {/* 2 LỰA CHỌN CHO KHÁCH HÀNG: THANH TOÁN NGAY 100% HOẶC GỬI TIỀN CỌC 30% */}
                    {mode === 'CUSTOMER' && (
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#777] dark:text-gray-400 font-bold mb-2">
                                Chọn hình thức thanh toán QR của Quý khách:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setPaymentOption('FULL')}
                                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        paymentOption === 'FULL'
                                            ? 'border-[#C19D60] bg-[#C19D60]/10 shadow-md'
                                            : 'border-[#EAE3D2] dark:border-white/10 bg-[#FDFBF7] dark:bg-[#1f1f1f] hover:border-[#C19D60]/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19D60] flex items-center gap-1">
                                            <FiCreditCard /> Lựa chọn 1
                                        </span>
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                            paymentOption === 'FULL'
                                                ? 'border-[#C19D60] bg-[#C19D60] text-white'
                                                : 'border-gray-400'
                                        }`}>
                                            {paymentOption === 'FULL' && '✓'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-[#222] dark:text-white">
                                        Thanh Toán Ngay (100%)
                                    </p>
                                    <p className="text-sm font-serif font-bold text-[#C19D60] mt-1">
                                        {totalPrice.toLocaleString('vi-VN')}đ
                                    </p>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                        Không cần trả thêm khi Check-out
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentOption('DEPOSIT')}
                                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        paymentOption === 'DEPOSIT'
                                            ? 'border-[#C19D60] bg-[#C19D60]/10 shadow-md'
                                            : 'border-[#EAE3D2] dark:border-white/10 bg-[#FDFBF7] dark:bg-[#1f1f1f] hover:border-[#C19D60]/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <FiPercent /> Lựa chọn 2
                                        </span>
                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                            paymentOption === 'DEPOSIT'
                                                ? 'border-[#C19D60] bg-[#C19D60] text-white'
                                                : 'border-gray-400'
                                        }`}>
                                            {paymentOption === 'DEPOSIT' && '✓'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-[#222] dark:text-white">
                                        Gửi Tiền Cọc Giữ Phòng (30%)
                                    </p>
                                    <p className="text-sm font-serif font-bold text-[#C19D60] mt-1">
                                        {depositAmount.toLocaleString('vi-VN')}đ
                                    </p>
                                    <span className="text-[10px] text-[#777] dark:text-gray-400 font-medium mt-0.5">
                                        Còn lại {remainingAfterDeposit.toLocaleString('vi-VN')}đ trả lúc Check-out
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BẢNG TÓM TẮT CHO LỄ TÂN KHI TRẢ PHÒNG */}
                    {mode === 'CHECKOUT' && (
                        <div className="bg-[#C19D60]/10 border border-[#C19D60]/30 rounded-2xl px-4 py-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[#777] dark:text-gray-400 block text-[10px] uppercase font-bold">Khách lưu trú trả phòng</span>
                                    <strong className="text-[#222] dark:text-white text-sm">{booking.customer_name}</strong>
                                    {roomNum && <span className="text-[#C19D60] font-bold ml-1.5">• Phòng {roomNum}</span>}
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-[#C19D60] text-white px-2.5 py-1 rounded-md">
                                    #{shortCode}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[#C19D60]/20 grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white/70 dark:bg-black/20 p-2 rounded-lg">
                                    <span className="text-[9px] uppercase text-[#777] block">Tổng hóa đơn</span>
                                    <strong className="text-[#222] dark:text-white font-serif">{totalPrice.toLocaleString('vi-VN')}đ</strong>
                                </div>
                                <div className="bg-white/70 dark:bg-black/20 p-2 rounded-lg">
                                    <span className="text-[9px] uppercase text-[#777] block">Đã cọc / Đã trả</span>
                                    <strong className="text-emerald-600 dark:text-emerald-400 font-serif">{paidSoFar.toLocaleString('vi-VN')}đ</strong>
                                </div>
                                <div className="bg-white/70 dark:bg-black/20 p-2 rounded-lg border border-[#C19D60]/40">
                                    <span className="text-[9px] uppercase text-[#C19D60] font-bold block">Cần thu thêm</span>
                                    <strong className="text-[#C19D60] font-serif">{checkoutRemaining.toLocaleString('vi-VN')}đ</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QR Image */}
                    <div className="bg-[#FDFBF7] dark:bg-[#1f1f1f] p-4 rounded-2xl border border-[#EAE3D2] dark:border-white/10 flex flex-col items-center">
                        {mode === 'CHECKOUT' && checkoutRemaining === 0 ? (
                            <div className="py-6 px-4 text-center space-y-2">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto text-2xl">
                                    <FiCheck />
                                </div>
                                <p className="text-sm font-serif font-bold text-[#222] dark:text-white">
                                    Khách Hàng Đã Thanh Toán Đủ 100% ({totalPrice.toLocaleString('vi-VN')}đ)
                                </p>
                                <p className="text-xs text-[#777] dark:text-gray-400">
                                    Số tiền cần thu thêm: <strong className="text-emerald-500">0đ</strong>. Lễ tân có thể bấm xác nhận hoàn tất trả phòng ngay bên dưới.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white p-3 rounded-2xl shadow-md border border-[#EAE3D2]">
                                    <img
                                        src={qrUrl}
                                        alt="VietQR Payment"
                                        className="w-52 h-52 object-contain"
                                    />
                                </div>
                                <p className="text-[11px] text-[#777] dark:text-gray-400 mt-2.5 text-center">
                                    {mode === 'CHECKOUT'
                                        ? `Đưa mã QR này cho khách ${booking.customer_name} quét để thanh toán phần còn lại (${checkoutRemaining.toLocaleString('vi-VN')}đ) tại ${hotelName}`
                                        : paymentOption === 'DEPOSIT'
                                            ? `Quét mã QR để đặt cọc trước 30% (${depositAmount.toLocaleString('vi-VN')}đ). Phần còn lại 70% (${remainingAfterDeposit.toLocaleString('vi-VN')}đ) thanh toán khi trả phòng.`
                                            : 'Mở ứng dụng Ngân hàng hoặc Ví điện tử quét mã QR (Tự động điền đúng 100% số tiền & nội dung)'}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Thông tin chuyển khoản chi tiết */}
                    <div className="space-y-2 text-xs bg-[#F8F5F0] dark:bg-[#1d1d1d] p-4 rounded-2xl border border-[#EAE3D2] dark:border-white/10">
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
                            <span className="text-[#777]">
                                {mode === 'CHECKOUT'
                                    ? 'Số tiền cần thu khi Check-out:'
                                    : paymentOption === 'DEPOSIT'
                                        ? 'Số tiền đặt cọc giữ phòng (30%):'
                                        : 'Số tiền thanh toán ngay (100%):'}
                            </span>
                            <span className="text-base font-serif font-bold text-[#C19D60]">
                                {qrAmount.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        {mode === 'CUSTOMER' && paymentOption === 'DEPOSIT' && (
                            <div className="flex justify-between items-center text-[11px] text-[#777]">
                                <span>Số tiền còn lại (70% trả lúc Check-out):</span>
                                <span className="font-bold text-[#222] dark:text-gray-300">
                                    {remainingAfterDeposit.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        )}
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
                    <div className="space-y-2">
                        <button
                            onClick={handleConfirmPaid}
                            disabled={isConfirming}
                            className="w-full py-3.5 rounded-xl bg-[#C19D60] hover:bg-[#a68347] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#C19D60]/30 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FiCheck className="text-base" />
                            {isConfirming
                                ? 'Đang xử lý...'
                                : mode === 'CHECKOUT'
                                    ? 'Xác Nhận Đã Tất Toán & Hoàn Tất Trả Phòng (CHECKED_OUT)'
                                    : paymentOption === 'DEPOSIT'
                                        ? `Tôi Đã Chuyển Cọc 30% (${depositAmount.toLocaleString('vi-VN')}đ)`
                                        : `Tôi Đã Thanh Toán 100% (${totalPrice.toLocaleString('vi-VN')}đ)`}
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
                            : 'Tự động xác nhận giữ phòng & cộng điểm thưởng thành viên ngay khi hoàn tất'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VietQRModal;
