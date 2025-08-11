// src/App.jsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import LoadingBar from "./components/LoadingBar";
import Toast from "./components/Toast";

import RequireAuth from "../routes/RequireAuth";                 // ✅ กันหน้า: ต้องมี token/ไม่หมดอายุ
import { bindLoadingListener, bindErrorListener } from "./lib/api"; // ✅ ผูก interceptors → UI กลาง

// เพจ
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Cost from "./pages/Cost";
import Stock from "./pages/Stock";
import WorkTime from "./pages/Worktime";

function App() {
  const location = useLocation();

  // ✅ โชว์/ซ่อน Navbar ตาม path (คงรูปแบบเดิมไว้)
  const hideNavbarPaths = ["/", "/login", "/home"];             // หน้าเหล่านี้ “ไม่มี Navbar”
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  // ✅ สายข้อมูลจาก axios interceptors → แถบโหลด + toast
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    bindLoadingListener(setLoading);                            // เมื่อมี request ค้าง → show loading bar
    bindErrorListener((msg) => {                                // error กลาง → โชว์ toast
      setToast(msg);
      setTimeout(() => setToast(""), 4000);
    });
  }, []);

  return (
    <>
      {/* UI กลาง */}
      <LoadingBar show={loading} />
      <Toast message={toast} onClose={() => setToast("")} />

      {shouldShowNavbar ? (
        /* ======================= Layout ที่ “มี Navbar” (หลังล็อกอิน) ======================= */
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* ✅ กันทุกหน้าภายใต้ layout นี้ด้วย RequireAuth */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cost" element={<Cost />} />
                <Route path="/check-stock" element={<Stock />} />
                <Route path="/worktime" element={<WorkTime />} />
              </Route>

              {/* ไป path แปลก ๆ ขณะอยู่ layout นี้ → ส่งไป /login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        /* ======================= หน้า “ไม่มี Navbar” (login + home) ======================= */
        <Routes>
          {/* หน้า login เปิดได้เสมอ */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* ✅ หน้า Home ต้องล็อกอิน แต่ “ไม่แสดง Navbar” ตามที่กำหนด */}
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<Home />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      )}
    </>
  );
}

export default App;