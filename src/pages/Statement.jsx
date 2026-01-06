import { useRef, useState, useId, useEffect } from 'react';
import { api } from '../lib/api';
import Cookies from 'js-cookie';
import React from 'react';
import Toast from '../components/ui/Toast';

// Function component สำหรับ Modal เพิ่มโน๊ตรายการ
function ModalNewStatementNote({ onCreated, showToast }) {
    const dialogRef = useRef(null);
    const dt_noteDateId = useId();
    const num_noteAmountId = useId();
    const ddl_incomeTypeId = useId();
    const txt_noteDescriptionId = useId();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [noteDate, setNoteDate] = useState("");
    const [noteAmount, setNoteAmount] = useState("");
    const [incomeTypeId, setIncomeTypeId] = useState("");
    const [incomeTypes, setIncomeTypes] = useState([]);
    const [noteDescription, setNoteDescription] = useState("");
    
    const authData = Cookies.get("authData") 
        ? JSON.parse(Cookies.get("authData")) 
        : null;

    useEffect(() => {
        // ตั้งค่าวันที่เป็นวันนี้
        setNoteDate(new Date().toISOString().slice(0, 10));
    }, []);

    const openModal = async () => {
        try {
            setIsLoadingModal(true);
            const res = await api.get("/statement/getIncometype");
            
            // แปลง Object เป็น Array
            const dataArray = res.data.data  ? Object.values(res.data.data) : [];
            setIncomeTypes(dataArray);
        } catch (err) {
            console.error("โหลด income types ไม่ได้:", err);
            setIncomeTypes([]);
        } finally {
            setIsLoadingModal(false);
            if (dialogRef.current) dialogRef.current.showModal();
        }
    };

    const closeModal = () => {
        if (dialogRef.current) dialogRef.current.close();
    };

    const handleSubmit = async (e) => {
        if (isSaving) return;
        e.preventDefault();
        setIsSaving(true);

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8); // HH:mm:ss format

        const payload = {
            IncomeDate: noteDate,
            IncomeValue: Number(noteAmount || 0),
            IncomeTime: currentTime,
            IncomeTypeId: Number(incomeTypeId),
            UserId: authData?.userId || null,
            IncomeDescription: noteDescription.trim()
        };

        // Validation
        if (!payload.IncomeDate) {
            setIsSaving(false);
            showToast?.("กรุณาเลือกวันที่", "error", 2000);
            return;
        }
        if (!payload.IncomeValue || payload.IncomeValue === 0) {
            setIsSaving(false);
            showToast?.("กรุณากรอกจำนวนเงิน", "error", 2000);
            return;
        }
        if (!payload.IncomeTypeId) {
            setIsSaving(false);
            showToast?.("กรุณาเลือกประเภทเงินได้", "error", 2000);
            return;
        }
        if (!payload.IncomeDescription) {
            setIsSaving(false);
            showToast?.("กรุณากรอกรายละเอียด", "error", 2000);
            return;
        }

        try {
            await api.post("/statement/createincome", payload);
            showToast?.("✅ เพิ่มรายการสำเร็จ!", "success", 2000);
            onCreated?.();
            resetForm();
            closeModal();
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            showToast?.(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setNoteDate(new Date().toISOString().slice(0, 10));
        setNoteAmount("");
        setIncomeTypeId("");
        setNoteDescription("");
    };

    return (
        <>
            <button 
                className="btn btn-warning btn-sm text-white" 
                onClick={openModal}
                disabled={isLoadingModal}
            >
                {isLoadingModal ? "⏳ กำลังโหลด..." : "✏️ เพิ่มรายการใหม่"}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-lg max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4">✏️ เพิ่มโน๊ตรายการงบการเงิน</h3>

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        {/* วันที่ */}
                        <div className="form-control">
                            <label className="label" htmlFor={dt_noteDateId}>
                                <span className="label-text">วันที่</span>
                            </label>
                            <input
                                id={dt_noteDateId}
                                type="date"
                                className="input input-bordered w-full"
                                value={noteDate}
                                onChange={(e) => setNoteDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* จำนวนเงิน */}
                        <div className="form-control">
                            <label className="label" htmlFor={num_noteAmountId}>
                                <span className="label-text">จำนวนเงิน (บาท)</span>
                            </label>
                            <input
                                id={num_noteAmountId}
                                type="number"
                                step="0.01"
                                className="input input-bordered w-full"
                                placeholder="เช่น 1500.50"
                                value={noteAmount}
                                onChange={(e) => setNoteAmount(e.target.value)}
                                required
                            />
                        </div>

                        {/* ประเภทเงินได้ */}
                        <div className="form-control">
                            <label className="label" htmlFor={ddl_incomeTypeId}>
                                <span className="label-text">ประเภทเงินได้</span>
                            </label>
                            <select
                                id={ddl_incomeTypeId}
                                className="select select-bordered w-full bg-base-100"
                                value={incomeTypeId}
                                onChange={(e) => setIncomeTypeId(e.target.value)}
                                required
                            >
                                <option value="">เลือกประเภทเงินได้</option>
                                {incomeTypes.map((type) => (
                                    <option
                                        key={type.incomeTypeId}
                                        value={type.incomeTypeId}
                                    >
                                        {type.incomeTypeName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* รายละเอียด */}
                        <div className="form-control">
                            <label className="label" htmlFor={txt_noteDescriptionId}>
                                <span className="label-text">รายละเอียด</span>
                            </label>
                            <textarea
                                id={txt_noteDescriptionId}
                                className="textarea textarea-bordered w-full"
                                rows={3}
                                placeholder="กรอกรายละเอียดหรือหมายเหตุ..."
                                value={noteDescription}
                                onChange={(e) => setNoteDescription(e.target.value)}
                                required
                            />
                        </div>

                        {/* ปุ่ม */}
                        <div className="modal-action mt-4">
                            <button
                                type="submit"
                                className={`btn btn-warning text-white ${isSaving ? "loading" : ""}`}
                                disabled={isSaving}
                            >
                                {isSaving ? "⏳ กำลังบันทึก..." : "💾 ยืนยัน"}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={closeModal}
                                disabled={isSaving}
                            >
                                ❌ ปิด
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
}

// Main Statement Component
const Statement = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const hideTimer = useRef(null);

    const handleNoteCreated = () => {
        setRefreshKey(prev => prev + 1);
        // TODO: โหลดข้อมูลใหม่
    };

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
                    <div className="flex-shrink-0">

                    </div>
                </div>
            </div>

            {/* Unpaid Expenses Card */}
            <div className="card bg-base-100 shadow-xl border-2 border-warning/30 hover:border-warning/50 transition-all duration-300 rounded-xl overflow-hidden">
                <div className="card-header bg-gradient-to-r from-warning/10 to-warning/5 border-b border-warning/20 p-2 md:p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-warning/20 rounded-lg">
                                <span className="text-base">⚠️</span>
                            </div>
                            <div>
                                <h2 className="text-sm md:text-base font-bold text-warning">
                                    โน๊ตรายการงบการเงิน
                                </h2>
                            </div>
                        </div>
                        <ModalNewStatementNote 
                            onCreated={handleNoteCreated}
                            showToast={showToast}
                        />
                    </div>
                </div>
                <div className="card-body p-3 md:p-4 bg-gradient-to-b from-base-100 to-base-50">
            
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
                    
                </div>
            </div>
        </div>
    );
};

export default Statement;