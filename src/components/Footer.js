import React from "react";
import { memo } from "react";
// import { Link } from "react-router-dom";

const Footer = memo(() => (
    <footer className="bg-gray-900 text-white py-6 w-full pt-20">
        <div className="container flex flex-col space-y-4 pl-[2.5rem] pt-4">

            {/* Logo and Social Media */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    <span className="text-xl font-semibold">Wemovies</span>
                    <span className="text-sm text-gray-400">Phim hay cả ngày</span>
                </div>
                <div className="flex space-x-3">
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v4.8c4.56-.93 8-4.96 8-9.8z"/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z"/></a>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
                <a href="#" className="hover:text-gray-300">Hỏi Đáp</a>
                <a href="#" className="hover:text-gray-300">Chính sách bảo mật</a>
                <a href="#" className="hover:text-gray-300">Điều khoản sử dụng</a>
                <a href="#" className="hover:text-gray-300">Giới thiệu</a>
                <a href="#" className="hover:text-gray-300">Liên hệ</a>
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
                <a href="#" className="hover:text-gray-300">Dongphim</a>
                <a href="#" className="hover:text-gray-300">Ghienphim</a>
                <a href="#" className="hover:text-gray-300">Motphim</a>
                <a href="#" className="hover:text-gray-300">Subnhanh</a>
            </div>

            {/* Description and Copyright */}
            <div className="text-xs text-gray-400 max-w-2xl">
                Wemovies– Phim hay cả ngày – Trang xem phim online chất lượng cao miễn phí ViệtSub, thuyết minh, lồng tiếng full HD. Khong chỉ phim mực hồng tố, phim chiếu rạp, phim bộ, phim lẻ từ những quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ... đã được cập nhật thường xuyên để đáp ứng nhu cầu xem phim của khán giả. Với giao diện thân thiện, kho phim phong phú và tốc độ tải nhanh, RoPhim sẽ mang đến trải nghiệm giải trí tuyệt vời nhất cho bạn trong năm 2024 với hơn 4K!
                <br /><br />
                © 2025 wemovies
            </div>
        </div>
    </footer>
));


export default Footer;