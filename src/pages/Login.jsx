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
      // ส่งข้อมูลไปที่ API เพื่อ login
      if (!username || !password) {
        alert("กรุณากรอก username และ password");
        return;
      }
      // คาดว่า API จะรับข้อมูลในรูปแบบนี้
      const response = await api.post("/auth/login", { username, password });
      // หลัง login สำเร็จ
      const token =
        typeof response.data === "string" ? response.data :
          typeof response.data?.token === "string" ? response.data.token :
            typeof response.data?.accessToken === "string" ? response.data.accessToken :
              null;

      if (!token) {
        console.log("login response:", response.data);
        alert("เข้าสู่ระบบไม่สำเร็จ: ไม่พบ token ในผลลัพธ์");
        return;
      }

      // dev = http → secure:false, prod(Vercel)=https → secure:true
      const isHttps = window.location.protocol === "https:";

      Cookies.remove("authToken", { path: "/" });
      Cookies.set("authToken", token, {
        expires: 1,
        secure: isHttps,
        sameSite: "Lax",
        path: "/",
      });

      console.log("token len:", token.length);
      console.log("cookie now:", Cookies.get("authToken"));
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