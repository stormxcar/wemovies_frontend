import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchJson } from "../../services/api";
import { ClipLoader } from "react-spinners";

function RegisterForm({ onClose, onSwitchToLogin }) {
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
      validationErrors.userName = "Tên đăng nhập không được để trống";
    } else if (registerForm.userName.length < 3) {
      validationErrors.userName = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!registerForm.passWord) {
      validationErrors.passWord = "Mật khẩu không được để trống";
    } else if (!passwordRegex.test(registerForm.passWord)) {
      validationErrors.passWord =
        "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt, tối thiểu 8 ký tự";
    }

    // Validate full name
    if (!registerForm.fullName.trim()) {
      validationErrors.fullName = "Họ tên không được để trống";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
    if (!registerForm.email) {
      validationErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(registerForm.email)) {
      validationErrors.email =
        "Chỉ chấp nhận email từ gmail.com, yahoo.com hoặc outlook.com";
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!registerForm.phoneNumber) {
      validationErrors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(registerForm.phoneNumber)) {
      validationErrors.phoneNumber = "Số điện thoại phải có đúng 10 chữ số";
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
    toast.info(
      "⚠️ Lưu ý: Server miễn phí có thể sleep và cần 1-2 phút để khởi động. Hệ thống sẽ tự động thử lại nếu cần!",
      {
        autoClose: 5000,
        position: "top-center",
      }
    );

    setIsSubmitting(true);
    try {
      toast.info(
        "Đang kết nối đến server... Hệ thống sẽ tự động retry nếu timeout!",
        { autoClose: false }
      );
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
          : response?.message || "OTP đã được gửi đến email của bạn";
      toast.dismiss(); // Dismiss loading toast
      toast.success(message);
      setVerifyEmail(registerForm.email);
      setShowVerifyOtp(true);
    } catch (error) {
      toast.dismiss(); // Dismiss loading toast
      toast.error(error.message || "Lỗi khi gửi OTP");
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
          verifyEmail
        )}&otp=${encodeURIComponent(otp)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        }
      );
      toast.success("Xác thực OTP thành công. Vui lòng đăng nhập.");
      setShowVerifyOtp(false);
      onSwitchToLogin(); // Chuyển sang form login
    } catch (error) {
      toast.error(error.message || "OTP không hợp lệ");
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
            Xác thực OTP
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
              placeholder="Nhập mã OTP"
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
                  Đang xác thực...
                </>
              ) : (
                "Xác thực"
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
          Tạo tài khoản mới
        </h2>
        <p className="text-gray-300 mb-6">
          Nếu bạn đã có tài khoản,{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
            className="text-blue-300"
          >
            đăng nhập
          </button>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="userName"
            value={registerForm.userName}
            onChange={handleChange}
            placeholder="Tên hiển thị"
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
            placeholder="Tên đầy đủ"
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
            placeholder="Số điện thoại"
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
            placeholder="Mật khẩu"
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
                Đang xử lý...
              </>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
