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


      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Login</legend>

        <label className="label">Email</label>
        <input type="text" className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

        <label className="label">Password</label>
        <input type="password" className="input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="btn btn-neutral mt-4" onClick={handleLogin}>Login</button>
      </fieldset>
    </div>
  );
}

export default Login;
