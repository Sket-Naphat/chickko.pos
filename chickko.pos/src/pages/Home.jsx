// src/pages/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
//import jwt_decode from "jwt-decode";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("authToken");

    if (!token) {
      navigate("/"); // ❌ ไม่มี token → กลับไปหน้า Login
      return;
    }

    // try {
    //   const decoded = jwt_decode(token);
    //   const now = Date.now() / 1000; // เป็นวินาที

    //   if (decoded.exp < now) {
    //     Cookies.remove("authToken"); // ❌ หมดอายุ
    //     navigate("/");
    //   }
    // } catch (err) {
    //   Cookies.remove("authToken"); // ❌ token ผิด format
    //   navigate("/");
    // }
  }, []);

  const menuItems = [
    { title: "📊 Dashboard Summary", path: "/summary" },
    { title: "📦 Check Stock", path: "/check-stock" },
    { title: "🕒 WorkTime", path: "/worktime" },
    { title: "💰 Cost Management", path: "/cost" },
  ];

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Chick Ko POS</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 px-4 md:grid-cols-2 gap-4 md:h-96 md:px-20">
        {menuItems.map((item) => (
          <MenuCard key={item.path} title={item.title} path={item.path} />
        ))}
      </div>
    </div>
  );
}

function MenuCard({ title, path }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(path)}
      className="bg-white rounded-xl shadow-md p-6 text-center cursor-pointer hover:bg-blue-100 transition h-full flex items-center justify-center"
    >
      <span className="text-lg font-semibold">{title}</span>
    </div>
  );
}

export default Home;