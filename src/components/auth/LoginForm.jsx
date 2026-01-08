import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { ClipLoader } from "react-spinners";
import axios from "axios";

function LoginForm({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login, isAuthenticated, checkAuthStatus } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", passWord: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isBlocked) return; // Prevent multiple submissions or when blocked

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginForm.email,
            passWord: loginForm.passWord,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = await response.text();

        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorMessage);
          if (typeof errorData === "object" && errorData !== null) {
            // If it's an object with field errors, get the first error message
            const firstError = Object.values(errorData)[0];
            errorMessage =
              typeof firstError === "string"
                ? firstError
                : "Đăng nhập thất bại";
          }
        } catch (e) {
          // Not JSON, use as is
        }

        // Kiểm tra nếu là lỗi IP blocking
        if (errorMessage.includes("IP của bạn đã bị tạm khóa")) {
          // Parse thời gian còn lại từ message
          const minutesMatch = errorMessage.match(/(\d+) phút/);
          const remainingMinutes = minutesMatch
            ? parseInt(minutesMatch[1])
            : 15;

          // Hiển thị thông báo block và disable form
          showBlockMessage(remainingMinutes);
          disableLoginForm(remainingMinutes);
          return;
        }

        toast.error(errorMessage);
        return;
      }

      // Login thành công
      const data = await response.json();

      // Lưu tokens vào localStorage
      if (data.accessToken) localStorage.setItem("jwtToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);

      // Update auth context
      await checkAuthStatus();

      toast.success("Đăng nhập thành công!");
      if (onLoginSuccess) {
        onLoginSuccess(data.user || data);
      }
      // Always check user role and navigate accordingly
      const userRole =
        (data.user || data)?.role?.roleName ||
        (data.user || data)?.roleName ||
        (data.user || data)?.role;
      console.log("User role:", userRole, "Full user:", data.user || data);
      if (userRole === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error("Lỗi kết nối mạng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    console.log("Google credentialResponse:", credentialResponse);
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("Google ID Token is null or undefined");
      toast.error("Không nhận được Google ID Token");
      return;
    }

    try {
      console.log("Sending Google ID Token:", idToken);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          idToken: idToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("Google API response:", response.data);
      if (!response.data || !response.data.user) {
        throw new Error("Google login failed: No user data");
      }

      const verifyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/verifyUser`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      const role =
        verifyResponse.data?.role || verifyResponse.data?.data?.role?.roleName;
      if (role === "ADMIN") {
        toast.success("Đăng nhập Admin bằng Google thành công!");
        onLoginSuccess({
          displayName:
            verifyResponse.data.fullName ||
            response.data.user.email.split("@")[0],
          avatarUrl:
            verifyResponse.data.avatar || "https://via.placeholder.com/40",
          role,
          email: verifyResponse.data.email,
        });
        navigate("/admin");
      } else if (role === "USER") {
        toast.success("Đăng nhập bằng Google thành công!");
        onLoginSuccess({
          displayName:
            verifyResponse.data.fullName ||
            response.data.user.email.split("@")[0],
          avatarUrl:
            verifyResponse.data.avatar || "https://via.placeholder.com/40",
          role,
          email: verifyResponse.data.email,
        });
        navigate("/");
      } else {
        toast.error("Tài khoản Google không hợp lệ hoặc chưa được xác thực");
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/logout`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );
        onClose();
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message || "Đăng nhập bằng Google thất bại");
    }
  };

  const handleGoogleLoginError = () => {
    toast.error("Đăng nhập bằng Google thất bại");
  };

  const showBlockMessage = (remainingMinutes) => {
    const message = `IP của bạn đã bị tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`;
    setBlockMessage(message);
    setIsBlocked(true);
  };

  const enableLoginForm = () => {
    setIsBlocked(false);
    setBlockMessage("");
  };

  const disableLoginForm = (remainingMinutes) => {
    setIsBlocked(true);
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
            className="text-blue-300"
          >
            đăng ký ngay
          </button>
        </p>
        <form onSubmit={handleSubmit}>
          {isBlocked && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-md">
              <p className="text-red-300 text-sm">{blockMessage}</p>
            </div>
          )}
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
            placeholder="Email"
            disabled={isSubmitting || isBlocked}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <input
            type="password"
            value={loginForm.passWord}
            onChange={(e) =>
              setLoginForm({ ...loginForm, passWord: e.target.value })
            }
            placeholder="Mật khẩu"
            disabled={isSubmitting || isBlocked}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || isBlocked}
            className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <ClipLoader size={20} color="#000000" className="mr-2" />
                Đang xử lý...
              </>
            ) : isBlocked ? (
              "Đang bị khóa"
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
        <div className="mt-4">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            theme="filled_blue"
            size="large"
            text="signin_with"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
