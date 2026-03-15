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
import CheckStock from "./pages/CheckStock";
import StockIn from "./pages/StockIn"; // 👉 เปลี่ยนชื่อเป็น StockInDetail เพื่อความชัดเจน
import StockItem from "./pages/StockItem";
import Register from "./pages/Register";
import TimeClock from "./pages/TimeClock";
import Delivery from "./pages/Delivery";
import DeliveryDetail from "./pages/DeliveryDetail";
import Income from "./pages/Income";
import IncomeDetail from "./pages/IncomeDetail";
import RollingGame from "./pages/RollingGame"; // ✅ เพิ่มหน้าจับฉลาก
import Event from "./pages/Event"; // 👉 เพิ่มหน้ากิจกรรม
import EventRollingReport from "./pages/EventRollingReport"; // ✅ เพิ่มหน้าจับฉลาก - Protected route
import Statement from "./pages/Statement";
import StatementIncome from "./pages/StatementIncome";

function App() {
  const location = useLocation();

  // ✅ เพิ่ม "/rolling-game" ใน hideNavbarPaths เพื่อไม่แสดง Navbar
  const hideNavbarPaths = ["/", "/login", "/home", "/register", "/rolling-game"];
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
        /* ======================= Layout ที่ "มี Navbar" (หลังล็อกอิน) ======================= */
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* ✅ กันทุกหน้าภายใต้ layout นี้ด้วย RequireAuth */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cost" element={<Cost />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/worktime" element={<WorkTime />} />
                <Route path="/timeclock" element={<TimeClock />} />
                <Route path="/checkstock/:orderId" element={<CheckStock />} />
                <Route path="/stockin/:orderId" element={<StockIn />} />
                <Route path="/stockitem" element={<StockItem />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/delivery-detail" element={<DeliveryDetail />} />
                <Route path="/income" element={<Income />} /> 
                <Route path="/income-detail" element={<IncomeDetail />} />
                <Route path="/event" element={<Event />} /> {/* 👉 เพิ่มหน้ากิจกรรม */}
                <Route path="/rolling-game-report" element={<EventRollingReport />} /> {/* ✅ เพิ่มหน้าจับฉลาก - Protected route */}
                <Route path="/statement" element={<Statement />} />
                <Route path="/statement-income" element={<StatementIncome />} />
              </Route>

              {/* ไป path แปลก ๆ ขณะอยู่ layout นี้ → ส่งไป /login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        /* ======================= หน้า "ไม่มี Navbar" (login + register + home + rolling-game) ======================= */
        <Routes>
          {/* ✅ Public routes - ไม่ต้อง login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rolling-game" element={<RollingGame />} /> {/* ✅ เพิ่มหน้าจับฉลาก - Public route */}

          {/* ✅ Protected routes - ต้อง login แต่ไม่มี Navbar */}
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<Home />} />
          </Route>

          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      )}
    </>
  );
}

export default App;