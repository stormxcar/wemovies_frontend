import React, { useState } from "react";

// Home Component
const Home = () => {
  // Sample data
  const sampleMovies = [
    {
      id: 1,
      title: "Inception",
      category: "Action",
      country: "USA",
      type: "Movie",
      year: 2010,
      description:
        "A thief who steals corporate secrets through dream infiltration technology.",
    },
    {
      id: 2,
      title: "Parasite",
      category: "Drama",
      country: "Korea",
      type: "Movie",
      year: 2019,
      description:
        "A poor family schemes to become employed by a wealthy family.",
    },
  ];
  const sampleCategories = [
    { id: 1, name: "Action" },
    { id: 2, name: "Drama" },
  ];
  const sampleCountries = [
    { id: 1, name: "USA" },
    { id: 2, name: "Korea" },
  ];
  const sampleTypes = [
    { id: 1, name: "Movie" },
    { id: 2, name: "Series" },
  ];
  const sampleUsers = [
    { id: 1, username: "admin1", email: "admin1@example.com" },
    { id: 2, username: "admin2", email: "admin2@example.com" },
  ];
  // Home Component
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trang chủ</h1>
      <p>Chào mừng đến với bảng điều khiển quản trị website xem phim!</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tổng số phim</h2>
          <p className="text-2xl">{sampleMovies.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Danh mục</h2>
          <p className="text-2xl">{sampleCategories.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Người dùng</h2>
          <p className="text-2xl">{sampleUsers.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
