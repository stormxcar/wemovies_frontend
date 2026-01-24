import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { ClipLoader } from "react-spinners";
import { fetchJson } from "../../services/api";
import ResetPasswordForm from "./ResetPasswordForm";

function LoginForm({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const { login, isAuthenticated, checkAuthStatus } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", passWord: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] =
    useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
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
        },
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

        // Fix toast error với proper toast options
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // Login thành công
      const data = await response.json();

      // Lưu tokens và user data vào localStorage
      if (data.accessToken) localStorage.setItem("jwtToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);
      if (data.user || data) {
        localStorage.setItem("user", JSON.stringify(data.user || data));
      }

      // Update auth context directly with login data (no need to call checkAuthStatus)
      const loginResult = await login(loginForm.email, loginForm.passWord);
      if (!loginResult.success) {
        throw new Error(loginResult.message);
      }

      toast.success("Đăng nhập thành công!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
      console.error("Login error:", error);

      // Improved error handling
      let errorMessage = "Đăng nhập thất bại";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
      } else if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          `Lỗi server: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "Không thể kết nối tới server. Vui lòng thử lại sau.";
      } else if (error.message) {
        // Something else happened
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler cho quên mật khẩu
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      toast.error("Vui lòng nhập email", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsForgotPasswordSubmitting(true);
    try {
      const response = await fetchJson("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail.trim(),
        }),
      });

      toast.success(
        "OTP đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.",
        {
          position: "top-right",
          autoClose: 3000,
        },
      );

      // Chuyển sang form nhập OTP và reset password
      setResetPasswordEmail(forgotPasswordEmail.trim());
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setForgotPasswordEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    console.log("Google credentialResponse:", credentialResponse);
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("Google ID Token is null or undefined");
      toast.error("Không nhận được Google ID Token", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      console.log("Sending Google ID Token:", idToken);
      const response = await fetchJson("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      console.log("Google API response:", response);

      // Debug response structure
      console.log("Response keys:", Object.keys(response || {}));
      console.log("Response.user:", response?.user);
      console.log("Response direct:", response);

      if (!response) {
        throw new Error("Google login failed: No response data");
      }

      // Lưu tokens vào localStorage nếu có
      if (response.accessToken) {
        localStorage.setItem("jwtToken", response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      // Lấy thông tin user từ response
      const userData = response.user;
      const role = userData?.role?.roleName || "USER"; // Default to USER for Google login

      // Lưu user info vào localStorage
      const userInfo = {
        displayName:
          userData.fullName || userData.email?.split("@")[0] || "User",
        avatarUrl: userData.avatarUrl || "https://via.placeholder.com/40",
        role: role,
        email: userData.email,
        id: userData.email, // Sử dụng email làm ID
      };
      localStorage.setItem("user", JSON.stringify(userInfo));

      if (role === "ADMIN") {
        toast.success("Đăng nhập Admin bằng Google thành công!");
        onLoginSuccess(userInfo);
        navigate("/admin");
      } else if (role === "USER") {
        toast.success("Đăng nhập bằng Google thành công!");
        onLoginSuccess(userInfo);
        navigate("/");
      } else {
        toast.error("Tài khoản Google không hợp lệ hoặc chưa được xác thực", {
          position: "top-right",
          autoClose: 4000,
        });
        try {
          await fetchJson("/api/auth/logout", {
            method: "POST",
          });
        } catch (logoutError) {
          console.warn("Logout failed:", logoutError);
        }
        onClose();
      }
    } catch (error) {
      console.error("Google login error:", error);
      console.log("Error response data:", error?.response?.data);
      console.log("Error status:", error?.response?.status);
      console.log("Error headers:", error?.response?.headers);

      // Extract error message from response
      let errorMessage = "Đăng nhập bằng Google thất bại";

      // Handle specific backend database error
      if (
        error.response?.data?.accessToken?.includes("pass_word") &&
        error.response?.data?.accessToken?.includes("cannot be null")
      ) {
        errorMessage = "Lỗi hệ thống";
      } else if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (
          error.response.data.accessToken &&
          error.response.data.accessToken.includes("Google login failed")
        ) {
          errorMessage =
            "Lỗi backend khi xử lý Google login. Vui lòng thử lại sau.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleGoogleLoginError = () => {
    toast.error("Đăng nhập bằng Google thất bại", {
      position: "top-right",
      autoClose: 3000,
    });
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

          {/* Nút quên mật khẩu */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-300 hover:text-blue-200 text-sm underline"
              disabled={isSubmitting || isBlocked}
            >
              Quên mật khẩu?
            </button>
          </div>
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

        {/* Modal Quên mật khẩu */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
            <div className="bg-blue-950/90 p-8 rounded-lg shadow-xl w-full max-w-sm relative">
              <button
                className="absolute top-2 right-2 text-white hover:text-gray-300"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail("");
                }}
              >
                <FaTimes />
              </button>

              <h3 className="text-lg text-white font-semibold mb-4">
                Quên mật khẩu
              </h3>

              <p className="text-gray-300 text-sm mb-4">
                Nhập email của bạn để nhận OTP đặt lại mật khẩu
              </p>

              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  disabled={isForgotPasswordSubmitting}
                  className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  required
                />

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                    disabled={isForgotPasswordSubmitting}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={isForgotPasswordSubmitting}
                    className="flex-1 bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isForgotPasswordSubmitting ? (
                      <>
                        <ClipLoader
                          size={16}
                          color="#000000"
                          className="mr-2"
                        />
                        Đang gửi...
                      </>
                    ) : (
                      "Gửi OTP"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Reset Password với OTP */}
        {showResetPassword && (
          <ResetPasswordForm
            onClose={() => {
              setShowResetPassword(false);
              setResetPasswordEmail("");
            }}
            userEmail={resetPasswordEmail}
          />
        )}
      </div>
    </div>
  );
}

export default LoginForm;
