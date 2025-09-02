import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdLogout, MdMenu, MdClose } from "react-icons/md";
import Cookies from "js-cookie"; // ถ้าไม่ได้ใช้ ลบได้
import { logout } from "../lib/api";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle"; // นำเข้า ThemeToggle

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false); // สถานะเมนูมือถือ
    const [permission, setPermission] = useState(null);
    const [isManager, setIsManager] = useState(false);
    const [isEmployee, setIsEmployee] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        setOpen(false);

        const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
        if (authData && authData.userPermissionId !== undefined) {
            setPermission(authData.userPermissionId);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (permission !== null) {
            setIsManager(permission !== 3); // admin, manager
            setIsEmployee(true); // employee, admin
        }
    }, [permission]);
    
    return (
        <nav className="shadow-md relative z-40">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <h1 className="text-xl font-bold text-accent">
                    <Link to="/home" className="hover:text-black">
                        Chick Ko POS
                    </Link>
                </h1>

                {/* ปุ่ม Hamburger (แสดงเฉพาะจอเล็ก) */}
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="md:hidden text-accent inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary transition"
                    aria-controls="mobile-menu"
                    aria-expanded={open}
                    aria-label="Toggle navigation"
                >
                    {open ? (
                        <MdClose className="text-2xl" />
                    ) : (
                        <MdMenu className="text-2xl" />
                    )}
                </button>

                {/* เมนูแนวนอน (แสดงตั้งแต่ md ขึ้นไป) */}
                <div className="hidden md:flex items-center space-x-4 ">
                    {isManager && (
                        <>
                            <Link to="/cost" className="py-2 px-2 rounded hover:bg-accent">
                                ต้นทุน
                            </Link>
                        </>
                    )}
                    {/* ✅ Employee สามารถเช็ค Stock */}
                    {isEmployee && (
                        <>
                            <Link to="/stock" className="py-2 px-2 rounded hover:bg-accent">
                                เช็ค Stock
                            </Link>
                            <Link to="/worktime" className="py-2 px-2 rounded hover:bg-accent">
                                เวลางาน
                            </Link>
                        </>
                    )}
                    {/* ✅ หรือทุก role สามารถเช็ค Stock */}
                    {/* <Link to="/stock" className="py-2 px-2 rounded hover:bg-accent">
                        เช็ค Stock
                    </Link> */}
                    
                    <div>
                        <ThemeToggle></ThemeToggle>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-error hover:bg-error w-10 h-10 flex items-center justify-center rounded-full transition"
                        title="ออกจากระบบ"
                    >
                        <MdLogout className="text-lg" />
                    </button>
                </div>
            </div>

            {/* แผงเมนูมือถือ (dropdown) */}
            <div
                id="mobile-menu"
                className={`md:hidden overflow-hidden transition-[max-height] duration-300 ${open ? "max-h-96" : "max-h-0"}`}
            >
                <div className="border-t border-gray-100 px-4 py-3 flex flex-col space-y-2 bg-base-100">
                    {isManager && (
                        <>
                            <Link to="/cost" className="py-2 px-2 rounded hover:bg-accent">
                                ไปดูต้นทุน
                            </Link>
                        </>
                    )}
                    
                    {/* ✅ แก้ไข: Employee สามารถเช็ค Stock */}
                    {isEmployee && (
                        <>
                            <Link to="/stock" className="py-2 px-2 rounded hover:bg-accent">
                                เช็ค Stock
                            </Link>
                            <Link to="/worktime" className="py-2 px-2 rounded hover:bg-accent">
                                เวลางาน
                            </Link>
                        </>
                    )}

                    <div>
                        <ThemeToggle></ThemeToggle>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-1 inline-flex items-center gap-2 bg-error text-white hover:bg-red-600 px-3 py-2 rounded-lg"
                    >
                        <MdLogout className="text-lg" />
                        ออกจากระบบ
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
