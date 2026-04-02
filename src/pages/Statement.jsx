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
    const [dateFrom, setDateFrom] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [dateTo, setDateTo] = useState(() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    });
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
                setStatementData(res.data.data);
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

    // Go to top
    const [showGoTop, setShowGoTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowGoTop(window.scrollY > 200);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
                            {/* Summary - Mobile */}
                            {isMobile ? (
                                <div className="mb-4 space-y-3">
                                    {/* Highlight: กำไรจากการดำเนินงาน */}
                                    <div className={`rounded-xl p-4 text-center ${statementData.netProfit < 0 ? 'bg-error/10 border border-error/30' : 'bg-success/10 border border-success/30'}`}>
                                        <div className="text-xs text-base-content/60 mb-1">ผลการดำเนินงาน</div>
                                        <div className={`text-3xl font-black ${statementData.netProfit < 0 ? 'text-error' : 'text-success'}`}>
                                            ฿{statementData.netProfit?.toLocaleString()}
                                        </div>
                                    </div>
                                    {/* รายรับ vs รายจ่าย */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-success/10 rounded-xl p-3 text-center border border-success/20">
                                            <div className="text-xs text-base-content/60 mb-1">รายรับรวม</div>
                                            <div className="font-bold text-base text-success">฿{statementData.totalIncome?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-error/10 rounded-xl p-3 text-center border border-error/20">
                                            <div className="text-xs text-base-content/60 mb-1">รายจ่ายรวม</div>
                                            <div className="font-bold text-base text-error">฿{statementData.totalCost?.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* รายละเอียด: list แบบ minimal */}
                                    <div className="bg-white rounded-xl divide-y divide-base-300 overflow-hidden">                                        
                                        <div className="flex justify-between items-center px-4 py-3 bg-success/10">
                                            <span className="text-xs font-semibold text-success">🏦 บัญชีคงเหลือ</span>
                                            <span className="font-black text-base text-success">฿{statementData.bankBalance?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">💵 เงินสดคงเหลือ</span>
                                            <span className="font-bold text-sm text-info">฿{statementData.cashBalance?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4  py-2 bg-primary/10">
                                            <span className="text-xs text-base-content/60">💰 คงเหลือทั้งหมด</span>
                                            <span className="font-bold text-sm text-primary">฿{statementData.balance?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">🏁 เงินตั้งต้น</span>
                                            <span className="font-bold text-sm text-info">฿{statementData.startingBalance?.toLocaleString()}</span>
                                        </div>
                                         <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">📊 กระแสเงินสดสุทธิ</span>
                                            <span className={`font-bold text-sm ${statementData.netChange < 0 ? 'text-error' : 'text-success'}`}>฿{statementData.netChange?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">🛒 ยอดขายรวม</span>
                                            <span className="font-bold text-sm text-warning">฿{statementData.totalSales?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">🔍 เงินขาด/เกิน</span>
                                            <span className="font-bold text-sm text-base-content">฿{statementData.hiddenCost?.toLocaleString()}</span>
                                        </div> 
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">📊 รายจ่าย (รวม เงินขาด/เกิน) </span>
                                            <span className="font-bold text-sm text-error">฿{statementData.totalCostWithHidden?.toLocaleString()}</span>
                                        </div>                                                                             
                                        <div className="flex justify-between items-center px-4 py-2">
                                            <span className="text-xs text-base-content/60">📈 กำไรสุทธิ</span>
                                            <span className={`font-bold text-sm ${statementData.netProfitWithHidden < 0 ? 'text-error' : 'text-success'}`}>฿{statementData.netProfitWithHidden?.toLocaleString()}</span>
                                        </div>                                 
                                    </div>
                                </div>
                            ) : (
                                /* Summary - Desktop */
                                <div className="grid grid-cols-5 gap-2 mb-4">                                    
                                    <div className="bg-green-900/20 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">ยอดบัญชีคงเหลือ</div>
                                        <div className="font-bold text-lg text-success">฿{statementData.bankBalance?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">ยอดเงินสดคงเหลือ</div>
                                        <div className="font-bold text-lg text-info">฿{statementData.cashBalance?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-primary/10 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">ยอดเงินคงเหลือทั้งหมด</div>
                                        <div className="font-bold text-lg text-primary">฿{statementData.balance?.toLocaleString()}</div>
                                    </div>
                                     <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">เงินตั้งต้น</div>
                                        <div className="font-bold text-lg text-info">฿{statementData.startingBalance?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">กระแสเงินสดสุทธิ</div>
                                        <div className={`font-bold text-lg ${statementData.netChange < 0 ? 'text-error' : 'text-success'}`}>฿{statementData.netChange?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-success/10 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">รายรับรวม</div>
                                        <div className="font-bold text-lg text-success">฿{statementData.totalIncome?.toLocaleString()}</div>
                                    </div>                                    
                                    <div className="bg-error/10 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">รายจ่ายรวม</div>
                                        <div className="font-bold text-lg text-error">฿{statementData.totalCost?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-secondary/10 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">กำไรสุทธิ</div>
                                        <div className={`font-bold text-lg ${statementData.netProfit < 0 ? 'text-error' : 'text-success'}`}>฿{statementData.netProfit?.toLocaleString()}</div>
                                    </div>                                    
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">ยอดขายรวม</div>
                                        <div className="font-bold text-lg text-warning">฿{statementData.totalSales?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">ส่วนต่างรวม (เงินขาด/เกิน)</div>
                                        <div className="font-bold text-lg text-base-content">฿{statementData.hiddenCost?.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">รายจ่ายรวม (รวม เงินขาด/เกิน)</div>
                                        <div className="font-bold text-lg text-error">฿{statementData.totalCostWithHidden?.toLocaleString()}</div>
                                    </div>                                    
                                    <div className="bg-base-200 rounded-lg p-2 text-center">
                                        <div className="text-xs text-base-content/70">กำไรสุทธิ (รวม เงินขาด/เกิน)</div>
                                        <div className={`font-bold text-lg ${statementData.netProfitWithHidden < 0 ? 'text-error' : 'text-success'}`}>฿{statementData.netProfitWithHidden?.toLocaleString()}</div>
                                    </div>                                   
                                </div>
                            )}
                            {/* Daily Statements */}
                            {isMobile ? (
                                <div className="space-y-3">
                                    {[...(statementData.dailyStatements ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map((d, idx) => (
                                        <div key={idx} className="rounded-xl border border-base-300 overflow-hidden shadow-sm">
                                            {/* Header */}
                                            <div className="flex justify-between items-center bg-white-300 px-3 py-2">
                                                <span className="font-bold text-sm">{d.date}</span>
                                                <span className="text-xs font-semibold">คงเหลือ: <span className="text-secondary">฿{d.balance?.toLocaleString()}</span></span>
                                            </div>

                                            {/* กลุ่ม Bank */}
                                            <div className="bg-info/10 px-3 py-2">
                                                <div className="text-xs font-bold text-info mb-1">🏦 เงินในบัญชี</div>
                                                <div className="grid grid-cols-3 gap-1 text-xs">
                                                    <div>
                                                        <div className="text-base-content/60">คงเหลือ</div>
                                                        <div className="font-bold text-info">฿{d.bankBalance?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายรับ</div>
                                                        <div className="font-bold text-success">฿{d.bankIncome?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายจ่าย</div>
                                                        <div className="font-bold text-error">฿{d.bankCost?.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* กลุ่ม Cash */}
                                            <div className="bg-warning/10 px-3 py-2">
                                                <div className="text-xs font-bold text-warning mb-1">💵 เงินสด</div>
                                                <div className="grid grid-cols-3 gap-1 text-xs">
                                                    <div>
                                                        <div className="text-base-content/60">คงเหลือ</div>
                                                        <div className="font-bold text-info">฿{d.cashBalance?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายรับ</div>
                                                        <div className="font-bold text-success">฿{d.cashIncome?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายจ่าย</div>
                                                        <div className="font-bold text-error">฿{d.cashCost?.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* สรุป */}
                                            <div className="bg-white-200 px-3 py-2">
                                                <div className="grid grid-cols-3 gap-1 text-xs mb-1">
                                                    <div>
                                                        <div className="text-base-content/60">ยอดขาย</div>
                                                        <div className="font-bold text-warning">฿{d.sales?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายรับรวม</div>
                                                        <div className="font-bold text-success">฿{d.totalIncome?.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-base-content/60">รายจ่ายรวม</div>
                                                        <div className="font-bold text-error">฿{d.totalCost?.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between text-xs pt-1 border-t border-base">
                                                    <span>ส่วนต่าง: <span className="font-bold">{d.difference}</span></span>
                                                    <span>กำไร: <span className={`font-bold ${d.profit < 0 ? 'text-error' : 'text-info'}`}>฿{d.profit?.toLocaleString()}</span></span>
                                                </div>
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
                                                {/* กลุ่ม Bank - พื้นหลังฟ้า */}
                                                <th className="text-right bg-info/15">ยอดคงเหลือ Bank</th>
                                                <th className="text-right bg-info/15">รายรับบัญชี</th>
                                                <th className="text-right bg-info/15">รายจ่าย (โอนจ่าย)</th>
                                                {/* กลุ่ม Cash - พื้นหลังเหลือง */}
                                                <th className="text-right bg-warning/15">ยอดคงเหลือ Cash</th>
                                                <th className="text-right bg-warning/15">รายรับเงินสด</th>
                                                <th className="text-right bg-warning/15">รายจ่าย (เงินสด)</th>
                                                {/* ยอดคงเหลือรวม - พื้นหลังม่วง */}
                                                <th className="text-right bg-secondary/15">ยอดคงเหลือ</th>
                                                {/* สรุป - พื้นหลังตามความหมาย */}
                                                <th className="text-right bg-error/10">ยอดขาย</th>
                                                <th className="text-right bg-success/10">รายรับ</th>
                                                <th className="text-right">ส่วนต่าง</th>
                                                <th className="text-right bg-error/10">รายจ่าย</th>
                                                <th className="text-right bg-info/10">กำไร</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statementData.dailyStatements?.map((d, idx) => (
                                                <tr key={idx}>
                                                    <td>{d.date}</td>
                                                    <td className="text-right bg-info/10 text-info">{d.bankBalance?.toLocaleString()}</td>
                                                    <td className="text-right bg-info/10 text-success">{d.bankIncome?.toLocaleString()}</td>
                                                    <td className="text-right bg-info/10 text-error">{d.bankCost?.toLocaleString()}</td>
                                                    <td className="text-right bg-warning/10 text-info">{d.cashBalance?.toLocaleString()}</td>
                                                    <td className="text-right bg-warning/10 text-success">{d.cashIncome?.toLocaleString()}</td>
                                                    <td className="text-right bg-warning/10 text-error">{d.cashCost?.toLocaleString()}</td>
                                                    <td className="text-right bg-secondary/10">{d.balance?.toLocaleString()}</td>
                                                    <td className="text-right text-warning bg-warning/5">{d.sales?.toLocaleString()}</td>
                                                    <td className="text-right text-success bg-success/5">{d.totalIncome?.toLocaleString()}</td>
                                                    <td className="text-right">{d.difference}</td>
                                                    <td className="text-right text-error bg-error/5">{d.totalCost?.toLocaleString()}</td>
                                                    <td className={`text-right bg-info/5 ${d.profit < 0 ? 'text-error' : 'text-info'}`}>{d.profit?.toLocaleString()}</td>
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
            {/* Go to Top Button */}
            {showGoTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 btn btn-circle btn-primary shadow-lg"
                    aria-label="กลับขึ้นด้านบน"
                >
                    ▲
                </button>
            )}
        </div>
    );
};

export default Statement;