// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { api } from "../lib/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (!username || !password) {
        alert("กรุณากรอก username และ password");
        return;
      }
      const response = await api.post("/auth/login", { username, password });
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 gap-4">
      <div className="w-full max-w-sm p-8 bg-base-100 rounded-lg shadow-lg flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
        <input
          type="text"
          value={username}
          placeholder="Username"
          className="input input-bordered w-full"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          className="input input-bordered w-full"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="btn btn-primary w-full"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

export default Login;
