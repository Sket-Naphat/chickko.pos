// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { api } from "../lib/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSite, setSelectedSite] = useState(""); // เปลี่ยนชื่อ (เดิม site)
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (!username || !password || !selectedSite) {
        alert("กรุณากรอก username / password และเลือกสาขา");
        return;
      }
      setIsLoading(true);

      // เปลี่ยน: ส่ง site ผ่าน header แทน body
      const response = await api.post(
        "/auth/login",
        { username, password }, // ไม่ส่ง site ใน payload แล้ว
        {
          headers: {
            "X-Site": selectedSite,   // ชื่อ header แนะนำ (ปรับได้)
            // หรือถ้า backend ต้องการชื่ออื่น เช่น:
            // Site: selectedSite,
            // SiteCode: selectedSite,
          }
        }
      );

      const token =
        typeof response.data === "string" ? response.data :
        typeof response.data?.token === "string" ? response.data.token :
        typeof response.data?.accessToken === "string" ? response.data.accessToken :
        null;

      if (!token) {
        console.log("login response:", response.data);
        alert("เข้าสู่ระบบไม่สำเร็จ: ไม่พบ token");
        return;
      }

      const isHttps = window.location.protocol === "https:";
      const cookieOpts = { expires: 1, secure: isHttps, sameSite: "Lax", path: "/" };
      Cookies.set("authToken", token, cookieOpts);

      const userObj = response.data.user || response.data || {};
      const siteFromApi =
        userObj.siteCode ||
        userObj.site_code ||
        userObj.sitecode ||
        (typeof userObj.site === "object" ? (userObj.site.code || userObj.site.siteCode) : userObj.site) ||
        selectedSite;

      const authData = {
        userId: userObj.userId ?? null,
        name: userObj.name ?? "",
        userPermissionId: userObj.userPermistionID ?? null,
        site: siteFromApi,
        issuedAt: Date.now(),
      };
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
        <input
          type="text"
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className="label">Password</label>
        <input
          type="password"
          className="input"
            placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="label">สาขา</label>
        <select
          className="select"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          <option value="">เลือกสาขา</option>
          <option value="HKT">ภูเก็ต</option>
          <option value="BKK">กรุงเทพฯ</option>
        </select>

        <button
          className="btn btn-neutral mt-4"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Login"}
        </button>
        <button
          className="btn btn-link mt-2"
          onClick={() => navigate("/register")}
        >
          สมัครสมาชิก
        </button>
      </fieldset>
    </div>
  );
}

export default Login;
