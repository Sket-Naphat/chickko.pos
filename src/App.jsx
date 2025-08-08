// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Cost from "./pages/Cost";
import Stock from "./pages/Stock";
import WorkTime from "./pages/Worktime";

function App() {
  const location = useLocation();

  // ซ่อน Navbar เมื่ออยู่หน้า Login
  const hideNavbarPaths = ["/","/login", "/home"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

    return (
    <>
      {shouldShowNavbar ? (
        // ✅ Layout ที่มี Navbar + Content รวม min-h-screen
        <div className="flex flex-col min-h-screen bg-gray-100">
          <Navbar />
          <main className="flex-1 ">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cost" element={<Cost />} />
              <Route path="/check-stock" element={<Stock />} />
              <Route path="/worktime" element={<WorkTime />} />
            </Routes>
          </main>
        </div>
      ) : (
        // ✅ หน้า login/home ที่ไม่มี navbar
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      )}
    </>
  );
}

export default App;
