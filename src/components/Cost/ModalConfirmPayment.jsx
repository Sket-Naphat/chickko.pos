import { getCostCategories } from "../../services/costService";
import { useRef, useState, useId } from "react";

export default function ModalConfirmPayment({ onConfirm, item }) {
    const num_costPriceId = useId();
    const dt_purchaseDateId = useId();
    const ddl_costCategoryId = useId();
    const dialogRef = useRef(null);
    const txt_costDescriptionId = useId();
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [costId, setCostId] = useId();
    const [costCategory, setCostCategory] = useState([]);
    const [costPrice, setCostPrice] = useState(item.costPrice);
    const [purchaseDate, setPurchaseDate] = useState(item.costDate);
    const [categoryId, setCategoryId] = useState(item.costCategory.id);
    const [costDescription, setCostDescription] = useState(item.costDescription);

    // เปิด modal เมื่อมีการคลิกปุ่ม
    const openModal = (item) => async (e) => {

        e.preventDefault();
        if (isSaving) return; // ป้องกันการเปิด modal ซ้ำในขณะที่กำลังบันทึก

        const costCategory = await getCostCategories();
        setCostCategory(costCategory);

        dialogRef.current?.showModal();
    }
    

    const closeModal = () => dialogRef.current?.close();
    const handleSubmit = async () => {
        if (isSaving) return;
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        setIsSaving(true);
        const payload = {
            CostID: item.id || costId, // ใช้ ID ของรายการที่ต้องการจ่าย
            CostPrice: Number(costPrice || 0),
            PurchaseDate: purchaseDate,
            PurchaseTime: new Date().toISOString("HH:mm:ss"), // ใช้เวลาปัจจุบัน
            CostCategoryID: categoryId,
            CostDescription: costDescription.trim(),
            IsPurchase: true // ยืนยันการจ่ายเงิน
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
            //await api.post("/cost/CreateCost", payload);
            alert(payload);
            onCreated?.(); // ให้ parent ไป refresh list ถ้าต้องการ

            setAlert("บันทึกสำเร็จ!", "success");
            resetForm();
            closeModal();

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
        setCostId(item.costId);
        setCostPrice(item.costPrice || "");
        setCategoryId(item.costCategory.id || "");
        setCostDescription(item.costDescription || "");
        setPurchaseDate(item.costDate || new Date().toISOString().slice(0, 10));
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
            <button className="btn btn-sm btn-primary" onClick={openModal(item)}>
                จ่าย
            </button>
            {/* Modal Dialog */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">

                    <h3 className="font-bold text-lg">รายการ {item.costDescription}</h3>

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
                                <span className="label-text" htmlFor={dt_purchaseDateId}>
                                    วันที่จ่ายเงิน
                                </span>
                            </div>
                            <input
                                id={dt_purchaseDateId}
                                type="date"
                                className="input input-bordered"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
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
                                    รายละเอียดการซื้อ
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

                        <div className="modal-action md:grid-span-2 lg:grid-span-3">
                            <button
                                type="submit"
                                className={`btn btn-success ${isSaving ? "loading" : ""}`}
                                disabled={isSaving}
                            >
                                {isSaving ? "กำลังบันทึก..." : "✅ ยืนยันการจ่าย"}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={closeModal}
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
