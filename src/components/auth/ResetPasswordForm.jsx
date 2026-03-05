import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "@toast";
import { ClipLoader } from "react-spinners";
import { fetchJson } from "../../services/api";
import { useTranslation } from "react-i18next";

function ResetPasswordForm({ onClose, userEmail }) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error(t("auth.reset.errors.otp_required"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!newPassword.trim()) {
      toast.error(t("auth.reset.errors.new_password_required"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.reset.errors.password_mismatch"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("auth.reset.errors.password_min"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchJson("/api/auth/reset-password", {
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

      toast.success(t("auth.reset.toasts.success"), {
        position: "top-right",
        autoClose: 4000,
      });

      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("auth.reset.toasts.error");
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
      <div className="bg-orange-950/90 p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        <h3 className="text-lg text-white font-semibold mb-4">
          {t("auth.reset.title")}
        </h3>

        <p className="text-gray-300 text-sm mb-4">
          {t("auth.reset.description", { email: userEmail })}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t("auth.reset.placeholders.otp")}
            maxLength="6"
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            required
          />

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("auth.reset.placeholders.new_password")}
            disabled={isSubmitting}
            className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            required
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.reset.placeholders.confirm_password")}
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
              {t("common.cancel")}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <ClipLoader size={16} color="#000000" className="mr-2" />
                  {t("auth.reset.submitting")}
                </>
              ) : (
                t("auth.reset.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
