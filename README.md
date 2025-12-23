# WeMovies - Movie Streaming Platform

WeMovies là một nền tảng xem phim trực tuyến hiện đại, cung cấp trải nghiệm giải trí tuyệt vời với giao diện thân thiện, kho phim phong phú và tốc độ tải nhanh.

## 🚀 Tính năng chính

### 👤 Người dùng

- **Xem phim**: Duyệt và xem hàng nghìn bộ phim với chất lượng cao
- **Tìm kiếm**: Tìm phim theo tên, thể loại, quốc gia
- **Danh mục phim**: Phân loại phim theo thể loại, quốc gia, năm phát hành
- **Responsive**: Hoạt động mượt mà trên mọi thiết bị

### 👨‍💼 Admin Panel

- **Quản lý phim**: Thêm, sửa, xóa phim với thông tin chi tiết
- **Quản lý danh mục**: CRUD operations cho categories, countries, types
- **Quản lý người dùng**: Xem và quản lý tài khoản người dùng

## 🛠️ Tech Stack

## 📦 Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js >= 18
- npm hoặc yarn

### Cài đặt dependencies

```bash
npm install
```

### Cấu hình environment

## 📁 Cấu trúc dự án

```
src/
├── components/          # UI components
│   ├── auth/           # Authentication components
│   ├── Banner.jsx      # Hero banner
│   ├── CardMovie.jsx   # Movie card
│   └── ...
├── admin/              # Admin panel
│   ├── api/           # Admin API calls
│   ├── components/    # Admin components
│   └── pages/         # Admin pages
├── services/          # API services
├── utils/             # Utilities
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## 🔧 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
