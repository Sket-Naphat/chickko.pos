import { useRef, useState, useId, useEffect } from "react";
import { api } from "../../lib/api";

export default function NewCostModal({ onCreated }) {
    const dialogRef = useRef(null); // Reference to the dialog element
    const num_costPriceId = useId();
    const dt_costDateId = useId();
    const ddl_costCategoryId = useId();
    const txt_costDescriptionId = useId();
    const chk_isPurchaseId = useId();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [costPrice, setCostPrice] = useState("");
    const [costDate, setCostDate] = useState("");
    const [costDescription, setCostDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [costCategory, setCostCategory] = useState([]);
    const [isPurchase, setIsPurchase] = useState(true); // Default to checked

    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState(""); // "success" หรือ "error"

    useEffect(() => {
        // default วันที่วันนี้
        setCostDate(new Date().toISOString().slice(0, 10));
    }, []);
    // เปิด/ปิด dialog
    //const open = () => dialogRef.current?.showModal();
    // เปิด modal + โหลดหมวดหมู่
    const open = async () => {
        try {
            setIsLoadingModal(true);
            setAlertMessage("");
            setAlertType("");
            const res = await api.get("/cost/GetCostCategoryList"); // ✅ path ตาม Controller คุณ
            const items = res.data ?? [];

            setCostCategory(items);

            if (!categoryId && items.length > 0) {
                setCategoryId(String(items[0].costCategoryID));
            }
        } catch (err) {
            console.error("โหลด costCategory ไม่ได้:", err);
        }
        finally {
            setIsLoadingModal(false);
        }

        // เปิด dialog หลังจากจัดการ state แล้ว
        dialogRef.current?.showModal();
    };

    const close = () => dialogRef.current?.close();

    const handleSubmit = async (e) => {
        if (isSaving) return;
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        setIsSaving(true);
        const payload = {
            CostPrice: Number(costPrice || 0),
            CostDate: costDate,
            CostCategoryID: categoryId,
            CostDescription: costDescription.trim(),
            IsPurchase: isPurchase
        };
        if (!payload.CostPrice || payload.CostPrice <= 0) {
            setIsSaving(false);
            return alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
        }
        if (!payload.CostDate) {
            setIsSaving(false);
            return alert("กรุณาเลือกวันที่");
        }
        if (payload.CostCategoryID === "" || payload.CostCategoryID === null) {
            setIsSaving(false);
            return alert("กรุณาเลือกหมวดหมู่");
        }
        try {
            await api.post("/cost/CreateCost", payload);
            onCreated?.(); // ให้ parent ไป refresh list ถ้าต้องการ

            setAlert("บันทึกสำเร็จ!", "success");
            resetForm();
            close();


            //close();
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            setAlert(apiMsg, "error");
        } finally {
            setIsSaving(false);
            setTimeout(() => {
                setAlertMessage("");
                setAlertType("");
            }, 2500);
        }
    };

    const setAlert = (message, type) => {
        setAlertMessage(message);
        setAlertType(type); // "success" | "error"
    };

    const resetForm = () => {
        setCostPrice("");
        setCategoryId("");
        setCostDescription("");
        setCostDate(new Date().toISOString().slice(0, 10));
        setIsPurchase(true);
    };

    const showAlert = () => {
        if (!alertMessage) return null;
        const alertTypeClass = alertType === "success" ? "alert alert-success" : "alert alert-error";
        return (
            <div className="toast toast-top toast-center z-[1000] w-4/5 py-16">
                <div role="alert" className={alertTypeClass} aria-live="polite">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        {alertType === "success" ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        )}
                    </svg>
                    <span>{alertMessage}</span>
                </div>
            </div>
        );
    };

    return (
        <>
            {showAlert()}
            <button className="btn btn-success text-white" onClick={open} disabled={isLoadingModal}>
                {isLoadingModal ? "กำลังโหลด..." : "เพิ่มค่าใช้จ่าย"}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">

                    <h3 className="font-bold text-lg">สร้างรายการค่าใช้จ่ายใหม่</h3>

                    <form
                        className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                        onSubmit={handleSubmit}
                    >
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text" htmlFor={num_costPriceId}>
                                    จำนวนเงิน (บาท)
                                </span>
                            </div>
                            <input
                                id={num_costPriceId}
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered"
                                placeholder="เช่น 120.00"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                required
                            />
                        </label>

                        <label className="form-control">
                            <div className="label">
                                <span className="label-text" htmlFor={dt_costDateId}>
                                    วันที่
                                </span>
                            </div>
                            <input
                                id={dt_costDateId}
                                type="date"
                                className="input input-bordered"
                                value={costDate}
                                onChange={(e) => setCostDate(e.target.value)}
                                required
                            />
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={ddl_costCategoryId}>
                                    ประเภท
                                </span> &nbsp;
                            </div>
                            <select
                                id={ddl_costCategoryId}
                                className="select select-bordered"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกประเภทค่าใช้จ่าย —</option>
                                {costCategory.map((category) => (
                                    <option
                                        key={category.costCategoryID}
                                        value={String(category.costCategoryID)}
                                    >
                                        {category.description}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_costDescriptionId}>
                                    บันทึกเพิ่มเติม (ถ้ามี)
                                </span>&nbsp;
                            </div>
                            <textarea
                                id={txt_costDescriptionId}
                                className="textarea textarea-bordered"
                                rows={3}
                                placeholder="หมายเหตุ"
                                value={costDescription}
                                onChange={(e) => setCostDescription(e.target.value)}
                            />
                        </label>
                        <label className="form-control md:col-span-2" htmlFor={chk_isPurchaseId}>
                            <input
                                id={chk_isPurchaseId}
                                type="checkbox"
                                checked={isPurchase}
                                className="checkbox checkbox-success"
                                onChange={(e) => setIsPurchase(e.target.checked)}
                            />
                            &nbsp;
                            <span>จ่ายเงินแล้ว</span>
                        </label>

                        <div className="modal-action md:grid-span-2 lg:grid-span-3">
                            <button
                                type="submit"
                                className={`btn btn-success ${isSaving ? "loading" : ""}`}
                                disabled={isSaving}
                            >
                                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={close}
                                disabled={isSaving}
                            >
                                ปิด
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
}
