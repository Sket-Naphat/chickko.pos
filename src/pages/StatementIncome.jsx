import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import StatementIncomeAddButton from '../components/Statement/StatementIncomeAddButton';
import StatementIncomeEditModal from '../components/Statement/StatementIncomeEditModal';
import { toThaiDateString } from '../lib/dateUtils';

const StatementIncome = () => {
    const [incomeList, setIncomeList] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editIncome, setEditIncome] = useState(null);
    const [incomeTypes, setIncomeTypes] = useState([]);
        // callback สำหรับ refresh ข้อมูลหลังเพิ่มรายการใหม่
        const handleNoteCreated = () => {
            fetchIncomes();
        };

        // แสดง toast พร้อม auto-hide ตาม duration
        const showToast = (message, type = "success", duration = 2000) => {
            setToast({ show: true, message, type });
            setTimeout(() => setToast((t) => ({ ...t, show: false })), duration);
        };
    const navigate = useNavigate();

    // State สำหรับ filter
    // ใช้ util toThaiDateString (UTC+7)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [dateFrom, setDateFrom] = useState(toThaiDateString(firstDay));
    const [dateTo, setDateTo] = useState(toThaiDateString(lastDay));

    // ดึงข้อมูล income ตามช่วงวันที่
    const fetchIncomes = async (from = dateFrom, to = dateTo) => {
        try {
            setIsLoadingList(true);
            const res = await api.get("/statement/getincome", {
                params: { dateFrom: from, dateTo: to }
            });
            const dataArray = res.data.data ? Object.values(res.data.data) : [];
            setIncomeList(dataArray);
        } catch (err) {
            console.error("โหลดรายการไม่ได้:", err);
            setIncomeList([]);
        } finally {
            setIsLoadingList(false);
        }
    };
    // ดึง incomeTypes สำหรับ modal edit
    const fetchIncomeTypes = async () => {
        try {
            const res = await api.get("/statement/getIncometype");
            const dataArray = res.data.data ? Object.values(res.data.data) : [];
            setIncomeTypes(dataArray);
        } catch {
            setIncomeTypes([]);
        }
    };
    useEffect(() => {
        fetchIncomes(dateFrom, dateTo);
        fetchIncomeTypes();
    }, []);

    // ฟังก์ชันค้นหา
    const handleSearch = (e) => {
        e.preventDefault();
        fetchIncomes(dateFrom, dateTo);
    };

    return (
        <div className="p-2 md:p-4 space-y-2 md:space-y-3 max-w-7xl mx-auto min-h-screen">
            {/* ปุ่มย้อนกลับอยู่ซ้ายบน + ปุ่มเพิ่มรายการใหม่ */}
            <div className="mb-2 flex items-center gap-2">
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/statement')}
                >
                    ⬅️ ย้อนกลับ
                </button>
                <StatementIncomeAddButton onCreated={handleNoteCreated} showToast={showToast} />
                <h2 className="text-base md:text-lg font-bold text-warning ml-2">
                    โน๊ตรายการงบการเงิน
                </h2>
            </div>
            {/* Filter Card */}
            <div className="card border border-warning/30 bg-base-50 shadow-sm mb-2">
                <form className="card-body p-3 flex flex-col md:flex-row md:items-end gap-2 md:gap-4" onSubmit={handleSearch}>
                    <div>
                        <label className="label label-text" htmlFor="dateFrom">จากวันที่</label>
                        <input
                            id="dateFrom"
                            type="date"
                            className="input input-bordered"
                            value={dateFrom}
                            max={dateTo}
                            onChange={e => setDateFrom(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label label-text" htmlFor="dateTo">ถึงวันที่</label>
                        <input
                            id="dateTo"
                            type="date"
                            className="input input-bordered"
                            value={dateTo}
                            min={dateFrom}
                            onChange={e => setDateTo(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-warning mt-4 md:mt-0">ค้นหา</button>
                </form>
            </div>
            {/* Toast แจ้งเตือน */}
            {toast.show && (
                <div className={`alert alert-${toast.type} mb-2`}>{toast.message}</div>
            )}

            
            <div className="card bg-base-100 shadow-xl border-2 border-warning/30 hover:border-warning/50 transition-all duration-300 rounded-xl overflow-hidden">
                <div className="card-body p-3 md:p-4 bg-gradient-to-b from-base-100 to-base-50">
                    {isLoadingList ? (
                        <div className="flex justify-center py-6">
                            <span className="loading loading-spinner loading-md text-warning"></span>
                        </div>
                    ) : incomeList.length === 0 ? (
                        <p className="text-center text-base-content/50 py-6 text-sm">ยังไม่มีรายการ</p>
                    ) : (
                        <>
                        {/* Desktop: Table */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="table table-sm w-full">
                                <thead>
                                    <tr>
                                        <th>วันที่</th>
                                        <th>เวลา</th>
                                        <th>ประเภท</th>
                                        <th>รายละเอียด</th>
                                        <th className="text-right">จำนวนเงิน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeList.map((item, idx) => (
                                        <tr key={item.incomeId ?? idx} className="hover">
                                            <td className="whitespace-nowrap">{item.incomeDate}</td>
                                            <td className="whitespace-nowrap">{item.incomeTime}</td>
                                            <td>{item.incomeTypeName}</td>
                                            <td>{item.incomeDescription}</td>
                                            <td className="text-right font-medium text-warning">
                                                {Number(item.incomeValue).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <button className="btn btn-xs btn-outline btn-info" onClick={() => { setEditIncome(item); setEditModalOpen(true); }}>
                                                    แก้ไข
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile: Card List */}
                        <div className="flex flex-col gap-3 md:hidden overflow-y-auto" style={{ maxHeight: '70vh' }}>
                            {incomeList.map((item, idx) => (
                                <div key={item.incomeId ?? idx} className="card border border-warning/30 bg-base-50 shadow-sm">
                                    <div className="card-body p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-warning">{item.incomeTypeName}</span>
                                            <span className="text-xs text-base-content/60">{item.incomeDate} {item.incomeTime}</span>
                                        </div>
                                        <div className="mb-1 text-sm text-base-content/80">{item.incomeDescription || <span className="text-base-content/40">-</span>}</div>
                                        <div className="text-right font-bold text-warning text-lg">
                                            {Number(item.incomeValue).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                            <button className="btn btn-xs btn-outline btn-info" onClick={() => { setEditIncome(item); setEditModalOpen(true); }}>
                                                แก้ไข
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>
            {/* Modal แก้ไขข้อมูล */}
            <StatementIncomeEditModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onUpdate={() => {
                    setEditModalOpen(false);
                    fetchIncomes();
                }}
                income={editIncome}
                incomeTypes={incomeTypes}
                showToast={showToast}
            />
        </div>
    );
};

export default StatementIncome;
