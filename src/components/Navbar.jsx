import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md"; // ✅ import icon
import Cookies from "js-cookie";
import { logout } from "../lib/api";
function Navbar() {
    const location = useLocation(); // ✅ ใช้เพื่อเช็ค path ปัจจุบัน
    const navigate = useNavigate();
    const handleLogout = () => {
        logout(); // ✅ ใช้ฟังก์ชัน logout ที่ import มาจาก api.js
    };



    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* Logo */}
                <h1 className="text-xl font-bold text-gray-800">
                    <Link to="/home" className="hover:text-blue-500">
                        Chick Ko POS
                    </Link>
                </h1>

                {/* เมนูด้านขวาทั้งหมด (เมนูหน้า dashboard + logout) */}
                <div className="flex items-center space-x-4">
                    {/* เฉพาะหน้า dashboard */}
                    {location.pathname === "/dashboard" && (
                        <>
                            <Link to="/check-stock" className="text-gray-700 hover:text-blue-500">
                                เช็ค Stock
                            </Link>
                            <Link to="/cost" className="text-gray-700 hover:text-blue-500">
                                ไปดูต้นทุน
                            </Link>
                        </>
                    )}

                    {/* ปุ่ม logout อยู่บรรทัดเดียวกัน */}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white hover:bg-red-600 
                   w-10 h-10 flex items-center justify-center 
                   rounded-full transition"
                        title="ออกจากระบบ"
                    >
                        <MdLogout className="text-lg" />
                    </button>
                </div>
            </div>
        </nav>

    );
}

export default Navbar;
