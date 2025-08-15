// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { api } from "../lib/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (!username || !password) {
        alert("กรุณากรอก username และ password");
        return;
      }
      setIsLoading(true);
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
      const cookieOpts = { expires: 1, secure: isHttps, sameSite: "Lax", path: "/" };

      Cookies.remove("authToken", { path: "/" });
      Cookies.set("authToken", token, cookieOpts);

      const { userId = null, name = "", userPermissionId = null } = response.data || {};
      const authData = {
        userId,
        name,
        userPermissionId,
        issuedAt: Date.now(), // เผื่อไว้ใช้เช็กอายุ/ต่ออายุ
      };
      Cookies.remove("authData", { path: "/" });
      Cookies.set("authData", JSON.stringify(authData), cookieOpts);

      navigate("/home");
    } catch (error) {
      alert("เข้าสู่ระบบไม่สำเร็จ: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
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

        <button className="btn btn-neutral mt-4" onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </button>

      </fieldset>
    </div>
  );
}

export default Login;
