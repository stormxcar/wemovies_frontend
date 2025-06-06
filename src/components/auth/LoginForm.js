import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchJson } from "../../services/api";

function LoginForm({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email,
          passWord: loginForm.password,
        }),
        credentials: "include",
      });
      if (!response) throw new Error("Login failed: No response data");

      const verifyResponse = await fetchJson("/api/auth/verifyUser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      const role = verifyResponse?.role || verifyResponse?.data?.role?.roleName;
      if (role === "ADMIN") {
        toast.success("Đăng nhập Admin thành công!");
        onLoginSuccess({
          displayName:
            verifyResponse.displayName || loginForm.email.split("@")[0],
          avatarUrl:
            verifyResponse.avatarUrl || "https://via.placeholder.com/40",
          role,
        });
        navigate("/admin");
      } else if (role === "USER") {
        toast.success("Đăng nhập thành công!");
        onLoginSuccess({
          displayName:
            verifyResponse.displayName || loginForm.email.split("@")[0],
          avatarUrl:
            verifyResponse.avatarUrl || "https://via.placeholder.com/40",
          role,
        });
        navigate("/");

        // toast.error("Chỉ admin mới có quyền truy cập!");
        // await fetchJson("/api/auth/logout", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Accept: "application/json",
        //   },
        //   credentials: "include",
        // });
      } else {
        toast.error("Tài khoản không hợp lệ hoặc chưa được xác thực");
        await fetchJson("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
        onClose();
      }
    } catch (error) {
      toast.error(error.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-blue-950/70 p-10 rounded-lg shadow-xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl text-white font-semibold mb-4">
          Đăng nhập ngay
        </h2>
        <p className="text-gray-300 mb-6">
          Nếu bạn chưa có tài khoản,{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
            className="text-blue-300"
          >
            đăng ký ngay
          </a>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
            placeholder="Email"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            placeholder="Mật khẩu"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
