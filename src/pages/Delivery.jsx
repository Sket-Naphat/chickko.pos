import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import Cookies from "js-cookie";

// ฟังก์ชันแปลงวันที่เป็น "DD/MM/YYYY"
function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
}

function calcGPPercent(totalSales, netSales) {
    if (!totalSales || !netSales) return 0;
    return ((totalSales - netSales) / totalSales) * 100;
}

function calcGPAmount(totalSales, netSales) {
    return totalSales - netSales;
}

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

    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;

    const gpPercent =
        totalSales && netSales
            ? calcGPPercent(Number(totalSales), Number(netSales)).toFixed(2)
            : "";
    const gpAmount =
        totalSales && netSales
            ? calcGPAmount(Number(totalSales), Number(netSales)).toFixed(2)
            : "";

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

    // สรุปยอดขายรวมในเดือนที่เลือก - ใช้ field names ตามจริงจากข้อมูล
    const totalMonthSales = grabData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
    const totalMonthNetSales = grabData.reduce((sum, item) => sum + (item.netSales || 0), 0);
    const totalMonthGP = grabData.reduce((sum, item) => sum + (item.gpAmount || 0), 0);
    const totalDays = grabData.length;

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
        <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
            <div className="w-full max-w-4xl card bg-base-100 shadow-xl p-3 sm:p-6">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">📊 สรุปยอดขาย Grab รายเดือน</h1>
                
                {/* Filter Section */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <label className="font-semibold text-sm">เลือกเดือน:</label>
                    <select
                        className="select select-bordered select-md w-full sm:w-auto"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                    >
                        {months.map((m, idx) => (
                            <option key={m} value={idx}>{m}</option>
                        ))}
                    </select>
                    <select
                        className="select select-bordered select-md w-full sm:w-auto"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                        {displayYearOptions.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button
                        className="btn btn-success btn-sm"
                        onClick={() => setShowModal(true)}
                    >
                        + เพิ่มยอดขายแกรป
                    </button>
                </div>

                {/* Stats Section */}
                <div className="mb-6">
                    <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-100 w-full">
                        <div className="stat">
                            <div className="stat-figure text-success">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div className="stat-title">ยอดขายรวม</div>
                            <div className="stat-value text-success">฿{totalMonthSales.toLocaleString()}</div>
                            <div className="stat-desc">เดือน {months[selectedMonth]} {selectedYear}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-info">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path></svg>
                            </div>
                            <div className="stat-title">ยอดหลังหัก GP</div>
                            <div className="stat-value text-info">฿{totalMonthNetSales.toLocaleString()}</div>
                            <div className="stat-desc">ยอดสุทธิที่ได้รับ</div>
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-error">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </div>
                            <div className="stat-title">GP ที่หักไป</div>
                            <div className="stat-value text-error">{totalMonthGPPercent} % (฿{totalMonthGP.toLocaleString()})</div>
                            <div className="stat-desc"> ค่าคอมมิชชัน Grab</div>
                        </div>
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <div className="stat-title">จำนวนวันที่มีขาย</div>
                            <div className="stat-value text-primary">{totalDays}</div>
                            <div className="stat-desc">วัน</div>
                        </div>
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
                        <p className="text-sm mt-2">กดปุ่ม "เพิ่มยอดขายแกรป" เพื่อเพิ่มข้อมูล</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grabData
                            .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
                            .map((item, index, arr) => (
                            <div key={item.deliveryId || index} className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300 rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-lg">#{arr.length - index}</span>
                                    <span className="badge badge-primary text-sm">{formatDate(item.saleDate)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-base-content/70">ยอดขายรวม</span>
                                    <span className="font-bold text-success text-lg">฿{item.totalSales?.toLocaleString() || 0}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-base-content/70">ยอดหลังหัก GP</span>
                                        <span className="text-info font-semibold">฿{item.netSales?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-base-content/70">GP ที่หักไป</span>
                                        <span className="text-error font-semibold">
                                            {item.gpPercent?.toFixed(2) || 0}% (฿{item.gpAmount?.toLocaleString() || 0})
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-3">
                                    <span className="badge badge-outline text-xs">ID: {item.deliveryId || "N/A"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
        </div>
    );
}