import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const RegisterForm = ({ setStep, setEmail }) => {
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
      await axios.post("http://localhost:8080/api/auth/request-otp", formData);
      toast.success("OTP đã được gửi đến email của bạn");
      setEmail(formData.email);
      setStep("verify");
    } catch (error) {
      toast.error(error.response?.data || "Lỗi khi gửi OTP");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Đăng ký</h2>
      <input
        type="text"
        name="userName"
        value={formData.userName}
        onChange={handleChange}
        placeholder="Tên người dùng"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        name="passWord"
        value={formData.passWord}
        onChange={handleChange}
        placeholder="Mật khẩu"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Họ và tên"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder="Số điện thoại"
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Gửi OTP
      </button>
    </form>
  );
};

const VerifyOtpForm = ({ email, setStep }) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:8080/api/auth/verify-otp?email=${encodeURIComponent(
          email
        )}&otp=${encodeURIComponent(otp)}`
      );

      toast.success("Xác thực OTP thành công. Vui lòng đăng nhập.");
      setStep("login");
    } catch (error) {
      toast.error(error.response?.data || "OTP không hợp lệ");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Xác thực OTP</h2>
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
        placeholder="Nhập mã OTP"
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Xác thực
      </button>
    </form>
  );
};

const LoginForm = () => {
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
      const loginResponse = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email: formDataLogin.email,
          passWord: formDataLogin.passWord,
        },
        { withCredentials: true }
      );

      // Check cookies in browser storage
      const cookies = document.cookie;
      console.log("Browser Cookies after Login:", cookies);

      // Check user role
      const verifyResponse = await axios.get(
        "http://localhost:8080/api/auth/verifyUser",
        {
          withCredentials: true,
        }
      );

      const role =
        verifyResponse.data.role?.roleName || verifyResponse.data.role;
      if (role === "ADMIN") {
        toast.success("Đăng nhập Admin thành công!");
        navigate("/admin");
      } else {
        toast.error("Chỉ admin mới có quyền truy cập!");
        await axios.post(
          "http://localhost:8080/api/auth/logout",
          {},
          { withCredentials: true }
        );
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      console.log("Response Headers:", error.response?.headers);
      toast.error(error.response?.data || "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Đăng nhập</h2>
      <input
        type="email"
        name="email"
        value={formDataLogin.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full p-2 border rounded"
        required
        autoComplete="email" // Added for email field
      />
      <input
        type="password"
        name="passWord"
        value={formDataLogin.passWord}
        onChange={handleChange}
        placeholder="Mật khẩu"
        className="w-full p-2 border rounded"
        // required
        autoComplete="current-password" // Added to fix warning
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Đăng nhập
      </button>
    </form>
  );
};

const AuthPage = () => {
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
              className="text-blue-500 hover:underline"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          )}
          {step === "login" && (
            <button
              onClick={() => setStep("register")}
              className="text-blue-500 hover:underline"
            >
              Chưa có tài khoản? Đăng ký
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
