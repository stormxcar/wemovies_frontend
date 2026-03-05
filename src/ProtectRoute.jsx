import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "@toast";
import { ClipLoader } from "react-spinners";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        toast.info(t("route.login_required"));
        navigate("/");
        return;
      }

      const userRole = user?.role?.roleName || user?.roleName || user?.role;
      if (userRole !== "ADMIN") {
        toast.error(t("route.admin_only"));
        navigate("/");
      }
    }
  }, [user, isAuthenticated, loading, navigate, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <ClipLoader color="#ffffff" size={50} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" />;
  }

  const userRole = user?.role?.roleName || user?.roleName || user?.role;
  const isAdmin = userRole === "ADMIN";

  return isAdmin ? children : <Navigate to="/" />;
};

// Component mới để bảo vệ routes cần đăng nhập (cho tất cả users đã đăng nhập)
export const AuthRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        toast.error(t("route.login_required"));
        navigate("/");
        return;
      }
    }
  }, [user, isAuthenticated, loading, navigate, t]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <ClipLoader color="#ffffff" size={50} />
      </div>
    );

  if (!isAuthenticated || !user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
