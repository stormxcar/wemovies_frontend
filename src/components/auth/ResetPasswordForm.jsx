import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { fetchJson } from "../../services/api";

function ResetPasswordForm({ onClose, userEmail }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã OTP", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!newPassword.trim()) {
      toast.error("Vui lòng nhập mật khẩu mới", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchJson("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });

      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.", {
        position: "top-right",
        autoClose: 4000,
      });

      onClose();
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]">
      <div className="bg-blue-950/90 p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        <h3 className="text-lg text-white font-semibold mb-4">
          Đặt lại mật khẩu
        </h3>

        <p className="text-gray-300 text-sm mb-4">
          Nhập mã OTP đã gửi về email{" "}
          <span className="text-yellow-400">{userEmail}</span> và mật khẩu mới
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã OTP"
            maxLength="6"
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            required
          />

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            required
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-6 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            required
          />

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <ClipLoader size={16} color="#000000" className="mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
