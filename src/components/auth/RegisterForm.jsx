import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchJson } from "../../services/api";

function RegisterForm({ onClose, onSwitchToLogin }) {
  const [registerForm, setRegisterForm] = useState({
    userName: "",
    passWord: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    roleName: "USER",
  });
  const [showVerifyOtp, setShowVerifyOtp] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");

  const handleChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
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
        body: JSON.stringify(registerForm),
        credentials: "include", // Add this for cookie support
      };
      console.log("Request Payload:", registerForm);
      const response = await fetchJson("/api/auth/request-otp", options);

      const message =
        typeof response === "string"
          ? response
          : response?.message || "OTP đã được gửi đến email của bạn";
      console.log("Response Message:", message);
      toast.success(message);
      setVerifyEmail(registerForm.email);
      setShowVerifyOtp(true);
      //   if (
      //     (Array.isArray(response) && response[0]?.includes("OTP")) ||
      //     response?.message?.includes("OTP") ||
      //     (typeof response === "string" && response.includes("OTP"))
      //   ) {
      //     toast.success("OTP đã được gửi đến email của bạn");
      //     setVerifyEmail(registerForm.email);
      //     setShowVerifyOtp(true);
      //   } else {
      //     toast.error(response || "Có lỗi xảy ra khi gửi OTP");
      //   }
    } catch (error) {
      toast.error(error.message || "Lỗi khi gửi OTP");
    }
  };

  // Xác thực OTP nội bộ
  const handleVerifyOtp = async (otp) => {
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
              className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
            >
              Xác thực
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
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="text"
            name="fullName"
            value={registerForm.fullName}
            onChange={handleChange}
            placeholder="Tên đầy đủ"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="email"
            name="email"
            value={registerForm.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="text"
            name="phoneNumber"
            value={registerForm.phoneNumber}
            onChange={handleChange}
            placeholder="Số điện thoại"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="password"
            name="passWord"
            value={registerForm.passWord}
            onChange={handleChange}
            placeholder="Mật khẩu"
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
          >
            Đăng ký
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
