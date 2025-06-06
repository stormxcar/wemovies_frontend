import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchJson } from "../../services/api";

function VerifyOtpForm({ email, onClose, onVerifySuccess }) {
    console.log('====================================');
    console.log("verify otp form email:", email);
    console.log('====================================');
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchJson(
        `/api/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
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
      onVerifySuccess();
    } catch (error) {
      toast.error(error.message || "OTP không hợp lệ");
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
        <h2 className="text-xl text-white font-semibold mb-4">Xác thực OTP</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
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
}

export default VerifyOtpForm;