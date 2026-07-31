import React, { useRef, useState, useId, useEffect } from 'react';
import { api } from '../../lib/api';
import Cookies from 'js-cookie';

// ปุ่ม + Modal สำหรับเพิ่มรายการงบการเงินใหม่
export default function StatementIncomeAddButton({ onCreated, showToast }) {
    const dialogRef = useRef(null);
    const dt_incomeDateId = useId();
    const num_incomeValueId = useId();
    const ddl_incomeTypeId = useId();
    const txt_incomeDescriptionId = useId();
    const tm_incomeTimeId = useId();

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [incomeDate, setIncomeDate] = useState("");
    const [incomeValue, setIncomeValue] = useState("");
    const [incomeTypeId, setIncomeTypeId] = useState("1");
    const [incomeTypes, setIncomeTypes] = useState([]);
    const [incomeDescription, setIncomeDescription] = useState("");
    const [incomeTime, setIncomeTime] = useState("");

    const authData = Cookies.get("authData") 
        ? JSON.parse(Cookies.get("authData")) 
        : null;

    useEffect(() => {
        const now = new Date();
        setIncomeDate(now.toISOString().slice(0, 10));
        setIncomeTime(now.toTimeString().slice(0, 5));
        setIncomeTypeId("1");
    }, []);

    const openModal = async () => {
        try {
            setIsLoadingModal(true);
            const res = await api.get("/statement/getIncometype");
            const dataArray = res.data.data  ? Object.values(res.data.data) : [];
            setIncomeTypes(dataArray);
            setIncomeTypeId("1"); // default select incomeTypeId = 1 ทุกครั้งที่เปิด modal
        } catch {
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
        const payload = {
            IncomeDate: incomeDate,
            IncomeValue: Number(incomeValue || 0),
            IncomeTime: incomeTime.length === 5 ? incomeTime + ":00" : incomeTime,
            IncomeTypeId: Number(incomeTypeId),
            UserId: authData?.userId || null,
            IncomeDescription: incomeDescription.trim()
        };
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
        try {
            await api.post("/statement/createincome", payload);
            showToast?.("✅ เพิ่มรายการสำเร็จ!", "success", 2000);
            onCreated?.();
            resetForm();
            closeModal();
        } catch (err) {
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            showToast?.(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        const now = new Date();
        setIncomeDate(now.toISOString().slice(0, 10));
        setIncomeValue("");
        setIncomeTypeId("1");
        setIncomeDescription("");
        setIncomeTime(now.toTimeString().slice(0, 5));
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
                        <div className="form-control">
                            <label className="label" htmlFor={dt_incomeDateId}>
                                <span className="label-text">วันที่</span>
                            </label>
                            <input
                                id={dt_incomeDateId}
                                type="date"
                                className="input input-bordered w-full"
                                value={incomeDate}
                                onChange={(e) => setIncomeDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor={tm_incomeTimeId}>
                                <span className="label-text">เวลา</span>
                            </label>
                            <input
                                id={tm_incomeTimeId}
                                type="time"
                                className="input input-bordered w-full"
                                value={incomeTime}
                                onChange={(e) => setIncomeTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control">
                            <label className="label" htmlFor={num_incomeValueId}>
                                <span className="label-text">จำนวนเงิน (บาท)</span>
                            </label>
                            <input
                                id={num_incomeValueId}
                                type="number"
                                step="0.01"
                                className="input input-bordered w-full"
                                placeholder="เช่น 1500.50"
                                value={incomeValue}
                                onChange={(e) => setIncomeValue(e.target.value)}
                                required
                            />
                        </div>
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
                        <div className="form-control">
                            <label className="label" htmlFor={txt_incomeDescriptionId}>
                                <span className="label-text">รายละเอียด</span>
                            </label>
                            <textarea
                                id={txt_incomeDescriptionId}
                                className="textarea textarea-bordered w-full"
                                rows={3}
                                placeholder="กรอกรายละเอียดหรือหมายเหตุ..."
                                value={incomeDescription}
                                onChange={(e) => setIncomeDescription(e.target.value)}
                            />
                        </div>
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