// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { MdLogout } from "react-icons/md";
import { logout } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
  const [site, setSite] = useState("");
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
  };
  useEffect(() => {
    const token = Cookies.get("authToken");
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;


    if (!token || !authData) {
      console.log("No auth token or auth data, redirecting to login");
      navigate("/");
      return;
    }

    setSite(authData.site);

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        Cookies.remove("authToken");
        Cookies.remove("authData");
        console.log("Token expired, redirecting to login");
        navigate("/");
      }
    } catch (err) {
      console.log("Token decode error:", err);
      Cookies.remove("authToken");
      Cookies.remove("authData");
      navigate("/");
    }
  }, [navigate]);

  const [permission, setPermission] = useState(null);

  useEffect(() => {
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
    if (authData && authData.userPermissionId !== undefined) {
      setPermission(authData.userPermissionId);
    }
  }, []);

  const menuItems = [
  ];

  switch (permission) {
    case 1: // owner
      menuItems.push(
        { title: "📊 สรุปผล", path: "/dashboard" },
        { title: "💰 รายได้", path: "/income" },
        // { title: "🚛 Delivery", path: "/delivery" },
        { title: "💰 ต้นทุน", path: "/cost" },
        { title: "🕒 ประวัติการเข้าออกงาน", path: "/worktime" }, // ✅ เพิ่ม disabled
        { title: "📦 นับสต๊อก", path: "/stock" },
        { title: "🗒️ เว็บรับออเดอร์", URL: site === "BKK" ? "https://chick-ko-bkk.web.app/index.html" : "https://chickkoapp.web.app/index.html" },
        { title: "🎉 กิจกรรม", path: "/event" } // 👉 เพิ่มหน้ากิจกรรม
      );
      break;
    case 2: // manager
      menuItems.push(
        { title: "📦 นับสต๊อก", path: "/stock" },
        { title: "🕒 ประวัติการเข้าออกงาน", path: "/worktime" }, // ✅ เพิ่ม disabled
        { title: "⏰ ลงเวลางาน", path: "/timeclock" },
        { title: "🗒️ เว็บรับออเดอร์", URL: site === "BKK" ? "https://chick-ko-bkk.web.app/index.html" : "https://chickkoapp.web.app/index.html" },
        { title: "🎉 กิจกรรม", path: "/event" } // 👉 เพิ่มหน้ากิจกรรม
      );
      break;
    case 3: // staff
      menuItems.push(
        { title: "📦 นับสต๊อก", path: "/stock" },
        { title: "🕒 ประวัติการเข้าออกงาน", path: "/worktime" }, // ✅ เพิ่ม disabled
        { title: "⏰ ลงเวลางาน", path: "/timeclock" },
        { title: "🗒️ เว็บรับออเดอร์", URL: site === "BKK" ? "https://chick-ko-bkk.web.app/index.html" : "https://chickkoapp.web.app/index.html" },
        { title: "🎉 กิจกรรม", path: "/event" } // 👉 เพิ่มหน้ากิจกรรม
      );
      break;
    default:
      // ถ้า permission ไม่ตรงกับกรณีใดๆ ให้แสดงเฉพาะ Time Clock และ เว็บรับ order
      menuItems.push(
        { title: "🗒️ เว็บรับ order", URL: site === "BKK" ? "https://chick-ko-bkk.web.app/index.html" : "https://chickkoapp.web.app/index.html" },
      );
      break;
  }


  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <nav className="bg-base-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-7 flex items-center justify-between relative">
          {/* ซ้าย = Logo */}
          <ThemeToggle></ThemeToggle>
          <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2 text-accent">
            Chick Ko POS
          </h1>

          {/* ขวา = Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-circle btn-error absolute right-5"
            title="Logout"
          >
            <MdLogout className="text-lg" />
          </button>
        </div>
      </nav>

      <div className="p-4 flex-1 bg-base-200">
        <div className="grid grid-cols-2 sm:grid-cols-2 px-4 md:grid-cols-2 gap-4 md:h-96 md:px-20">
          {menuItems.map((item, index) => (
            <MenuCard
              key={index}
              title={item.title}
              path={item.path}
              url={item.URL}
              disabled={item.disabled} // ✅ ส่ง disabled prop
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ✅ อัปเดต MenuCard รับ disabled prop
function MenuCard({ title, path = "", url = "", disabled = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return; // ✅ ถ้า disabled ไม่ทำอะไร

    if (url) {
      window.open(url, "_blank");
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`card bg-base-100 shadow-md transition h-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center ${disabled
        ? "cursor-not-allowed opacity-50" // ✅ disabled style
        : "cursor-pointer hover:bg-primary/10" // ✅ normal style
        }`}
    >
      <div className="card-body flex items-center justify-center p-4">
        <span className={`text-lg font-semibold ${disabled ? "text-base-content/50" : "text-accent"}`}>
          {title}
        </span>
      </div>
    </div>
  );
}

export default Home;
