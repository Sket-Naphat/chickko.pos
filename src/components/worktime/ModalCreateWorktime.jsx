import { useRef, useState } from "react";
import { api } from "../../lib/api";

export default function ModalCreateWorktime({ onCreated, showToast }) {
    const dialogRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [employees, setEmployees] = useState([]);

    const today = new Date().toISOString().slice(0, 10);
    const [employeeID, setEmployeeID] = useState("");
    const [workDate, setWorkDate] = useState(today);
    const [timeClockIn, setTimeClockIn] = useState("");
    const [timeClockOut, setTimeClockOut] = useState("");

    const openModal = async () => {
        try {
            setIsLoadingModal(true);
            const res = await api.get("/auth/GetAllEmployee");
            setEmployees(res.data ?? []);
            if (!employeeID && res.data?.length > 0) {
                setEmployeeID(String(res.data[0].userId));
            }
        } catch (err) {
            console.error("โหลดพนักงานไม่ได้:", err);
        } finally {
            setIsLoadingModal(false);
            dialogRef.current?.showModal();
        }
    };

    const closeModal = () => {
        dialogRef.current?.close();
    };

    const handleSubmit = async () => {
        if (!employeeID || !workDate || !timeClockIn || !timeClockOut) {
            showToast?.("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
            return;
        }
        setIsSaving(true);
        try {
            const toTimeWithSeconds = (t) => t.length === 5 ? `${t}:00` : t;

            const res = await api.post("/worktime/createWorktime", {
                EmployeeID: Number(employeeID),
                WorkDate: workDate,
                TimeClockIn: toTimeWithSeconds(timeClockIn),
                TimeClockOut: toTimeWithSeconds(timeClockOut),
            });
            showToast?.(res.data, "success");
            closeModal();
            onCreated?.();
        } catch (err) {
            console.error("บันทึกชั่วโมงทำงานไม่สำเร็จ:", err);
            showToast?.("เกิดข้อผิดพลาดในการบันทึก", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <button
                className="btn btn-primary btn-sm shadow-md"
                onClick={openModal}
                disabled={isLoadingModal}
            >
                {isLoadingModal ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : (
                    <>➕ เพิ่มชั่วโมงทำงาน</>
                )}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box bg-gradient-to-br from-base-100 to-base-200 border-2 border-primary/20 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-primary/15 rounded-xl">
                            <span className="text-2xl">🕐</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-primary">เพิ่มชั่วโมงทำงาน</h3>
                            <p className="text-xs text-base-content/60">บันทึกเวลาเข้า-ออกงานของพนักงาน</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* พนักงาน */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium text-sm">👤 พนักงาน</span>
                            </label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={employeeID}
                                onChange={(e) => setEmployeeID(e.target.value)}
                            >
                                <option value="" disabled>-- เลือกพนักงาน --</option>
                                {employees.map((emp) => (
                                    <option key={emp.userId} value={emp.userId}>
                                        {emp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* วันที่ */}
                        <div className="form-control">
                            <label className="label pb-1">
                                <span className="label-text font-medium text-sm">📅 วันที่ทำงาน</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered input-sm w-full"
                                value={workDate}
                                onChange={(e) => setWorkDate(e.target.value)}
                            />
                        </div>

                        {/* เวลาเข้า-ออก */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label pb-1">
                                    <span className="label-text font-medium text-sm">🟢 เวลาเข้างาน</span>
                                </label>
                                <input
                                    type="time"
                                    className="input input-bordered input-sm w-full"
                                    value={timeClockIn}
                                    onChange={(e) => setTimeClockIn(e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label pb-1">
                                    <span className="label-text font-medium text-sm">🔴 เวลาออกงาน</span>
                                </label>
                                <input
                                    type="time"
                                    className="input input-bordered input-sm w-full"
                                    value={timeClockOut}
                                    onChange={(e) => setTimeClockOut(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="modal-action gap-2 mt-6">
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={closeModal}
                            disabled={isSaving}
                        >
                            ยกเลิก
                        </button>
                        <button
                            className="btn btn-primary btn-sm shadow-md"
                            onClick={handleSubmit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>✅ บันทึก</>
                            )}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop bg-black/40" onClick={closeModal} />
            </dialog>
        </>
    );
}