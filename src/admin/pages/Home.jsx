import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import {
  fetchCategories as getCategories,
  fetchMovies as getMovies,
  fetchUsers as getUsers,
} from "../../services/api";

// Home Component
const Home = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      const fetchData = async () => {
        const categoriesData = await getCategories();
        const moviesData = await getMovies();
        const usersData = await getUsers();

        setCategories(categoriesData);
        setMovies(moviesData);
        setUsers(usersData);
      };
      fetchData();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    console.log("====================================");
    console.log("data users:", users);
    console.log("====================================");
  }, [users]);

  // Home Component
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trang chủ</h1>
      <p>Chào mừng đến với bảng điều khiển quản trị website xem phim!</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/movies" className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tổng số phim</h2>
          <p className="text-2xl">{movies.length}</p>
        </Link>
        <Link to="/admin/categories" className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Danh mục</h2>
          <p className="text-2xl">{categories.length}</p>
        </Link>
        <Link to="/admin/users" className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Người dùng</h2>
          <p className="text-2xl">{users.length}</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;
