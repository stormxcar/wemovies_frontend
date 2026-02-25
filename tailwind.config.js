/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Áp dụng Tailwind cho toàn bộ file trong thư mục src
  ],
  darkMode: "class", // Enable dark mode using class strategy
  theme: {
    extend: {}, // Có thể thêm cấu hình mở rộng tại đây
  },
  plugins: [], // Thêm các plugin Tailwind (nếu cần) vào đây
};
