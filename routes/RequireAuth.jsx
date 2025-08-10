import { Navigate, Outlet, useLocation } from "react-router-dom"; // ใช้เปลี่ยนเส้นทาง + ตัวแทน child routes
import Cookies from "js-cookie";                                   // ใช้อ่านคุกกี้
import { jwtDecode } from "jwt-decode";                            // ใช้ถอด exp จาก JWT

export default function RequireAuth() {
  const loc = useLocation();                                       // เก็บตำแหน่งปัจจุบันไว้ (ไว้ redirect กลับ)
  const token = Cookies.get("authToken");                              // อ่าน token ที่เราตั้งชื่อไว้

  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />; // ไม่มี token → ส่งไป /login

  try {
    const { exp } = jwtDecode(token);                                  // ถอด exp (วินาทีตั้งแต่ epoch)
    if (exp * 1000 < Date.now()) {                                 // ถ้าเวลาหมดอายุ < ตอนนี้
      Cookies.remove("authToken", { path: "/" });                  // ลบคุกกี้ออก
      return <Navigate to="/login" replace state={{ from: loc }} />; // ส่งไป /login
    }
  } catch {                                                        // ถ้าถอดไม่ได้ถือว่า token ไม่ถูกต้อง
    Cookies.remove("authToken", { path: "/" });
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  return <Outlet />;                                               // ผ่านการตรวจ → แสดงหน้าลูกต่อไป
}