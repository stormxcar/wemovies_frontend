import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';


const ProtectedRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/auth/verifyUser", {
          withCredentials: true,
        });
        if (response.data.role === "ADMIN") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error("Chỉ admin mới có quyền truy cập!");
          navigate("/auth");
        }
      } catch (error) {
        setIsAdmin(false);
        toast.error("Vui lòng đăng nhập!");
        navigate("/auth");
      }
    };
    verifyUser();
  }, [navigate]);

  if (isAdmin === null) return <div>Đang tải...</div>;
  return isAdmin ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;


// const ProtectedRoute = ({ children }) => {
//   const [isAdmin, setIsAdmin] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const verifyUser = async () => {
//       try {
//         const token = localStorage.getItem("jwtToken");
//         if (!token) throw new Error("No token");
//         const response = await axios.get("/api/auth/verifyUser", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (response.data.role === "ADMIN") {
//           setIsAdmin(true);
//         } else {
//           setIsAdmin(false);
//           toast.error("Chỉ admin mới có quyền truy cập!");
//           navigate("/auth");
//         }
//       } catch (error) {
//         setIsAdmin(false);
//         toast.error("Vui lòng đăng nhập!");
//         navigate("/auth");
//       }
//     };
//     verifyUser();
//   }, [navigate]);

//   if (isAdmin === null) return <div>Đang tải...</div>;
//   return isAdmin ? children : <Navigate to="/auth" />;
// };