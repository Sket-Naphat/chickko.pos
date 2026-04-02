import React, { useEffect, useState, useId } from 'react';
import { api } from '../../lib/api';
import Cookies from 'js-cookie';


// import { useRef } from 'react';
// import { toThaiDateString } from '../../lib/dateUtils';

export default function StatementIncomeEditModal({ open, onClose, onUpdate, income, incomeTypes = [], showToast }) {
    const authData = Cookies.get('authData') ? JSON.parse(Cookies.get('authData')) : null;
    const dt_incomeDateId = useId();
    const num_incomeValueId = useId();
    const ddl_incomeTypeId = useId();
    const txt_incomeDescriptionId = useId();
    const tm_incomeTimeId = useId();

    const [incomeDate, setIncomeDate] = useState("");
    const [incomeValue, setIncomeValue] = useState("");
    const [incomeTypeId, setIncomeTypeId] = useState("");
    const [incomeDescription, setIncomeDescription] = useState("");
    const [incomeTime, setIncomeTime] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // ฟังก์ชันลบ income
    const handleDelete = async () => {
        if (!income?.incomeId) return;
        setIsDeleting(true);
        try {
            const res = await api.delete(`/statement/DeleteIncome`, { params: { incomeId: income.incomeId } });
            if (res.status === 200) {
                showToast && showToast('ลบรายการสำเร็จ', 'success');
                setShowDeleteConfirm(false);
                onUpdate && onUpdate();
            } else {
                const msg = res.data && res.data.message ? res.data.message : 'เกิดข้อผิดพลาดในการลบข้อมูล';
                showToast && showToast(msg, 'error');
            }
        } catch (err) {
            let msg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ API';
            if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            showToast && showToast(msg, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if (income) {
            setIncomeDate(income.incomeDate || "");
            setIncomeValue(income.incomeValue?.toString() || "");
            setIncomeTypeId(income.incomeTypeId?.toString() || "");
            setIncomeDescription(income.incomeDescription || "");
            setIncomeTime(income.incomeTime || "");
        }
    }, [income, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const normalizedTime = /^\d{2}:\d{2}$/.test(incomeTime)
                ? `${incomeTime}:00`
                : incomeTime;

            const payload = {
                IncomeId: income?.incomeId,
                IncomeDate: incomeDate,
                IncomeTime: normalizedTime,
                IncomeValue: Number(incomeValue),
                IncomeTypeId: Number(incomeTypeId),
                IncomeDescription: incomeDescription,
                UserId: authData?.userId || null
            };
            const res = await api.put('/statement/UpdateIncome', payload);
            if (res.status === 200) {
                showToast && showToast('บันทึกการแก้ไขสำเร็จ', 'success');
                onUpdate && onUpdate();
            } else {
                const msg = res.data && res.data.message ? res.data.message : 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล';
                showToast && showToast(msg, 'error');
                onUpdate && onUpdate();
            }
        } catch (err) {
            let msg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ API';
            if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
            } else if (err.message) {
                msg = err.message;
            }
            showToast && showToast(msg, 'error');
            onUpdate && onUpdate();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`modal modal-open ${open ? '' : 'hidden'} overflow-y-auto`} style={{ maxHeight: '100vh' }}>
            <div className="modal-box w-11/12 max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4">✏️ แก้ไขรายการงบการเงิน</h3>
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
                    <div className="modal-action mt-4 flex gap-2 items-center justify-between">
                        {/* ปุ่มลบฝั่งซ้าย */}
                        <button
                            type="button"
                            className="btn btn-outline btn-error mr-auto"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSaving || isDeleting}
                        >
                            🗑️ ลบ
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className={`btn btn-info text-white ${isSaving ? "loading" : ""}`}
                                disabled={isSaving || isDeleting}
                            >
                                {isSaving ? "⏳ กำลังอัพเดท..." : "💾 อัพเดท"}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={onClose}
                                disabled={isSaving || isDeleting}
                            >
                                ❌ ปิด
                            </button>
                        </div>
                    </div>
                    {/* Modal ยืนยันการลบ */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full">
                                <h4 className="font-bold text-lg mb-2 text-error">ยืนยันการลบ</h4>
                                <p className="mb-4">คุณต้องการลบรายการนี้ใช่หรือไม่?</p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        className={`btn btn-error ${isDeleting ? 'loading' : ''}`}
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}