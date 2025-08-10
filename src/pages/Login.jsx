// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import Cookies from "js-cookie";
import { api } from "../lib/api"; // นำเข้า api ที่สร้างไว้

function Login() {
  const [username, setUsername] = useState(""); // เก็บ username จาก input
  const [password, setPassword] = useState(""); // เก็บ password จาก input
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {

      // const APIUrl = "http://localhost:5036/api/auth/login" //local test
      // // const APIUrl = "https://chickkoapi.up.railway.app/api/auth/login"// prd
      // const response = await axios.post(APIUrl, {
      //   username,
      //   password,
      // });

      const response = await api.post("/auth/login", { username, password });

      // หลัง login สำเร็จ
      const token = response.data;

      Cookies.set("authToken", token, {
        expires: 1,          // 1 วัน (ปรับได้)
        secure: true,        // โปรดักชันต้องเป็น https
        sameSite: "strict",
        path: "/",           // ให้ทุกหน้าอ่านได้
      });

      // ✅ ถ้า login สำเร็จ ให้ redirect ไปหน้า dashboard
      navigate("/home");
    } catch (error) {
      alert("เข้าสู่ระบบไม่สำเร็จ: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 gap-4">
      <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <input
        type="text"
        value={username}
        placeholder="Username"
        className="p-2 border rounded w-64"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        value={password}
        placeholder="Password"
        className="p-2 border rounded w-64"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        เข้าสู่ระบบ
      </button>
    </div>
  );
}

export default Login;