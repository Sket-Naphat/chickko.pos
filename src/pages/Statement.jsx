import { useRef, useState, useEffect } from 'react';
// import { api } from '../lib/api';
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
    const hideTimer = useRef(null); // ref เก็บ timer ของ toast เพื่อ clear ก่อน set ใหม่
    const navigate = useNavigate();

    // ดึงรายการรายรับทุกครั้งที่ refreshKey เปลี่ยน (รวมถึงโหลดหน้าครั้งแรก)
    useEffect(() => {
        
    }, [refreshKey]);

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
                    
                </div>
            </div>
        </div>
    );
};

export default Statement;