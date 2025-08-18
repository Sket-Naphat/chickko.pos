// src/pages/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { MdLogout } from "react-icons/md";
import { logout } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
  };
  useEffect(() => {
    const token = Cookies.get("authToken");

    if (!token) {
      navigate("/");
      return;
    }

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

  const menuItems = [
    { title: "📊 Dashboard Summary", path: "/dashboard" },
    { title: "📦 Check Stock", path: "/stock" },
    { title: "🕒 Work Time", path: "/worktime" },
    { title: "💰 Cost Management", path: "/cost" },
    { title: "🗒️ เว็บรับ order", URL: "https://chickkoapp.web.app/index.html" },
  ];

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
      window.open(url, "_blank");
    } else if (path) {
      navigate(path);
    }
  };
  return (
    <div
      onClick={handleClick}
      className="card bg-base-100 shadow-md cursor-pointer hover:bg-primary/10 transition h-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center"
    >
      <div className="card-body flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-accent">{title}</span>
      </div>
    </div>
  );
}

export default Home;
