const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

function buildSmartLocalConcierge(message, hotelsWithRooms) {
    const q = (message || '').toLowerCase();

    // 1. Parse budget in VND (e.g. "dưới 10 triệu", "5tr", "20 triệu")
    let maxBudget = null;
    const budgetMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|trieu|m\b)/i);
    if (budgetMatch) {
        maxBudget = parseFloat(budgetMatch[1].replace(',', '.')) * 1000000;
    }

    // 2. Parse star preference (e.g. "6 sao")
    const wants6Star = q.includes('6 sao') || q.includes('6*') || q.includes('6★') || q.includes('siêu sang') || q.includes('đắt nhất');

    // 3. Parse destination keywords
    const locationKeywords = [
        { keys: ['đà nẵng', 'da nang', 'sơn trà'], match: 'Đà Nẵng' },
        { keys: ['phú quốc', 'phu quoc', 'kiên giang', 'đảo ngọc'], match: 'Kiên Giang' },
        { keys: ['nha trang', 'khánh hòa', 'ninh vân', 'hòn tre'], match: 'Khánh Hòa' },
        { keys: ['hà nội', 'ha noi', 'hoàn kiếm', 'thủ đô'], match: 'Hà Nội' },
        { keys: ['sài gòn', 'hồ chí minh', 'tphcm', 'quận 1', 'hcm'], match: 'Hồ Chí Minh' },
        { keys: ['sapa', 'lào cai', 'tây bắc', 'fansipan', 'săn mây'], match: 'Lào Cai' },
        { keys: ['hạ long', 'quảng ninh', 'vịnh'], match: 'Quảng Ninh' },
        { keys: ['huế', 'hue', 'cố đô', 'sông hương'], match: 'Thừa Thiên Huế' },
        { keys: ['hội an', 'quảng nam', 'nam hải'], match: 'Quảng Nam' },
        { keys: ['ninh thuận', 'vĩnh hy', 'amanoi'], match: 'Ninh Thuận' },
        { keys: ['đà lạt', 'da lat', 'lâm đồng', 'hồ xuân hương'], match: 'Lâm Đồng' },
        { keys: ['côn đảo', 'con dao', 'vũng tàu'], match: 'Bà Rịa' }
    ];

    let matchedLoc = null;
    for (const loc of locationKeywords) {
        if (loc.keys.some(k => q.includes(k))) {
            matchedLoc = loc.match;
            break;
        }
    }

    // Filter hotels
    let candidates = [...hotelsWithRooms];
    if (matchedLoc) {
        candidates = candidates.filter(h => h.location.toLowerCase().includes(matchedLoc.toLowerCase()));
    }
    if (wants6Star) {
        const sixStarOnly = candidates.filter(h => h.star_rating >= 6);
        if (sixStarOnly.length > 0) candidates = sixStarOnly;
    }
    if (maxBudget) {
        const withinBudget = candidates.filter(h => h.minPrice <= maxBudget);
        if (withinBudget.length > 0) candidates = withinBudget;
    }

    // Sort: if budget specified, sort closest to budget; if 6 star, sort highest star & price; otherwise curated mix
    if (wants6Star) {
        candidates.sort((a, b) => b.star_rating - a.star_rating || b.minPrice - a.minPrice);
    } else if (maxBudget) {
        candidates.sort((a, b) => a.minPrice - b.minPrice);
    } else {
        candidates.sort((a, b) => b.star_rating - a.star_rating);
    }

    const topPicks = candidates.slice(0, 3);

    let intro = 'Xin chào Quý khách! Với tư cách là **Quản gia AI (SmartBooking Butler)**, tôi xin gợi ý những tuyệt tác nghỉ dưỡng phù hợp nhất với yêu cầu của Quý khách:';
    if (matchedLoc && maxBudget) {
        intro = `Tại khu vực **${matchedLoc}** với ngân sách khoảng **${(maxBudget / 1000000).toFixed(0)} triệu VNĐ/đêm**, đây là những lựa chọn đẳng cấp nhất dành cho Quý khách:`;
    } else if (matchedLoc) {
        intro = `Tại điểm đến **${matchedLoc}**, hệ thống SmartBooking sở hữu những khách sạn & khu nghỉ dưỡng biểu tượng sau:`;
    } else if (maxBudget) {
        intro = `Với ngân sách dưới **${(maxBudget / 1000000).toFixed(0)} triệu VNĐ/đêm**, Quý khách có thể tận hưởng kỳ nghỉ 5–6 sao tại các điểm đến hàng đầu sau:`;
    } else if (wants6Star) {
        intro = `Dưới đây là các **Khu nghỉ dưỡng & Khách sạn Siêu Sang chuẩn 6 Sao (6★ Ultra-Luxury)** danh giá bậc nhất Việt Nam trên hệ thống SmartBooking:`;
    }

    const lines = topPicks.map((h, i) => {
        const sampleRoom = maxBudget
            ? (h.rooms.filter(r => r.price_per_night <= maxBudget).pop() || h.rooms[0])
            : h.rooms[0];
        return `${i + 1}. **${h.name}** (${h.star_rating}★ - ${h.location})\n   • Giá chỉ từ: **${h.minPrice.toLocaleString('vi-VN')}đ/đêm** (Gợi ý: *${sampleRoom?.name || 'Phòng ' + sampleRoom?.room_number}* - Mã phòng \`${sampleRoom?.room_number}\`)\n   • Điểm nhấn: ${h.description}`;
    });

    const outro = '\n\nQuý khách có thể **bấm trực tiếp vào thẻ khách sạn bên dưới** để xem sơ đồ 60 phòng trống thực tế và đặt phòng ngay!';

    return {
        reply: `${intro}\n\n${lines.join('\n\n')}${outro}`,
        recommendations: topPicks.map(h => ({
            _id: h._id,
            name: h.name,
            location: h.location,
            star_rating: h.star_rating,
            image_url: h.image_url,
            minPrice: h.minPrice
        }))
    };
}

exports.chatWithConcierge = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi' });
        }

        const hotels = await Hotel.find().lean();
        const allRooms = await Room.find().sort({ price_per_night: 1 }).lean();

        const hotelsWithRooms = hotels.map(h => {
            const hRooms = allRooms.filter(r => r.hotel_id.toString() === h._id.toString());
            return {
                ...h,
                rooms: hRooms,
                minPrice: hRooms[0]?.price_per_night || 2500000
            };
        });

        // Always prepare smart database recommendations
        const localResult = buildSmartLocalConcierge(message, hotelsWithRooms);

        // If GEMINI_API_KEY is available, enhance reply with Gemini while keeping matched hotel cards
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey.length > 10 && !apiKey.includes('YOUR_')) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const catalogSummary = hotelsWithRooms
                    .map(h => `- ${h.name} (${h.star_rating} sao, tại ${h.location}): Giá từ ${h.minPrice.toLocaleString('vi-VN')}đ/đêm. ${h.description}`)
                    .join('\n');

                const prompt = `Bạn là Quản gia AI cao cấp (Luxury Concierge Butler) của nền tảng đặt phòng 5-6 sao SmartBooking tại Việt Nam.
Danh sách 17 khách sạn thực tế trong cơ sở dữ liệu:
${catalogSummary}

Câu hỏi của khách hàng: "${message}"
Hãy trả lời ngắn gọn, lịch thiệp, sang trọng bằng tiếng Việt (tối đa 140 từ), gợi ý 2-3 khách sạn phù hợp nhất kèm mức giá thực tế.`;

                const result = await model.generateContent(prompt);
                const aiText = result?.response?.text();
                if (aiText) {
                    return res.status(200).json({
                        success: true,
                        reply: aiText,
                        recommendations: localResult.recommendations
                    });
                }
            } catch {
                // Fallback gracefully to smart local concierge engine
            }
        }

        return res.status(200).json({
            success: true,
            reply: localResult.reply,
            recommendations: localResult.recommendations
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
