import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCategories } from "../admin/api/Category.api";
import { getCountries } from "../admin/api/Country.api";
import { getMovies } from "../admin/api/Movie.api";
import { getTypes } from "../admin/api/Type.api";
import { getUsers } from "../admin/api/User.api";

// Home Component
const Home = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [users, setUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const fetchData = async () => {
        const categoriesData = await getCategories();
        const countriesData = await getCountries();
        const moviesData = await getMovies();
        const typesData = await getTypes();
        const usersData = await getUsers();

        setCategories(categoriesData);
        setCountries(countriesData);
        setMovies(moviesData);
        setTypes(typesData);
        setUsers(usersData);
      };
      fetchData();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

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
