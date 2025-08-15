import { getCostCategories } from "../../services/costService";
import { useRef, useState, useId, useEffect } from "react";
import { api } from "../../lib/api";
import Cookies from "js-cookie";

export default function ModalConfirmPayment({ onConfirm, item, showToast }) {
    const num_costPriceId = useId();
    const dt_purchaseDateId = useId();
    const ddl_costCategoryId = useId();
    const dialogRef = useRef(null);
    const txt_costDescriptionId = useId();
    // สถานะต่างๆ สำหรับ modal

    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // สถานะต่างๆ สำหรับข้อมูลค่าใช้จ่าย
    const [costCategory, setCostCategory] = useState([]);
    const [costPrice, setCostPrice] = useState(item.costPrice);
    const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate || new Date().toISOString().slice(0, 10));
    const [categoryId, setCategoryId] = useState(item.costCategory.id);
    const [costDescription, setCostDescription] = useState(item.costDescription);
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
    useEffect(() => {
        // default วันนี้ถ้าไม่มีค่า
        setPurchaseDate((prev) => prev || new Date().toISOString().slice(0, 10));
    }, []);

    // เปิด modal เมื่อมีการคลิกปุ่ม
    const openModal = async () => {
        if (isSaving) return; // ป้องกันการเปิด modal ซ้ำในขณะที่กำลังบันทึก
        try {
            setIsLoadingModal(true);

            const costCategory = await getCostCategories();
            setCostCategory(costCategory);
            if (!categoryId && costCategory.length > 0) {
                setCategoryId(String(costCategory[0].costCategoryID));
            }
        }
        catch (err) {
            console.error("เปิด modal ไม่ได้:", err);
        }
        finally {
            setIsLoadingModal(false);
            if (dialogRef.current) dialogRef.current.showModal();
        }
    }

    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (e) => {
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        if (isSaving) return;
        setIsSaving(true);

        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const purchaseTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
            now.getSeconds()
        )}`;

        // หาข้อความของ option ที่เลือกจาก dropdown
        const categoryText = costCategory.find(
            (c) => String(c.costCategoryID) === String(categoryId)
        )?.description || "";

        const payload = {
            CostID: item.costID, // ใช้ ID ของรายการที่ต้องการจ่าย
            CostPrice: Number(costPrice || 0),
            PurchaseDate: purchaseDate,
            PurchaseTime: purchaseTime,
            CostCategoryID: categoryId,
            CostDescription: (costDescription || categoryText).trim(),
            IsPurchase: true, // ยืนยันการจ่ายเงิน
            UpdateBy: authData?.userId || null, // ใช้ userId จาก authData ถ้ามี
        };
        if (!payload.CostPrice || payload.CostPrice <= 0) {
            setIsSaving(false);
            return alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
        }
        if (!payload.PurchaseDate) {
            setIsSaving(false);
            return alert("กรุณาเลือกวันที่");
        }
        if (payload.CostCategoryID === "" || payload.CostCategoryID === null) {
            setIsSaving(false);
            return alert("กรุณาเลือกหมวดหมู่");
        }
        try {
            await api.post("/cost/UpdatePurchaseCost", payload);
            //alert(payload);


            showToast("บันทึกสำเร็จ!", "success", 2000);
            onConfirm?.(); // ให้ parent ไป refresh list ถ้าต้องการ
            closeModal();

        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            showToast(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);
            setTimeout(() => {
            }, 2500);
        }
    };


    return (
        <>
            <button className="btn btn-sm btn-primary" onClick={openModal} disabled={isLoadingModal}>
                {isLoadingModal ? <span className="loading loading-spinner loading-sm"></span> : "จ่าย"}
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
                                placeholder="รายละเอียดการซื้อ เช่น ซื้อวัตถุดิบ, ค่าบริการ, ค่าขนส่ง ฯลฯ"
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
