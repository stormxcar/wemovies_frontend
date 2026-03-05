import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@toast";
import { useTranslation } from "react-i18next";
import { fetchJson } from "../services/api";

const RegisterForm = ({ setStep, setEmail }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    userName: "",
    passWord: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    roleName: "USER",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // Add this for cookie support
      };
      const response = await fetchJson("/api/auth/request-otp", options);
      // Handle both JSON and text responses
      const message =
        typeof response === "string"
          ? response
          : response?.message || t("authPage.toasts.otp_sent");
      toast.success(message);
      setEmail(formData.email);
      setStep("verify");
    } catch (error) {
      toast.error(error.message || t("authPage.toasts.otp_error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{t("auth.register_title")}</h2>
      <input
        type="text"
        name="userName"
        value={formData.userName}
        onChange={handleChange}
        placeholder={t("authPage.placeholders.username")}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        name="passWord"
        value={formData.passWord}
        onChange={handleChange}
        placeholder={t("auth.password")}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder={t("authPage.placeholders.full_name")}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder={t("auth.email")}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder={t("authPage.placeholders.phone")}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        {t("auth.forgot.send_otp")}
      </button>
    </form>
  );
};

const VerifyOtpForm = ({ email, setStep }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchJson(
        `/api/auth/verify-otp?email=${encodeURIComponent(
          email,
        )}&otp=${encodeURIComponent(otp)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include", // Add this for cookie support
        },
      );

      toast.success(t("authPage.toasts.verify_success"));
      setStep("login");
    } catch (error) {
      toast.error(error.response?.data || t("authPage.toasts.otp_invalid"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{t("authPage.verify_title")}</h2>
      <input
        type="email"
        value={email}
        disabled
        className="w-full p-2 border rounded bg-gray-100"
      />
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder={t("authPage.placeholders.otp")}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        {t("authPage.verify_button")}
      </button>
    </form>
  );
};

const LoginForm = () => {
  const { t } = useTranslation();
  const [formDataLogin, setFormDataLogin] = useState({
    email: "",
    passWord: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormDataLogin({ ...formDataLogin, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: formDataLogin.email,
          passWord: formDataLogin.passWord,
        }),
        credentials: "include",
      };

      const loginResponse = await fetchJson("/api/auth/login", options);
      if (!loginResponse) {
        throw new Error(t("authPage.toasts.login_no_response"));
      }

      // Lưu tokens vào localStorage
      if (loginResponse.accessToken) {
        localStorage.setItem("jwtToken", loginResponse.accessToken);
      }
      if (loginResponse.refreshToken) {
        localStorage.setItem("refreshToken", loginResponse.refreshToken);
      }

      // Lưu user data vào localStorage luôn để tránh verify lại
      if (loginResponse.user) {
        localStorage.setItem("user", JSON.stringify(loginResponse.user));
      }

      // Kiểm tra role từ login response
      const role = loginResponse.user?.role?.roleName;
      if (role === "ADMIN") {
        toast.success(t("auth.google_admin_success"));
        navigate("/admin");
      } else {
        toast.error(t("route.admin_only"));

        // Clear tokens vì không phải admin
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("refreshToken");
      }
    } catch (error) {
      toast.error(error.message || t("auth.login_failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{t("auth.login_title")}</h2>
      <input
        type="email"
        name="email"
        value={formDataLogin.email}
        onChange={handleChange}
        placeholder={t("auth.email")}
        className="w-full p-2 border rounded"
        required
        autoComplete="email" // Added for email field
      />
      <input
        type="password"
        name="passWord"
        value={formDataLogin.passWord}
        onChange={handleChange}
        placeholder={t("auth.password")}
        className="w-full p-2 border rounded"
        // required
        autoComplete="current-password" // Added to fix warning
      />
      <button
        type="submit"
        className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        {t("auth.login_title")}
      </button>
    </form>
  );
};

const AuthPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState("login"); // register, verify, login
  const [email, setEmail] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {step === "register" && (
          <RegisterForm setStep={setStep} setEmail={setEmail} />
        )}
        {step === "verify" && <VerifyOtpForm email={email} setStep={setStep} />}
        {step === "login" && <LoginForm />}
        <div className="mt-4 text-center">
          {step !== "login" && (
            <button
              onClick={() => setStep("login")}
              className="text-orange-400 hover:text-orange-300 hover:underline"
            >
              {t("auth.have_account")} {t("auth.login_now")}
            </button>
          )}
          {step === "login" && (
            <button
              onClick={() => setStep("register")}
              className="text-orange-400 hover:text-orange-300 hover:underline"
            >
              {t("auth.no_account")} {t("auth.register_now")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
