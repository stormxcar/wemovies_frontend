import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        toast.error("Vui lòng đăng nhập!");
        navigate("/");
        return;
      }

      const userRole = user?.role?.roleName || user?.roleName || user?.role;
      console.log("ProtectedRoute - User role:", userRole, "Full user:", user);

      if (userRole !== "ADMIN") {
        toast.error("Chỉ admin mới có quyền truy cập!");
        navigate("/");
      }
    }
  }, [user, isAuthenticated, loading, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center">
        <ClipLoader color="#ffffff" size={50} />
      </div>
    );

  if (!isAuthenticated || !user) {
    return <Navigate to="/" />;
  }

  const userRole = user?.role?.roleName || user?.roleName || user?.role;
  const isAdmin = userRole === "ADMIN";

  return isAdmin ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
