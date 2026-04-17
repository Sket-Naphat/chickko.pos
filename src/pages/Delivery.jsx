import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom"; // ✅ เพิ่ม useNavigate

// ฟังก์ชันแปลงวันที่เป็น "DD/MM/YYYY"
// function formatDate(dateStr) {
//     const date = new Date(dateStr);
//     if (isNaN(date)) return dateStr;
//     return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
//         .toString()
//         .padStart(2, "0")}/${date.getFullYear()}`;
// }
// เพิ่มฟังก์ชันนี้ไว้ใน component ด้วย
function formatDateWithDay(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayName = days[date.getDay()];
    return `${dayName} ${day} ${months[month]} ${year}`;
}


function calcGPPercent(totalSales, netSales) {
    if (!totalSales || !netSales) return 0;
    return ((totalSales - netSales) / totalSales) * 100;
}

function calcGPAmount(totalSales, netSales) {
    return totalSales - netSales;
}
const days = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
];

const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];


export default function Delivery() {
    const getToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    };

    const [showModal, setShowModal] = useState(false);
    const [saleDate, setSaleDate] = useState(getToday());
    const [totalSales, setTotalSales] = useState("");
    const [netSales, setNetSales] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // สำหรับ filter และแสดงข้อมูล
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [grabData, setGrabData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFAB, setShowFAB] = useState(false);

    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;

    const gpPercent =
        totalSales && netSales
            ? calcGPPercent(Number(totalSales), Number(netSales)).toFixed(2)
            : "";
    const gpAmount =
        totalSales && netSales
            ? calcGPAmount(Number(totalSales), Number(netSales)).toFixed(2)
            : "";

    const navigate = useNavigate(); // ✅ เพิ่ม navigate

    // ✅ ฟังก์ชันสำหรับเปิดหน้า Detail
    const handleOpenDetail = (item) => {
        // ส่งข้อมูลไปหน้า Detail ผ่าน state
        navigate('/delivery-detail', {
            state: {
                deliveryData: item,
                selectedMonth: selectedMonth,
                selectedYear: selectedYear
            }
        });
    };

    // ดึงข้อมูล Grab จาก API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const payload = {
                    SelectedMonth: String(selectedMonth + 1),
                    SelectedYear: String(selectedYear)
                };
                const res = await api.post("/orders/GetDeliveryRecords", payload);
                // จัดการกับ response structure ตามที่เห็นในภาพ
                const data = res.data?.data || [];
                setGrabData(data);
            } catch (error) {
                console.error("Error fetching delivery data:", error);
                setGrabData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedMonth, selectedYear]);

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

    // สรุปยอดขายรวมในเดือนที่เลือก - ใช้ field names ตามจริงจากข้อมูล
    const totalMonthSales = grabData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
    const totalMonthNetSales = grabData.reduce((sum, item) => sum + (item.netSales || 0), 0);
    const totalMonthGP = grabData.reduce((sum, item) => sum + (item.gpAmount || 0), 0);
    const totalMonthFoodCost = grabData.reduce((sum, item) => sum + (item.totalFoodCost || 0), 0);
    // ✅ เพิ่ม
    const totalMonthGrossProfit = totalMonthNetSales - totalMonthFoodCost;

    // คำนวณ % GP รวมของเดือน
    const totalMonthGPPercent = totalMonthSales > 0
        ? ((totalMonthGP / totalMonthSales) * 100).toFixed(2)
        : 0;

    const handleSave = async () => {
        if (!saleDate || !totalSales || !netSales) return;
        setIsSaving(true);
        const payload = {
            SaleDate: saleDate,
            TotalSales: Number(totalSales),
            NetSales: Number(netSales),
            GPPercent: Number(gpPercent),
            GPAmount: Number(gpAmount),
            UpdatedBy: authData?.userId || authData?.username || "System"
        };
        try {
            await api.post("/orders/UpdateDeliveryRecords", payload);
            setShowModal(false);
            setSaleDate(getToday());
            setTotalSales("");
            setNetSales("");
            // reload data
            const fetchPayload = {
                SelectedMonth: String(selectedMonth + 1),
                SelectedYear: String(selectedYear)
            };
            const res = await api.post("/orders/GetDeliveryRecords", fetchPayload);
            const data = res.data?.data || [];
            setGrabData(data);
        } catch (error) {
            console.error("Error saving delivery data:", error);
            alert("บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            setIsSaving(false);
        }
    };

    // สร้างตัวเลือกปีจากข้อมูล grabData และปีปัจจุบัน
    const yearOptions = Array.from(
        new Set([
            ...grabData.map(item => {
                const date = new Date(item.saleDate);
                return !isNaN(date.getTime()) ? date.getFullYear() : now.getFullYear();
            }),
            now.getFullYear()
        ])
    ).sort((a, b) => b - a);

    // ถ้าไม่มีตัวเลือกปี ให้ใช้ปีปัจจุบันเป็น default
    const displayYearOptions = yearOptions.length > 0 ? yearOptions : [now.getFullYear()];

    return (
        <div className="p-4 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">🛵 รายได้เดลิเวอรี่</h1>
                    <p className="text-sm text-base-content/70 mt-1">ติดตามยอดขายและค่าคอมมิชชันจาก Grab</p>
                </div>
                <button
                    className="btn btn-success shadow-lg"
                    onClick={() => setShowModal(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    เพิ่มยอดขาย Grab
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
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                        >
                            {months.map((m, idx) => (
                                <option key={m} value={idx}>{m}</option>
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
                            onChange={e => setSelectedYear(Number(e.target.value))}
                        >
                            {displayYearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
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

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">

                <div className="bg-success/20 border border-base-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-success">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        </div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">ยอดหลังหัก GP</div>
                    <div className="text-lg font-bold text-success">฿{totalMonthNetSales.toLocaleString()}</div>
                    <div className="text-xs text-base-content/60">สุทธิ</div>
                </div>
                <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-info">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.723 3.2a.75.75 0 1 0-1.446-.4L7.763 8.25H4a.75.75 0 1 0 0 1.5h3.347l-1.528 5.5H2a.75.75 0 0 0 0 1.5h3.402L4.277 20.8a.75.75 0 0 0 1.446.4l1.236-4.45h7.443l-1.125 4.05a.75.75 0 0 0 1.446.4l1.236-4.45H20a.75.75 0 1 0 0-1.5h-3.624l1.527-5.5H22a.75.75 0 0 0 0-1.5h-3.68l1.403-5.05a.75.75 0 1 0-1.446-.4l-1.514 5.45H9.32l1.403-5.05Zm4.096 12.05l1.528-5.5H8.903l-1.527 5.5h7.443Z" ></path></svg>
                        </div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">ยอดขายรวม</div>
                    <div className="text-lg font-bold text-info">฿{totalMonthSales.toLocaleString()}</div>
                    <div className="text-xs text-base-content/60">{months[selectedMonth]} {selectedYear}</div>
                </div>
                <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-error">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">GP ที่หักไป</div>
                    <div className="text-lg font-bold text-error">{totalMonthGPPercent} % (฿{totalMonthGP.toLocaleString()})</div>
                    <div className="text-xs text-base-content/60">GP</div>
                </div>
                <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">จำนวนบิล</div>
                    <div className="text-lg font-bold text-primary">{grabData.reduce((sum, item) => sum + (item.totalOrders || 0), 0).toLocaleString()}</div>
                    <div className="text-xs text-base-content/60">ออเดอร์</div>
                </div>

                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-error">🍳</div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">ต้นทุนอาหารรวม</div>
                    <div className="text-lg font-bold text-error">฿{totalMonthFoodCost.toLocaleString()}</div>
                    <div className="text-xs text-base-content/60">{months[selectedMonth]} {selectedYear}</div>
                </div>

                {/* ✅ เพิ่ม card กำไรขั้นต้น */}
                <div className={`border rounded-lg p-4 ${totalMonthGrossProfit >= 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className={totalMonthGrossProfit >= 0 ? 'text-success' : 'text-error'}>📈</div>
                    </div>
                    <div className="text-xs text-base-content/70 mb-1">กำไรขั้นต้น</div>
                    <div className={`text-lg font-bold ${totalMonthGrossProfit >= 0 ? 'text-success' : 'text-error'}`}>
                        ฿{totalMonthGrossProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-base-content/60">ยอดหลัก GP - ต้นทุน</div>
                </div>
            </div>

            {/* Data Display Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="mt-3 text-sm text-base-content/70">⏳ กำลังโหลดข้อมูล…</span>
                </div>
            ) : grabData.length === 0 ? (
                <div className="text-center text-base-content/60 py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-lg">ยังไม่มีข้อมูลยอดขาย Grab ในเดือนนี้</p>
                    <p className="text-sm mt-2">กดปุ่ม "เพิ่มยอดขาย Grab" เพื่อเพิ่มข้อมูล</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grabData
                        .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
                        .map((item, index, arr) => (
                            <div
                                key={item.deliveryId || index}
                                className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300 rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer hover:border-primary/50 group"
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
                                    <span className="text-sm text-base-content/70">ยอดหลังหัก GP</span>
                                    <span className="font-bold text-success text-lg">฿{item.netSales?.toLocaleString() || 0}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-base-content/70">ยอดขายรวม</span>
                                        <span className="text-info font-semibold">฿{item.totalSales?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-base-content/70">GP ที่หักไป</span>
                                        <span className="text-error font-semibold">
                                            {item.gpPercent?.toFixed(2) || 0}% (฿{item.gpAmount?.toLocaleString() || 0})
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-base-content/70">ต้นทุนอาหาร</span>
                                        <span className="text-error font-semibold">฿{item.totalFoodCost?.toLocaleString() || 0}</span>
                                    </div>
                                    {/* ✅ เพิ่มกำไรขั้นต้น */}
                                    {(() => {
                                        const grossProfit = (item.netSales || 0) - (item.totalFoodCost || 0);
                                        return (
                                            <div className="flex justify-between items-center pt-1 border-t border-base-300/50">
                                                <span className="text-sm text-base-content/70">กำไรขั้นต้น</span>
                                                <span className={`font-semibold ${grossProfit >= 0 ? 'text-success' : 'text-error'}`}>
                                                    ฿{grossProfit.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-base-content/70">จำนวนบิล</span>
                                    <span className="badge badge-info">{item.totalOrders?.toLocaleString() || 0}</span>
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

            {/* Modal เพิ่มยอดขาย Grab */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6 text-center">📱 เพิ่มยอดขาย Grab</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">วันที่ขาย</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={saleDate}
                                        onChange={e => setSaleDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">ราคาขายรวม (บาท)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        value={totalSales}
                                        onChange={e => setTotalSales(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">ราคาขายที่หัก GP แล้ว (บาท)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        value={netSales}
                                        onChange={e => setNetSales(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                {totalSales && netSales && (
                                    <div className="bg-base-200 rounded-lg p-4">
                                        <label className="label">
                                            <span className="label-text font-semibold">ยอด GP ที่หักไป</span>
                                        </label>
                                        <div className="text-error font-bold text-lg">
                                            {gpPercent}% (฿{gpAmount})
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSaving}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-success ${isSaving ? "loading" : ""}`}
                                    disabled={!saleDate || !totalSales || !netSales || isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        "💾 บันทึก"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
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
    );
}