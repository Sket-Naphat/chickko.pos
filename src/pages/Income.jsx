import { useState, useEffect } from "react";
import { api } from "../lib/api";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { useLocation, useNavigate } from "react-router-dom";
import Delivery from "./Delivery";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
];

const getCurrentMonth = () => new Date().getMonth();
const getCurrentYear = () => new Date().getFullYear();



const Income = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [salesData, setSalesData] = useState([]);
    const [salesLoading, setSalesLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [showFAB, setShowFAB] = useState(false);
    const navigate = useNavigate();

    // ✅ ดึงข้อมูลยอดขายรายวันตอนเปิดหน้า
    useEffect(() => {
        fetchDailySalesReport();
    }, []);

    // ✅ จัดการ FAB scroll to top
    useEffect(() => {
        const handleScroll = () => {
            setShowFAB(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchDailySalesReport = async () => {
        try {
            setSalesLoading(true);
            const response = await api.get("/orders/GetDailyDineInSalesReport");
            setSalesData(response.data.data || []);
        } catch (error) {
            console.error("Error fetching sales report:", error);
            alert(
                "เกิดข้อผิดพลาดในการดึงข้อมูลยอดขาย: " +
                (error.message || "ไม่ทราบสาเหตุ")
            );
        } finally {
            setSalesLoading(false);
        }
    };

    const handleCopyOrderFromFirestore = async () => {
        try {
            setIsLoading(true);
            console.log("Copying order from Firestore...");

            const response = await api.post(
                "/orders/CopyOrderFromFirestore",
                {},
                { timeout: 1800000 }
            );

            console.log("Order copied successfully:", response.data);
            alert(response.data.message + " Order copied successfully");

            // ✅ รีเฟรชข้อมูลยอดขายหลังจากดึงข้อมูลเสร็จ
            await fetchDailySalesReport();
        } catch (error) {
            console.error("Error copying order:", error);
            alert(
                "เกิดข้อผิดพลาดในการดึงข้อมูล: " +
                (error.message || "ไม่ทราบสาเหตุ")
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ ฟังก์ชันจัดรูปแบบตัวเลข
    const formatNumber = (num) => {
        return new Intl.NumberFormat("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const handleMonthChange = (e) => {
        setSelectedMonth(Number(e.target.value));
    };
    const handleYearChange = (e) => {
        setSelectedYear(Number(e.target.value));
    };

    // const themeColors = {
    //     success: 'oklch(20.8% 0.042 265.755)',
    //     base: 'rgba(245, 245, 245, 1)', // tailwind base-100
    // };

    // const options = {
    //     responsive: true,
    //     plugins: {
    //         legend: { display: false },
    //         title: { display: false },
    //         tooltip: {
    //             callbacks: { label: (ctx) => `${ctx.parsed.y} บาท` },
    //             backgroundColor: themeColors.base,
    //             titleColor: themeColors.success,
    //             bodyColor: themeColors.success,
    //             borderColor: themeColors.success,
    //             borderWidth: 1,
    //         },
    //     },
    //     scales: {
    //         x: {
    //             grid: { display: false },
    //             ticks: { color: themeColors.success },
    //         },
    //         y: {
    //             grid: { display: false },
    //             beginAtZero: true,
    //             ticks: { color: themeColors.success },
    //         },
    //     },
    // };

    // const data = {
    //     labels: months,
    //     datasets: [
    //         {
    //             label: "ยอดขายรายเดือน",
    //             data: months.map((_, monthIdx) =>
    //                 salesData
    //                     .filter(item => {
    //                         const date = new Date(item.saleDate);
    //                         return (
    //                             date.getMonth() === monthIdx &&
    //                             date.getFullYear() === selectedYear
    //                         );
    //                     })
    //                     .reduce((sum, item) => sum + item.totalAmount, 0)
    //             ),
    //             backgroundColor: "oklch(60% 0.118 184.704)", // สีกราฟ
    //         },
    //     ],
    // };

    // คำนวณสถิติรายเดือน
    const filteredSalesData = salesData.filter(item => {
        const date = new Date(item.saleDate);
        return (
            date.getMonth() === selectedMonth &&
            date.getFullYear() === selectedYear
        );
    });

    const handleOpenDetail = (item) => {
        // ส่งข้อมูลไปหน้า Detail ผ่าน state
        navigate('/income-detail', {
            state: {
                incomeData: item,
                selectedMonth: selectedMonth,
                selectedYear: selectedYear
            }
        });
    };


    const totalMonthSales = filteredSalesData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalMonthOrders = filteredSalesData.reduce((sum, item) => sum + item.orders, 0);
    const totalDays = filteredSalesData.length;
    const avgPerOrder = totalMonthOrders > 0 ? totalMonthSales / totalMonthOrders : 0;

    return (
        <>
            <div className="p-4 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">🏪 รายได้หน้าร้าน</h1>
                        <p className="text-sm text-base-content/70 mt-1">ติดตามยอดขายและรายได้จากลูกค้าในร้าน</p>
                    </div>
                    <button
                        className={`btn btn-primary shadow-lg ${isLoading ? "loading" : ""}`}
                        onClick={handleCopyOrderFromFirestore}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                กำลังดึงข้อมูล...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                ดึงข้อมูลจาก Firestore
                            </>
                        )}
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-base-100 rounded-xl p-3 border border-base-300 shadow-sm">
                    <h3 className="text-base font-semibold text-base-content mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                        </svg>
                        เลือกช่วงเวลาที่ต้องการดู
                    </h3>
                    <div className="flex flex-row gap-2 md:grid md:grid-cols-2 md:gap-3">
                        <div className="form-control flex-1">
                            <label className="label mb-1">
                                <span className="label-text font-medium text-sm">เดือน</span>
                            </label>
                            <select
                                className="select select-bordered w-full text-sm min-h-8"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                            >
                                {months.map((m, idx) => (
                                    <option key={m} value={idx}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control flex-1">
                            <label className="label mb-1">
                                <span className="label-text font-medium text-sm">ปี</span>
                            </label>
                            <select
                                className="select select-bordered w-full text-sm min-h-8"
                                value={selectedYear}
                                onChange={handleYearChange}
                            >
                                {[...new Set(salesData.map(item => new Date(item.saleDate).getFullYear()))]
                                    .sort((a, b) => b - a)
                                    .map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <div className="badge badge-outline">
                            แสดงข้อมูล: {months[selectedMonth]} {selectedYear}
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="alert alert-info shadow-lg">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span>กำลังดึงข้อมูลกรุณารอสักครู่...</span>
                    </div>
                )}

                {/* Stats Section */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div className="bg-success/20 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-success">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </div>
                        </div>
                        <div className="text-xs text-base-content/70 mb-1">ยอดขายรวม</div>
                        <div className="text-lg font-bold text-success">฿{totalMonthSales.toLocaleString()}</div>
                        <div className="text-xs text-base-content/60">{months[selectedMonth]} {selectedYear}</div>
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs text-base-content/70 mb-1">จำนวนบิล</div>
                        <div className="text-lg font-bold text-primary">{totalMonthOrders.toLocaleString()}</div>
                        <div className="text-xs text-base-content/60">บิล</div>
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-info">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs text-base-content/70 mb-1">ค่าเฉลี่ย/บิล</div>
                        <div className="text-lg font-bold text-info">฿{formatNumber(avgPerOrder)}</div>
                        <div className="text-xs text-base-content/60">บาท</div>
                    </div>

                    <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.723 3.2a.75.75 0 1 0-1.446-.4L7.763 8.25H4a.75.75 0 1 0 0 1.5h3.347l-1.528 5.5H2a.75.75 0 0 0 0 1.5h3.402L4.277 20.8a.75.75 0 0 0 1.446.4l1.236-4.45h7.443l-1.125 4.05a.75.75 0 0 0 1.446.4l1.236-4.45H20a.75.75 0 1 0 0-1.5h-3.624l1.527-5.5H22a.75.75 0 0 0 0-1.5h-3.68l1.403-5.05a.75.75 0 1 0-1.446-.4l-1.514 5.45H9.32l1.403-5.05Zm4.096 12.05l1.528-5.5H8.903l-1.527 5.5h7.443Z" ></path>
                                </svg>
                            </div>
                        </div>
                        <div className="text-xs text-base-content/70 mb-1">วันที่เปิดขาย</div>
                        <div className="text-lg font-bold text-secondary">{totalDays}</div>
                        <div className="text-xs text-base-content/60">วัน</div>
                    </div>
                </div>

                {/* Chart Section */}
                {/* <div className="card bg-base-100 border border-base-300 rounded-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">
                            📈 กราฟยอดขายรายเดือน
                        </h2>
                        <Bar data={data} options={options} />
                        <div className="mt-4 text-center p-4 bg-base-200 rounded-lg border border-base-300/50">
                            <span className="text-lg font-semibold">
                                ยอดขายเดือน {months[selectedMonth]} {selectedYear}:
                                <span className="text-success ml-2">฿{formatNumber(totalMonthSales)}</span>
                            </span>
                        </div>
                    </div>
                </div> */}

                {/* Data Display Section */}
                {salesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <span className="mt-3 text-sm text-base-content/70">⏳ กำลังโหลดข้อมูล…</span>
                    </div>
                ) : salesData.length === 0 ? (
                    <div className="text-center text-base-content/60 py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-lg">ยังไม่มีข้อมูลยอดขายในเดือนนี้</p>
                        <p className="text-sm mt-2">กด "ดึงข้อมูลจาก Firestore" เพื่อโหลดข้อมูลล่าสุด</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSalesData
                            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
                            .map((item, index, arr) => (
                                <div
                                    key={index}
                                    className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                                    onClick={() => handleOpenDetail(item)}
                                    title="คลิกเพื่อดูรายละเอียด"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-lg">#{arr.length - index}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-primary text-sm">{formatDateWithDay(item.saleDate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-base-content/70">ยอดขายรวม</span>
                                        <span className="font-bold text-success text-lg">฿{formatNumber(item.totalAmount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-base-content/70">จำนวนบิล</span>
                                            <span className="badge badge-info">{item.orders}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-base-content/70">ค่าเฉลี่ยต่อบิล</span>
                                            <span className="text-info font-semibold">฿{formatNumber(item.avgPerOrder)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-base-300/50 text-center">
                                        <span className="text-xs text-base-content/50 group-hover:text-primary transition-colors">
                                            👆 คลิกเพื่อดูรายละเอียด
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* FAB - Floating Action Button */}
                {showFAB && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <button
                            onClick={scrollToTop}
                            className="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                            title="กลับไปด้านบนสุด"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    // เพิ่มฟังก์ชันนี้ไว้ใน component ด้วย
    function formatDateWithDay(dateString) {
        const date = new Date(dateString);
        const days = [
            "วันอาทิตย์",
            "วันจันทร์",
            "วันอังคาร",
            "วันพุธ",
            "วันพฤหัสบดี",
            "วันศุกร์",
            "วันเสาร์",
        ];
        const dayName = days[date.getDay()];
        const formattedDate = date.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        return `${dayName} ที่ ${formattedDate}`;
    }
}
const AllIncome = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('income');

    // ตรวจสอบ state จาก navigation เพื่อเปิด tab ที่ถูกต้อง
    useEffect(() => {
        if (location.state?.activeTab === 'delivery') {
            setActiveTab('delivery');
        }
    }, [location.state]);

    return (
        <div>
            <div className="tabs tabs-lift w-full">
                <label className={`tab w-1/2 ${activeTab === 'income' ? 'border-b-2 border-primary font-bold text-primary' : ''}`}>
                    <input
                        type="radio"
                        name="my_tabs_4"
                        checked={activeTab === 'income'}
                        onChange={() => setActiveTab('income')}
                    />
                    🏪 รายได้หน้าร้าน
                </label>
                {activeTab === 'income' && (
                    <div className="tab-content bg-base-100">
                        <Income />
                    </div>
                )}

                <label className={`tab w-1/2 ${activeTab === 'delivery' ? 'border-b-2 border-secondary font-bold text-secondary' : ''}`}>
                    <input
                        type="radio"
                        name="my_tabs_4"
                        checked={activeTab === 'delivery'}
                        onChange={() => setActiveTab('delivery')}
                    />
                    🛵 รายได้เดลิเวอรี่
                </label>
                {activeTab === 'delivery' && (
                    <div className="tab-content bg-base-100">
                        <Delivery />
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllIncome;