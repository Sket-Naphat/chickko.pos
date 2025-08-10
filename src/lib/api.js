import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";


/** 
 * เลือก 1 อัน โดย "เอา // ออก" ที่บรรทัดนั้น
 */
//const FORCE_BASE_URL = "http://localhost:5036/api";            // ← ใช้ API บนเครื่อง
// const FORCE_BASE_URL = "https://chickkoapi.up.railway.app/api"; // ← ใช้ Railway
 const FORCE_BASE_URL = null;                                       // ← ค่าเริ่มต้น: ใช้ ENV (Vercel/.env)

/** อย่าแก้ตรงนี้ */
const baseURL = FORCE_BASE_URL ?? import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

// ดักก่อนส่งทุก request: แนบ token + เช็คหมดอายุ
api.interceptors.request.use((config) => {
  const token = Cookies.get("authToken");           // ← ใช้ชื่อ authToken
  if (token) {
    try {
      const { exp } = jwtDecode(token);
      if (exp * 1000 < Date.now()) {
        Cookies.remove("authToken", { path: "/" });
        window.location.href = "/login";
        throw new axios.Cancel("Token expired");
      }
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      Cookies.remove("authToken", { path: "/" });
    }
  }
  return config;
});

// ดักหลังรับ response: ถ้า 401 ให้ลบ token แล้วเด้งไป login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      Cookies.remove("authToken", { path: "/" });
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);