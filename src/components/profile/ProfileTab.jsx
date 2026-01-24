import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchJson } from "../../services/api";
import api from "../../services/api";

// Regex patterns for validation
const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
const vnDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const ProfileTab = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Profile editing state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    gender: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/auth/profile");
      const data = response.data;

      // Format date for display (VN format: dd/MM/yyyy)
      let formattedBirthDate = "";
      if (data.dateOfBirth) {
        const date = new Date(data.dateOfBirth);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        formattedBirthDate = `${day}/${month}/${year}`;
      }

      setProfileData({
        name: data.fullName || "",
        email: data.email || "",
        phone: data.phoneNumber || "",
        birthDate: formattedBirthDate,
        address: data.address || "",
        gender: data.gender || "",
        avatar: data.avatar || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Không thể tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateProfileField("name", profileData.name);
    const isPhoneValid = validateProfileField("phone", profileData.phone);
    const isBirthDateValid = validateProfileField(
      "birthDate",
      profileData.birthDate
    );
    const isAddressValid = validateProfileField("address", profileData.address);

    if (!isNameValid || !isPhoneValid || !isBirthDateValid || !isAddressValid) {
      toast.error("Vui lòng sửa các lỗi trong form trước khi lưu");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse VN date format (dd/MM/yyyy) to ISO format for backend
      let formattedDateOfBirth = null;
      if (profileData.birthDate && profileData.birthDate.trim()) {
        const vnDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = profileData.birthDate.trim().match(vnDateRegex);

        if (match) {
          const [, day, month, year] = match;
          // Create date in local timezone to avoid timezone issues
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          formattedDateOfBirth = date.toISOString().split("T")[0]; // yyyy-MM-dd format
        } else {
          throw new Error(
            "Ngày sinh phải có format dd/MM/yyyy (ví dụ: 12/12/2004)"
          );
        }
      }

      const updateData = {
        fullName: profileData.name,
        phoneNumber: profileData.phone,
        dateOfBirth: formattedDateOfBirth,
        address: profileData.address,
        gender: profileData.gender,
      };

      await api.put("/api/auth/profile", updateData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
      setProfileErrors({}); // Clear all errors
      // Reload profile data
      loadProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate all password fields
    const isCurrentValid = validatePasswordField(
      "currentPassword",
      passwordData.currentPassword
    );
    const isNewValid = validatePasswordField(
      "newPassword",
      passwordData.newPassword
    );
    const isConfirmValid = validatePasswordField(
      "confirmPassword",
      passwordData.confirmPassword
    );

    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
      toast.error("Vui lòng sửa các lỗi trong form trước khi đổi mật khẩu");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/change-password", {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({}); // Clear all errors
      setShowChangePassword(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File ảnh phải nhỏ hơn 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      setSelectedAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      toast.error("Vui lòng chọn ảnh trước");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedAvatarFile);

      const response = await api.post("/api/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Upload avatar thành công!");
      setShowAvatarUpload(false);
      setSelectedAvatarFile(null);
      setAvatarPreview("");

      // Reload profile to get new avatar URL
      loadProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Có lỗi xảy ra khi upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Validation functions
  const validateProfileField = (field, value) => {
    const errors = { ...profileErrors };

    switch (field) {
      case "name":
        if (!value.trim()) {
          errors.name = "Họ và tên không được để trống";
        } else if (value.trim().length < 2) {
          errors.name = "Họ và tên phải có ít nhất 2 ký tự";
        } else if (value.trim().length > 100) {
          errors.name = "Họ và tên không được dài quá 100 ký tự";
        } else {
          delete errors.name;
        }
        break;

      case "phone":
        if (value && !phoneRegex.test(value.replace(/\s/g, ""))) {
          errors.phone = "Số điện thoại không hợp lệ (VD: 0123456789)";
        } else {
          delete errors.phone;
        }
        break;

      case "birthDate":
        if (value) {
          if (!vnDateRegex.test(value.trim())) {
            errors.birthDate = "Ngày sinh phải có format dd/MM/yyyy";
          } else {
            const [, day, month, year] = value.trim().match(vnDateRegex);
            const date = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
            const now = new Date();
            const minDate = new Date(
              now.getFullYear() - 100,
              now.getMonth(),
              now.getDate()
            );
            const maxDate = new Date(
              now.getFullYear() - 13,
              now.getMonth(),
              now.getDate()
            );

            if (date > maxDate) {
              errors.birthDate = "Bạn phải từ đủ 13 tuổi trở lên";
            } else if (date < minDate) {
              errors.birthDate = "Ngày sinh không hợp lệ";
            } else {
              delete errors.birthDate;
            }
          }
        } else {
          delete errors.birthDate;
        }
        break;

      case "address":
        if (value && value.length > 255) {
          errors.address = "Địa chỉ không được dài quá 255 ký tự";
        } else {
          delete errors.address;
        }
        break;
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordField = (field, value) => {
    const errors = { ...passwordErrors };

    switch (field) {
      case "currentPassword":
        if (!value) {
          errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
        } else {
          delete errors.currentPassword;
        }
        break;

      case "newPassword":
        if (!value) {
          errors.newPassword = "Vui lòng nhập mật khẩu mới";
        } else if (value.length < 6) {
          errors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
        } else if (!passwordRegex.test(value)) {
          errors.newPassword =
            "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số";
        } else {
          delete errors.newPassword;
        }
        break;

      case "confirmPassword":
        if (!value) {
          errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
        } else if (value !== passwordData.newPassword) {
          errors.confirmPassword = "Mật khẩu xác nhận không khớp";
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Avatar & Basic Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold ${
                profileData.avatar ? "hidden" : ""
              }`}
            >
              {profileData.name
                ? profileData.name.charAt(0).toUpperCase()
                : "?"}
            </div>
            <button
              onClick={() => setShowAvatarUpload(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              title="Thay đổi avatar"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {profileData.name || "N/A"}
            </h2>
            <p className="text-gray-400">{profileData.email || "N/A"}</p>
            <p className="text-gray-500 text-sm mt-1">Thành viên</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Hủy
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </>
              )}
            </button>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      {/* Profile Information Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <User className="mr-2 h-5 w-5" />
          Thông tin cá nhân
        </h3>

        <form onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => {
                    setProfileData({ ...profileData, name: e.target.value });
                    validateProfileField("name", e.target.value);
                  }}
                  disabled={isSubmitting || !isEditing}
                  className={`pl-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profileErrors.name ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {profileErrors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileErrors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Email - Read only */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={profileData.email}
                  disabled={true}
                  className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email không thể thay đổi
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => {
                    setProfileData({ ...profileData, phone: e.target.value });
                    validateProfileField("phone", e.target.value);
                  }}
                  disabled={isSubmitting || !isEditing}
                  className={`pl-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profileErrors.phone ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Nhập số điện thoại"
                />
                {profileErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileErrors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Giới tính
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={profileData.gender}
                  onChange={(e) =>
                    setProfileData({ ...profileData, gender: e.target.value })
                  }
                  disabled={isSubmitting || !isEditing}
                  className="pl-10 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ngày sinh
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profileData.birthDate}
                  onChange={(e) => {
                    setProfileData({
                      ...profileData,
                      birthDate: e.target.value,
                    });
                    validateProfileField("birthDate", e.target.value);
                  }}
                  disabled={isSubmitting || !isEditing}
                  placeholder="dd/MM/yyyy (ví dụ: 12/12/2004)"
                  className={`pl-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profileErrors.birthDate
                      ? "border-red-500"
                      : "border-gray-600"
                  }`}
                />
                {profileErrors.birthDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileErrors.birthDate}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Địa chỉ
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => {
                    setProfileData({ ...profileData, address: e.target.value });
                    validateProfileField("address", e.target.value);
                  }}
                  disabled={isSubmitting || !isEditing}
                  className={`pl-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                    profileErrors.address ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Nhập địa chỉ"
                />
                {profileErrors.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {profileErrors.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password Form */}
      {showChangePassword && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Đổi mật khẩu
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      });
                      validatePasswordField("currentPassword", e.target.value);
                    }}
                    disabled={isSubmitting}
                    className={`pl-10 pr-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      passwordErrors.currentPassword
                        ? "border-red-500"
                        : "border-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      });
                      validatePasswordField("newPassword", e.target.value);
                      // Re-validate confirm password when new password changes
                      if (passwordData.confirmPassword) {
                        validatePasswordField(
                          "confirmPassword",
                          passwordData.confirmPassword
                        );
                      }
                    }}
                    disabled={isSubmitting}
                    className={`pl-10 pr-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      passwordErrors.newPassword
                        ? "border-red-500"
                        : "border-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      });
                      validatePasswordField("confirmPassword", e.target.value);
                    }}
                    onPaste={(e) => e.preventDefault()}
                    disabled={isSubmitting}
                    className={`pl-10 pr-10 w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      passwordErrors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordErrors({}); // Clear errors when closing
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || Object.keys(passwordErrors).length > 0
                }
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang đổi mật khẩu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4">Thống kê</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">127</div>
            <div className="text-gray-400 text-sm">Phim đã xem</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">15</div>
            <div className="text-gray-400 text-sm">Yêu thích</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">8</div>
            <div className="text-gray-400 text-sm">Đang xem</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">245h</div>
            <div className="text-gray-400 text-sm">Thời gian xem</div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Thay đổi avatar
              </span>
              <button
                onClick={() => {
                  setShowAvatarUpload(false);
                  setSelectedAvatarFile(null);
                  setAvatarPreview("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </h3>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chọn ảnh mới
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dung lượng tối đa: 5MB. Định dạng: JPG, PNG, GIF
                </p>
              </div>

              {/* Preview */}
              {avatarPreview && (
                <div className="flex justify-center">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-600"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAvatarUpload(false);
                    setSelectedAvatarFile(null);
                    setAvatarPreview("");
                  }}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={uploadingAvatar}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadAvatar}
                  disabled={!selectedAvatarFile || uploadingAvatar}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
