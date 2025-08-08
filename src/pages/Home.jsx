// src/pages/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { MdLogout } from "react-icons/md"; // ✅ import icon
//import jwt_decode from "jwt-decode";
// ✅ แบบนี้ถูกต้อง
import { jwtDecode } from "jwt-decode";

function Home() {
  const navigate = useNavigate();
  const handleLogout = () => {
    Cookies.remove("authToken");
    navigate("/");
  };
  useEffect(() => {
    const token = Cookies.get("authToken");

    if (!token) {
      navigate("/"); // ❌ ไม่มี token → กลับไปหน้า Login
      return;
    }

    try {
      const decoded = jwtDecode(token); // ✅
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        Cookies.remove("authToken");
        navigate("/");
      }
    } catch (err) {
      console.log("Token decode error:", err);
      Cookies.remove("authToken");
      navigate("/");
    }
  }, [navigate]);

  const menuItems = [
    { title: "📊 Dashboard Summary", path: "/dashboard" },
    { title: "📦 Check Stock", path: "/check-stock" },
    { title: "🕒 Work Time", path: "/worktime" },
    { title: "💰 Cost Management", path: "/cost" },
    { title: "เว็บรับ order", URL: "https://chickkoapp.web.app/index.html" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-7 flex items-center justify-between">
          {/* ซ้าย = Logo */}
          <h1 className="text-xl font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">
            Chick Ko POS
          </h1>

          {/* ขวา = Logout Button */}
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 transition
             w-10 h-10 rounded-full flex items-center justify-center 
             absolute right-5"
            title="Logout"
          >
            <MdLogout className="text-lg" />
          </button>
        </div>
      </nav>

      {/* ✅ พื้นหลังของหน้า Home */}
      <div className="p-4 flex-1 bg-gray-100">

        {/* card */}
        <div className="grid grid-cols-2 sm:grid-cols-2 px-4 md:grid-cols-2 gap-4 md:h-96 md:px-20">
          {menuItems.map((item, index) => (
            <MenuCard key={index} title={item.title} path={item.path} url={item.URL} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuCard({ title, path = "", url = "" }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (url) {
      // ✅ เปิดลิงก์ภายนอกในแท็บใหม่
      window.open(url, "_blank");
    } else if (path) {
      // ✅ นำทางภายในแอป
      navigate(path);
    }
  };
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md p-6 text-center cursor-pointer 
             hover:bg-blue-100 transition h-full min-h-[160px] sm:min-h-[200px] 
             flex items-center justify-center"
    >
      <span className="text-lg font-semibold">{title}</span>
    </div>
  );
}

export default Home;