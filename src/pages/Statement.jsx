import { useRef, useState, useEffect } from 'react';
import { api } from '../lib/api';
//import api from '../lib/api'; // <-- เพิ่ม import api
import Cookies from 'js-cookie';
import React from 'react';
import Toast from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import StatementIncomeAddButton from '../components/Statement/StatementIncomeAddButton';

// Main Statement Component
const Statement = () => {
    // เพิ่ม refreshKey ทุกครั้งที่เพิ่มรายการใหม่ → trigger useEffect ดึงข้อมูลซ้ำ
    const [refreshKey, setRefreshKey] = useState(0);
    //const [incomeList, setIncomeList] = useState([]);
    //const [isLoadingList, setIsLoadingList] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [loading, setLoading] = useState(false);
    const [statementData, setStatementData] = useState(null);
    const [dateFrom, setDateFrom] = useState("2026-03-01");
    const [dateTo, setDateTo] = useState("2026-03-07");
    const hideTimer = useRef(null); // ref เก็บ timer ของ toast เพื่อ clear ก่อน set ใหม่
    const navigate = useNavigate();

    // ดึงรายการรายรับทุกครั้งที่ refreshKey เปลี่ยน (รวมถึงโหลดหน้าครั้งแรก)
    useEffect(() => {
        const fetchStatement = async () => {
            setLoading(true);
            try {
                const res = await api.post("/Statement/GetStatement", {
                    'DateFrom': dateFrom,
                    'DateTo': dateTo
                });
                setStatementData(res.data);
            } catch (e) {
                showToast("ดึงข้อมูลงบการเงินไม่สำเร็จ", "error");
                console.error(e.response?.data || e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStatement();
    }, [refreshKey, dateFrom, dateTo]);

    // callback ที่ส่งให้ Modal → เรียกเมื่อบันทึกสำเร็จ
    const handleNoteCreated = () => {
        setRefreshKey(prev => prev + 1);
    };

    // แสดง toast พร้อม auto-hide ตาม duration
    const showToast = (message, type = "success", duration = 2000) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setToast({ show: true, message, type });
        hideTimer.current = setTimeout(() => 
            setToast((t) => ({ ...t, show: false }))
        , duration);
    };

    // Responsive check
    const isMobile = window.innerWidth < 768;

    return (
        <div className="p-2 md:p-4 space-y-2 md:space-y-3 max-w-7xl mx-auto">
            {/* Global Toast */}
            <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />

            {/* Header Section */}
            <div className="bg-gradient-to-r from-accent/10 to-secondary/10 backdrop-blur-sm border border-accent/20 rounded-xl p-2 md:p-3 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-accent/20 rounded-lg">
                            <span className="text-xl">💰</span>
                        </div>
                        <div>
                            <h1 className="text-base md:text-lg font-bold text-primary">
                                บันทึกงบการเงิน
                            </h1>
                            <p className="text-xs text-base-content/70 hidden sm:block">
                                บันทึกรายการรายรับ-รายจ่ายของร้าน
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ปุ่มไปยังหน้า StatementIncome และ Modal เพิ่มรายการ */}
            <div className="flex items-center gap-2 mb-2">
                <button
                    className="btn btn-outline btn-warning"
                    onClick={() => navigate('/statement-income')}
                >
                    ดูรายการงบการเงินทั้งหมด
                </button>
                <StatementIncomeAddButton onCreated={handleNoteCreated} showToast={showToast} />
            </div>

            {/* Filter by date */}
            <div
                className={
                    isMobile
                        ? "flex flex-col gap-2 mb-2 items-stretch"
                        : "flex flex-wrap gap-2 mb-2 items-center"
                }
            >
                <div className={isMobile ? "" : "flex items-center gap-2"}>
                    <label className="text-sm">จาก</label>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        max={dateTo}
                    />
                </div>
                <div className={isMobile ? "" : "flex items-center gap-2"}>
                    <label className="text-sm">ถึง</label>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        min={dateFrom}
                    />
                </div>
            </div>

            {/* Paid Expenses Card */}
            <div className="card bg-base-100 shadow-xl border-2 border-success/30 hover:border-success/50 transition-all duration-300 rounded-xl overflow-hidden">
                <div className="card-header bg-gradient-to-r from-success/10 to-success/5 border-b border-success/20 p-2 md:p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-success/20 rounded-lg">
                                <span className="text-base">✅</span>
                            </div>
                            <div>
                                <h2 className="text-sm md:text-base font-bold text-success">
                                    รายงานการเดินบัญชีที่ผ่านมา
                                </h2>
                                <p className="text-xs text-success/70 hidden sm:block">รายงานประวัติการเดินบัญชีที่่ผ่านมา</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-body p-3 md:p-4 bg-gradient-to-b from-base-100 to-base-50">
                    {loading ? (
                        <div className="text-center py-8 text-base-content/60">กำลังโหลด...</div>
                    ) : statementData ? (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                    <div className="text-xs text-base-content/70">ยอดเงินคงเหลือ</div>
                                    <div className="font-bold text-lg text-primary">฿{statementData.balance?.toLocaleString()}</div>
                                </div>
                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                    <div className="text-xs text-base-content/70">รายรับรวม</div>
                                    <div className="font-bold text-lg text-success">฿{statementData.totalIncome?.toLocaleString()}</div>
                                </div>
                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                    <div className="text-xs text-base-content/70">รายจ่ายรวม</div>
                                    <div className="font-bold text-lg text-error">฿{statementData.totalCost?.toLocaleString()}</div>
                                </div>
                                <div className="bg-base-200 rounded-lg p-2 text-center">
                                    <div className="text-xs text-base-content/70">กำไรสุทธิ</div>
                                    <div className="font-bold text-lg text-info">฿{statementData.netProfit?.toLocaleString()}</div>
                                </div>
                            </div>
                            {/* Daily Statements */}
                            {isMobile ? (
                                <div className="space-y-2">
                                    {statementData.dailyStatements?.map((d, idx) => (
                                        <div key={idx} className="bg-base-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold">{d.date}</span>
                                                <span className="text-xs text-base-content/60">ยอดคงเหลือ: ฿{d.balance?.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-base-content/70 mb-1">ยอดขาย: ฿{d.sales?.toLocaleString()}</div>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span>รายรับ: <span className="text-success font-bold">฿{d.totalIncome?.toLocaleString()}</span></span>
                                                <span>รายจ่าย: <span className="text-error font-bold">฿{d.totalCost?.toLocaleString()}</span></span>
                                                <span>กำไร: <span className="text-info font-bold">฿{d.profit?.toLocaleString()}</span></span>
                                                <span>ต่าง: <span className="font-bold">{d.difference}</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-xs w-full">
                                        <thead>
                                            <tr>
                                                <th>วันที่</th>
                                                <th className="text-right">ยอดคงเหลือ</th>
                                                <th className="text-right">ยอดขาย</th>
                                                <th className="text-right">รายรับ</th>
                                                <th className="text-right">รายจ่าย</th>
                                                <th className="text-right">กำไร</th>
                                                <th className="text-right">ต่าง</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statementData.dailyStatements?.map((d, idx) => (
                                                <tr key={idx}>
                                                    <td>{d.date}</td>
                                                    <td className="text-right">{d.balance?.toLocaleString()}</td>
                                                    <td className="text-right">{d.sales?.toLocaleString()}</td>
                                                    <td className="text-right text-success">{d.totalIncome?.toLocaleString()}</td>
                                                    <td className="text-right text-error">{d.totalCost?.toLocaleString()}</td>
                                                    <td className="text-right text-info">{d.profit?.toLocaleString()}</td>
                                                    <td className="text-right">{d.difference}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-base-content/60">ไม่มีข้อมูล</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statement;