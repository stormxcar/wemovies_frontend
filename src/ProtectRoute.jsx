import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const API_BASE_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL;

const ProtectedRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/verifyUser`,
          {
            withCredentials: true,
          }
        );
        if (response.data.role === "ADMIN") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error("Chỉ admin mới có quyền truy cập!");
          navigate("/");
        }
      } catch (error) {
        setIsAdmin(false);
        toast.error("Vui lòng đăng nhập!");
        navigate("/");
      }
    };
    verifyUser();
  }, [navigate]);

  if (isAdmin === null)
    return (
      <div className="flex justify-center items-center">
        <ClipLoader color="#ffffff" size={50} />
      </div>
    );
  return isAdmin ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
