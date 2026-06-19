import axios from "axios";                       // HTTP client หลัก
import Cookies from "js-cookie";                 // จัดการคุกกี้
import { jwtDecode } from "jwt-decode";          // ถอดรหัส JWT

/** เลือกปลายทางได้จาก 3 บรรทัดนี้ (วิธี B)
 *   - เอา // ออกอันที่ต้องการ แล้วคอมเมนต์อีกสองอัน
 */
// const FORCE_BASE_URL = "http://localhost:5036/api";            // ใช้ API local
// const FORCE_BASE_URL = "https://chickkoapi.up.railway.app/api"; // ใช้ Railway (PRD)
 const FORCE_BASE_URL = null;                                       // ค่าเริ่มต้น → ใช้ ENV

/** baseURL สุดท้ายที่จะถูกใช้: ถ้า FORCE_BASE_URL มีค่า จะ override ENV ทันที */
const baseURL = FORCE_BASE_URL ?? import.meta.env.VITE_API_URL;

/** === ช่องทางสื่อสารกับ UI แบบเบา ๆ (ไม่ต้องพึ่ง React ในไฟล์นี้) === */
let loadingListener = null;                                        // ฟังก์ชัน setLoading จาก UI
let errorListener = null;                                          // ฟังก์ชัน showError จาก UI
let pending = 0;                                                   // นับจำนวน request ที่กำลังวิ่ง

export function bindLoadingListener(fn) { loadingListener = fn; }  // ให้ App มาผูกตัว setter
export function bindErrorListener(fn) { errorListener = fn; }      // ให้ App มาผูกตัวแสดง error
function notifyLoading() { if (loadingListener) loadingListener(pending > 0); } // แจ้ง UI ว่ากำลังโหลด?

/** ฟังก์ชัน logout กลาง ใช้ซ้ำได้ทุกที่ */
export function logout() {
  Cookies.remove("authToken", { path: "/" });                      // ลบคุกกี้
  Cookies.remove("authData", { path: "/" });                       // ลบคุกกี้
  window.location.href = "/login";                                 // ส่งไปหน้า login
}

/** สร้าง instance เดียวไว้ใช้ทั้งแอป */
export const api = axios.create({
  baseURL,                                                         // ชี้ปลายทางตามที่กำหนด
  timeout: 20000,                                                  // กันค้าง
});

console.log("[API baseURL]", baseURL);                             // debug: ดูปลายทางปัจจุบัน

/** ========== Interceptors ========== */

/** ก่อนส่งทุก request */
api.interceptors.request.use((config) => {
  pending++;                                                       // เริ่มมีงาน → +1
  notifyLoading();                                                 // แจ้ง UI ให้โชว์ loading
  const token = Cookies.get("authToken");                          // หยิบ token จากคุกกี้
  if (token) {
    try {
      const { exp } = jwtDecode(token);                            // ถอด exp
      if (exp * 1000 < Date.now()) {                               // ถ้าหมดอายุ
        logout();                                                  // ล้างและเด้งออก
        throw new axios.Cancel("Token expired");                   // ยกเลิกคำขอนี้
      }
      config.headers.Authorization = `Bearer ${token}`;            // แนบ header ทุกครั้ง
    } catch {
      Cookies.remove("authToken", { path: "/" });                  // ถ้าถอดไม่ได้ → ล้างทิ้ง
    }
  }
  return config;                                                   // ส่ง config ไปต่อ
});

/** หลังได้รับ response (กรณีสำเร็จ) */
api.interceptors.response.use(
  (res) => {
    pending = Math.max(0, pending - 1);                            // งานเสร็จ → -1
    notifyLoading();                                               // แจ้ง UI
    return res;                                                    // ส่งต่อผลเดิม (จะ .data ภายหลังก็ได้)
  },
  (err) => {
    pending = Math.max(0, pending - 1);                            // งานเสร็จ/พัง → -1
    notifyLoading();                                               // แจ้ง UI

    const status = err?.response?.status;                          // HTTP status ที่พัง
    if (status === 401) {                                          // ไม่ผ่านสิทธิ์
      logout();                                                    // ออกเลย
      return Promise.reject(err);
    }

    const msg =
      err?.response?.data?.message || err.message || "Request failed"; // หา message ที่อ่านออก
    if (errorListener) errorListener(msg);                         // ส่งข้อความให้ UI แสดง
    return Promise.reject(err);                                    // โยนต่อให้หน้าที่เรียกจัดการเพิ่มได้
  }
);