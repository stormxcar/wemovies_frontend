import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "@toast";
import { fetchJson } from "../../services/api";
import { ClipLoader } from "react-spinners";
import { useTranslation } from "react-i18next";

function RegisterForm({ onClose, onSwitchToLogin }) {
  const { t } = useTranslation();
  const [registerForm, setRegisterForm] = useState({
    userName: "",
    passWord: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    roleName: "USER",
  });
  const [errors, setErrors] = useState({});
  const [showVerifyOtp, setShowVerifyOtp] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({ ...registerForm, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const validationErrors = {};

    // Validate username
    if (!registerForm.userName.trim()) {
      validationErrors.userName = t("register.errors.username_required");
    } else if (registerForm.userName.length < 3) {
      validationErrors.userName = t("register.errors.username_min");
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!registerForm.passWord) {
      validationErrors.passWord = t("register.errors.password_required");
    } else if (!passwordRegex.test(registerForm.passWord)) {
      validationErrors.passWord = t("register.errors.password_invalid");
    }

    // Validate full name
    if (!registerForm.fullName.trim()) {
      validationErrors.fullName = t("register.errors.fullname_required");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
    if (!registerForm.email) {
      validationErrors.email = t("register.errors.email_required");
    } else if (!emailRegex.test(registerForm.email)) {
      validationErrors.email = t("register.errors.email_domain");
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!registerForm.phoneNumber) {
      validationErrors.phoneNumber = t("register.errors.phone_required");
    } else if (!phoneRegex.test(registerForm.phoneNumber)) {
      validationErrors.phoneNumber = t("register.errors.phone_invalid");
    }

    setErrors(validationErrors);
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Show warning about potential delay
    toast.info(t("register.toasts.server_sleep_warning"), {
      autoClose: 5000,
      position: "top-center",
    });

    setIsSubmitting(true);
    try {
      toast.info(t("register.toasts.connecting"), { autoClose: false });
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(registerForm),
        credentials: "include", // Add this for cookie support
      };
      const response = await fetchJson("/api/auth/request-otp", options);

      const message =
        typeof response === "string"
          ? response
          : response?.message || t("register.toasts.otp_sent");
      toast.dismiss(); // Dismiss loading toast
      toast.success(message);
      setVerifyEmail(registerForm.email);
      setShowVerifyOtp(true);
    } catch (error) {
      toast.dismiss(); // Dismiss loading toast
      toast.error(error.message || t("register.toasts.send_otp_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác thực OTP nội bộ
  const handleVerifyOtp = async (otp) => {
    if (isVerifyingOtp) return; // Prevent multiple submissions

    setIsVerifyingOtp(true);
    try {
      await fetchJson(
        `/api/auth/verify-otp?email=${encodeURIComponent(
          verifyEmail,
        )}&otp=${encodeURIComponent(otp)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        },
      );
      toast.success(t("register.toasts.otp_verify_success"));
      setShowVerifyOtp(false);
      onSwitchToLogin(); // Chuyển sang form login
    } catch (error) {
      toast.error(error.message || t("register.toasts.otp_invalid"));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Form xác thực OTP nội bộ
  const OtpForm = () => {
    const [otp, setOtp] = useState("");
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-orange-950/70 p-10 rounded-lg shadow-xl w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-white hover:text-gray-300"
            onClick={onClose}
          >
            <FaTimes />
          </button>
          <h2 className="text-xl text-white font-semibold mb-4">
            {t("register.otp.title")}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp(otp);
            }}
          >
            <input
              type="email"
              value={verifyEmail}
              disabled
              className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md"
            />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t("register.otp.placeholder")}
              disabled={isVerifyingOtp}
              className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifyingOtp ? (
                <>
                  <ClipLoader size={20} color="#000000" className="mr-2" />
                  {t("register.otp.verifying")}
                </>
              ) : (
                t("register.otp.submit")
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Nếu đang xác thực OTP thì chỉ render form OTP
  if (showVerifyOtp) return <OtpForm />;

  // Form đăng ký mặc định
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-orange-950/70 p-10 rounded-lg shadow-xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl text-white font-semibold mb-4">
          {t("register.title")}
        </h2>
        <p className="text-gray-300 mb-6">
          {t("register.have_account")}{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
            className="text-orange-300"
          >
            {t("register.login_link")}
          </button>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="userName"
            value={registerForm.userName}
            onChange={handleChange}
            placeholder={t("register.placeholders.username")}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {errors.userName && (
            <p className="text-red-500 text-sm mb-2 -mt-2">{errors.userName}</p>
          )}
          <input
            type="text"
            name="fullName"
            value={registerForm.fullName}
            onChange={handleChange}
            placeholder={t("register.placeholders.fullname")}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mb-2 -mt-2">{errors.fullName}</p>
          )}
          <input
            type="email"
            name="email"
            value={registerForm.email}
            onChange={handleChange}
            placeholder="Email"
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-2 -mt-2">{errors.email}</p>
          )}
          <input
            type="text"
            name="phoneNumber"
            value={registerForm.phoneNumber}
            onChange={handleChange}
            placeholder={t("register.placeholders.phone")}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mb-2 -mt-2">
              {errors.phoneNumber}
            </p>
          )}
          <input
            type="password"
            name="passWord"
            value={registerForm.passWord}
            onChange={handleChange}
            placeholder={t("register.placeholders.password")}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {errors.passWord && (
            <p className="text-red-500 text-sm mb-2 -mt-2">{errors.passWord}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <ClipLoader size={20} color="#000000" className="mr-2" />
                {t("register.submitting")}
              </>
            ) : (
              t("register.submit")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
