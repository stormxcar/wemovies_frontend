import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { ClipLoader } from "react-spinners";
import { fetchJson } from "../../services/api";
import ResetPasswordForm from "./ResetPasswordForm";

function LoginForm({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const { t } = useTranslation();
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
      const loginResult = await login(loginForm.email, loginForm.passWord);
      if (!loginResult?.success) {
        const errorMessage =
          loginResult?.message || t("auth.login_failed_retry");

        if (errorMessage.includes("IP của bạn đã bị tạm khóa")) {
          const minutesMatch = errorMessage.match(/(\d+) phút/);
          const remainingMinutes = minutesMatch
            ? parseInt(minutesMatch[1])
            : 15;
          showBlockMessage(remainingMinutes);
          disableLoginForm(remainingMinutes);
          return;
        }

        throw new Error(errorMessage);
      }

      toast.success(t("auth.login_success"), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      if (onLoginSuccess) {
        onLoginSuccess(loginResult.user);
      }
      // Always check user role and navigate accordingly
      const userRole =
        loginResult?.user?.role?.roleName ||
        loginResult?.user?.roleName ||
        loginResult?.user?.role;
      if (userRole === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      // Improved error handling
      let errorMessage = t("auth.login_failed");

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = t("auth.network_error");
      } else if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          t("auth.server_error", { status: error.response.status });
      } else if (error.request) {
        // Request made but no response received
        errorMessage = t("auth.server_unreachable");
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
      toast.error(t("auth.forgot.enter_email"), {
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

      toast.success(t("auth.forgot.otp_sent"), {
        position: "top-right",
        autoClose: 3000,
      });

      // Chuyển sang form nhập OTP và reset password
      setResetPasswordEmail(forgotPasswordEmail.trim());
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setForgotPasswordEmail("");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("auth.forgot.send_otp_error");
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast.error(t("auth.google_no_token"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await fetchJson("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });
      // Debug response structure
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
        avatarUrl: userData.avatarUrl || "/placeholder-professional.svg",
        role: role,
        email: userData.email,
        id: userData.email, // Sử dụng email làm ID
      };
      localStorage.setItem("user", JSON.stringify(userInfo));

      if (role === "ADMIN") {
        toast.success(t("auth.google_admin_success"));
        onLoginSuccess(userInfo);
        navigate("/admin");
      } else if (role === "USER") {
        toast.success(t("auth.google_success"));
        onLoginSuccess(userInfo);
        navigate("/");
      } else {
        toast.error(t("auth.google_invalid_account"), {
          position: "top-right",
          autoClose: 4000,
        });
        try {
          await fetchJson("/api/auth/logout", {
            method: "POST",
          });
        } catch (logoutError) {}
        onClose();
      }
    } catch (error) {
      // Extract error message from response
      let errorMessage = t("auth.google_login_failed");

      // Handle specific backend database error
      if (
        error.response?.data?.accessToken?.includes("pass_word") &&
        error.response?.data?.accessToken?.includes("cannot be null")
      ) {
        errorMessage = t("common.error");
      } else if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (
          error.response.data.accessToken &&
          error.response.data.accessToken.includes("Google login failed")
        ) {
          errorMessage = t("auth.google_backend_failed");
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
    toast.error(t("auth.google_login_failed"), {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const showBlockMessage = (remainingMinutes) => {
    const message = t("auth.block_message", { minutes: remainingMinutes });
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
          {t("auth.login_now")}
        </h2>
        <p className="text-gray-300 mb-6">
          {t("auth.no_account")}{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
            className="text-blue-300"
          >
            {t("auth.register_now")}
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
            placeholder={t("auth.email")}
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
            placeholder={t("auth.password")}
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
                {t("common.loading")}
              </>
            ) : isBlocked ? (
              t("auth.locked")
            ) : (
              t("auth.login_title")
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
              {t("auth.forgot_password")}
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
                {t("auth.forgot_password")}
              </h3>

              <p className="text-gray-300 text-sm mb-4">
                {t("auth.forgot.description")}
              </p>

              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder={t("auth.forgot.email_placeholder")}
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
                    {t("common.cancel")}
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
                        {t("auth.forgot.sending")}
                      </>
                    ) : (
                      t("auth.forgot.send_otp")
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
