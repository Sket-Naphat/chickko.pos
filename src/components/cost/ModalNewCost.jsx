import { useRef, useState, useId, useEffect } from "react";
import { api } from "../../lib/api";
import { getCostCategories } from "../../services/costService";
import Cookies from "js-cookie";

export default function ModalNewCost({ onCreated, showToast }) {
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
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;

    useEffect(() => {
        // default วันที่วันนี้
        setCostDate(new Date().toISOString().slice(0, 10));
    }, []);
    // เปิด/ปิด dialog
    //const open = () => dialogRef.current?.showModal();
    // เปิด modal + โหลดหมวดหมู่
    const openModal = async () => {
        try {
            setIsLoadingModal(true);
            const costCategory = await getCostCategories();
            setCostCategory(costCategory);

            // if (!categoryId && costCategory.length > 0) {
            //     setCategoryId(String(costCategory[0].costCategoryID));
            // }
        } catch (err) {
            console.error("โหลด costCategory ไม่ได้:", err);
        }
        finally {
            setIsLoadingModal(false);
            if (dialogRef.current) dialogRef.current.showModal();
        }
    };

    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (e) => {
        if (isSaving) return;
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        setIsSaving(true);

        // หาข้อความของ option ที่เลือกจาก dropdown
        const categoryText = costCategory.find(
            (c) => String(c.costCategoryID) === String(categoryId)
        )?.description || "";
        // สร้าง payload สำหรับ API


        const payload = {
            CostPrice: Number(costPrice || 0),
            CostDate: costDate,
            CostCategoryID: categoryId,
            CostDescription: (costDescription || categoryText).trim(),
            IsPurchase: isPurchase,
            UpdateBy: authData?.userId || null, // ใช้ userId จาก authData ถ้ามี
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
            //alert(payload.CostDescription);
            onCreated?.(); // ให้ parent ไป refresh list ถ้าต้องการ
            showToast?.("บันทึกสำเร็จ!", "success", 2000);
            resetForm();
            closeModal();


            //close();
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            showToast?.(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);
 
        }
    };

   

    const resetForm = () => {
        setCostPrice("");
        setCategoryId("");
        setCostDescription("");
        setCostDate(new Date().toISOString().slice(0, 10));
        setIsPurchase(true);
    };


    return (
        <>
            <button className="btn btn-success text-white" onClick={openModal} disabled={isLoadingModal}>
                {isLoadingModal ? "⏳ กำลังโหลด..." : "✏️ เพิ่มค่าใช้จ่าย"}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">

                    <h3 className="font-bold text-lg">✏️ สร้างรายการค่าใช้จ่ายใหม่</h3>

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
                            <br />
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
                            <br />
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
                            </div><br />
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
                            <br />
                            <textarea
                                id={txt_costDescriptionId}
                                className="textarea textarea-bordered"
                                rows={3}
                                placeholder="รายละเอียดการซื้อ เช่น ซื้อวัตถุดิบ, ค่าบริการ, ค่าขนส่ง ฯลฯ"
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
                                {isSaving ? "⏳ กำลังบันทึก..." : "💾 บันทึก"}
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
