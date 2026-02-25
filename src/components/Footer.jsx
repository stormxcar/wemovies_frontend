import React from "react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
// import { Link } from "react-router-dom";

const Footer = memo(() => {
  const { themeClasses } = useTheme();
  const { t } = useTranslation();

  return (
    <footer
      className={`${themeClasses.secondary} ${themeClasses.textPrimary} py-6 w-full pt-20`}
    >
      <div className="container flex flex-col space-y-4 pl-[2.5rem] pt-4">
        {/* Logo and Social Media */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span className="text-xl font-semibold">Wemovies</span>
            <span className="text-sm text-gray-400">Phim hay cả ngày</span>
          </div>
          <div className="flex space-x-3">
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v4.8c4.56-.93 8-4.96 8-9.8z" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
          <button type="button" className="hover:text-gray-300">
            Hỏi Đáp
          </button>
          <button type="button" className="hover:text-gray-300">
            Chính sách bảo mật
          </button>
          <button type="button" className="hover:text-gray-300">
            Điều khoản sử dụng
          </button>
          <button type="button" className="hover:text-gray-300">
            Giới thiệu
          </button>
          <button type="button" className="hover:text-gray-300">
            Liên hệ
          </button>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
          <button type="button" className="hover:text-gray-300">
            Dongphim
          </button>
          <button type="button" className="hover:text-gray-300">
            Ghienphim
          </button>
          <button type="button" className="hover:text-gray-300">
            Motphim
          </button>
          <button type="button" className="hover:text-gray-300">
            Subnhanh
          </button>
        </div>

        {/* Description and Copyright */}
        <div className="text-xs text-gray-400 max-w-2xl">
          {t("footer.description")}
          <br />
          <br />
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
});

export default Footer;
