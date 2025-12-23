import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header"
import Sidebar from "../components/Sidebar";

const Dashboard = ({
  movies,
  setMovies,
  categories,
  setCategories,
  countries,
  setCountries,
  types,
  setTypes,
  users,
  setUsers,
  user,
  handleEditMovie,
  handleDeleteMovie,
  handleAddMovie,
  handleUpdateMovie,
  handleEditCategory,
  handleDeleteCategory,
  handleAddCategory,
  handleUpdateCategory,
  handleEditCountry,
  handleDeleteCountry,
  handleAddCountry,
  handleUpdateCountry,
  handleEditType,
  handleAddType,
  handleEditUser,
  handleDeleteUser,
  handleAddUser,
  handleUpdateUser,
}) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          navigate={navigate}
        />
        <main
          className={`flex-1 bg-gray-100 p-6 mt-16 overflow-y-auto transition-all duration-300 ${
            isSidebarOpen ? "md:ml-64" : "md:ml-0"
          }`}
        >
          <Outlet
            context={{
              movies,
              setMovies,
              categories,
              setCategories,
              countries,
              setCountries,
              types,
              setTypes,
              users,
              setUsers,
              handleEditMovie,
              handleDeleteMovie,
              handleAddMovie,
              handleUpdateMovie,
              handleEditCategory,
              handleDeleteCategory,
              handleAddCategory,
              handleUpdateCategory,
              handleEditCountry,
              handleDeleteCountry,
              handleAddCountry,
              handleUpdateCountry,
              handleEditType,
              handleAddType,
              handleEditUser,
              handleDeleteUser,
              handleAddUser,
              handleUpdateUser,
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;