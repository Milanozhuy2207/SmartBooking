import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMapPin, FiStar } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi';
import axiosClient from '../api/axiosClient';

interface RecommendedHotel {
    _id: string;
    name: string;
    location: string;
    star_rating: number;
    image_url: string;
    minPrice: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    recommendations?: RecommendedHotel[];
}

interface AIConciergeChatProps {
    onSelectHotelById: (hotelId: string) => void;
}

const QUICK_PROMPTS = [
    'Gợi ý resort 6 sao biển đẹp nhất',
    'Khách sạn dưới 10 triệu tại Hà Nội',
    'Biệt thự biển tại Đà Nẵng hoặc Phú Quốc',
    'Nghỉ dưỡng săn mây tại Sapa / Đà Lạt'
];

const AIConciergeChat = ({ onSelectHotelById }: AIConciergeChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            text: 'Xin kính chào Quý khách! Tôi là **Quản gia AI (SmartBooking Butler)**. Quý khách đang tìm kiếm kỳ nghỉ tại đâu, ngân sách bao nhiêu triệu/đêm hay yêu thích phong cách biệt thự biển / phố cổ để tôi tư vấn ngay ạ?'
        }
    ]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (promptText?: string) => {
        const textToSend = (promptText ?? input).trim();
        if (!textToSend || isSending) return;

        if (!promptText) setInput('');
        setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
        setIsSending(true);

        try {
            const res = await axiosClient.post('/ai/chat', { message: textToSend });
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    text: res.data?.reply || 'Tôi đã tìm thấy các lựa chọn phù hợp nhất cho Quý khách:',
                    recommendations: res.data?.recommendations || []
                }
            ]);
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    text: 'Hiện tại hệ thống tư vấn đang bận trong giây lát. Quý khách vui lòng thử lại nhé!'
                }
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[120] font-sans">
            {/* Nút mở Bong bóng Chat AI */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-3 bg-gradient-to-r from-[#1a1a1a] to-[#2b2b2b] hover:from-[#C19D60] hover:to-[#a68347] text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl border border-[#C19D60]/50 transition-all duration-300 hover:scale-105"
                >
                    <div className="w-10 h-10 rounded-full bg-[#C19D60] group-hover:bg-black/25 flex items-center justify-center text-white shadow-md">
                        <FiMessageSquare className="text-lg" />
                    </div>
                    <div className="text-left">
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-[#C19D60] group-hover:text-white/90 font-bold">
                            AI Concierge 24/7
                        </span>
                        <span className="block text-xs font-serif font-bold tracking-wide">
                            Trợ Lý Tư Vấn Phòng 5-6★
                        </span>
                    </div>
                </button>
            )}

            {/* Cửa sổ Chat AI Butler */}
            {isOpen && (
                <div className="w-[370px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-[#161616] border border-[#EAE3D2] dark:border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#141414] to-[#242424] px-5 py-4 flex items-center justify-between border-b border-[#C19D60]/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C19D60] to-[#8f6f38] flex items-center justify-center text-white font-serif font-bold text-base shadow-md">
                                AI
                            </div>
                            <div>
                                <h4 className="text-white font-serif text-base leading-tight flex items-center gap-1.5">
                                    SmartBooking Butler <FiStar className="text-[#C19D60] text-xs" />
                                </h4>
                                <p className="text-[10px] uppercase tracking-widest text-[#C19D60] font-bold">
                                    Trợ lý AI gợi ý khách sạn & giá phòng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        >
                            <FiX />
                        </button>
                    </div>

                    {/* Danh sách tin nhắn */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7] dark:bg-[#111]">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                                        msg.role === 'user'
                                            ? 'bg-[#C19D60] text-white rounded-br-xs font-medium shadow-sm'
                                            : 'bg-white dark:bg-[#1d1d1d] text-[#222] dark:text-gray-200 border border-[#EAE3D2] dark:border-white/10 rounded-bl-xs shadow-xs'
                                    }`}
                                >
                                    {msg.text}
                                </div>

                                {/* Thẻ khách sạn gợi ý đính kèm */}
                                {msg.recommendations && msg.recommendations.length > 0 && (
                                    <div className="mt-2.5 w-full space-y-2">
                                        {msg.recommendations.map((h) => (
                                            <div
                                                key={h._id}
                                                onClick={() => {
                                                    onSelectHotelById(h._id);
                                                    setIsOpen(false);
                                                }}
                                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-[#EAE3D2] dark:border-white/10 hover:border-[#C19D60] cursor-pointer transition-all shadow-xs hover:shadow-md group"
                                            >
                                                <img
                                                    src={h.image_url}
                                                    alt={h.name}
                                                    className="w-16 h-14 rounded-lg object-cover shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1 text-[#C19D60] text-[10px] font-bold">
                                                        {[...Array(h.star_rating)].map((_, idx) => (
                                                            <HiStar key={idx} />
                                                        ))}
                                                        <span>({h.star_rating}★)</span>
                                                    </div>
                                                    <p className="text-xs font-serif font-bold text-[#222] dark:text-white truncate group-hover:text-[#C19D60]">
                                                        {h.name}
                                                    </p>
                                                    <p className="text-[10px] text-[#777] flex items-center gap-1 truncate">
                                                        <FiMapPin className="text-[#C19D60] shrink-0" /> {h.location}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="block text-[9px] uppercase text-[#777]">Từ</span>
                                                    <span className="text-xs font-serif font-bold text-[#C19D60]">
                                                        {(h.minPrice / 1000000).toFixed(1)}tr
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isSending && (
                            <div className="flex items-center gap-2 text-xs text-[#C19D60] bg-white dark:bg-[#1d1d1d] px-4 py-2.5 rounded-2xl w-fit border border-[#EAE3D2] dark:border-white/10">
                                <span className="w-2 h-2 rounded-full bg-[#C19D60] animate-bounce"></span>
                                <span className="w-2 h-2 rounded-full bg-[#C19D60] animate-bounce [animation-delay:150ms]"></span>
                                <span className="w-2 h-2 rounded-full bg-[#C19D60] animate-bounce [animation-delay:300ms]"></span>
                                <span className="ml-1 text-[11px] text-[#777]">Quản gia AI đang phân tích...</span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Gợi ý câu hỏi nhanh */}
                    <div className="px-3 py-2 bg-[#F8F5F0] dark:bg-[#181818] border-t border-[#EAE3D2] dark:border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {QUICK_PROMPTS.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(q)}
                                className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-[#242424] text-[#555] dark:text-gray-300 border border-[#EAE3D2] dark:border-white/10 hover:border-[#C19D60] hover:text-[#C19D60] transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Ô nhập tin nhắn */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="p-3 bg-white dark:bg-[#161616] border-t border-[#EAE3D2] dark:border-white/10 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập địa điểm, ngân sách (VD: Đà Nẵng dưới 15 triệu)..."
                            className="flex-1 bg-[#F8F5F0] dark:bg-[#222] text-xs text-[#222] dark:text-white px-3.5 py-2.5 rounded-xl outline-none border border-transparent focus:border-[#C19D60]"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !input.trim()}
                            className="w-10 h-10 rounded-xl bg-[#C19D60] hover:bg-[#a68347] disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
                        >
                            <FiSend />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIConciergeChat;
