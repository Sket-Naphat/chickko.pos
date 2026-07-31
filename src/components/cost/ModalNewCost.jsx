import { useRef, useState, useId, useEffect } from "react";
import { createCost } from "../../services/costService";   // เรียก backend สร้างรายการใหม่
import { useCostOptions } from "./hooks/useCostOptions";     // hook กลาง โหลด category/purchase-type (ใช้ร่วมกับ ModalConfirmPayment)
import Cookies from "js-cookie";

// ปุ่ม + form modal สำหรับ "สร้างรายการค่าใช้จ่ายใหม่" — เรียกใช้จาก src/pages/Cost.jsx
export default function ModalNewCost({ onCreated, showToast }) {
    const dialogRef = useRef(null); // Reference to the dialog element — ใช้เรียก .showModal()/.close() ของ native <dialog>
    // useId() สร้าง id ที่ไม่ซ้ำกันสำหรับผูก <label htmlFor> กับ input แต่ละช่อง (กันชนกันถ้ามี ModalNewCost หลาย instance พร้อมกัน)
    const num_costPriceId = useId();
    const dt_costDateId = useId();
    const tm_costTimeId = useId();
    const ddl_costCategoryId = useId();
    const txt_costDescriptionId = useId();
    const chk_isPurchaseId = useId();
    const [isSaving, setIsSaving] = useState(false); // true ระหว่างรอ createCost() ตอบกลับ (ล็อกปุ่มกันกดซ้ำ)
    const { categories, purchaseTypes, isLoading, loadOptions } = useCostOptions(); // categories/purchaseTypes สำหรับเติม dropdown, isLoading ใช้ปิดปุ่มเปิด modal
    // ค่าฟอร์มทั้งหมด เก็บเป็น state แยกทีละช่อง (controlled input ทุกตัว)
    const [costPrice, setCostPrice] = useState("");
    const [costDate, setCostDate] = useState("");
    const [costDescription, setCostDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [costTime, setCostTime] = useState("");
    const [costPurchaseTypeId, setCostPurchaseTypeId] = useState("");
    const [isPurchase, setIsPurchase] = useState(false); // Default to checked — checkbox "จ่ายเงินแล้ว"
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null; // อ่าน user ปัจจุบันจาก cookie เพื่อบันทึกว่าใครเป็นคนสร้างรายการ

    useEffect(() => {
        // default วันที่วันนี้ และเวลา
        const now = new Date();
        setCostDate(now.toISOString().slice(0, 10));  // ตัดเอาแค่ส่วน YYYY-MM-DD จาก ISO string
        setCostTime(now.toTimeString().slice(0, 5));   // ตัดเอาแค่ HH:mm จาก time string
    }, []); // ทำครั้งเดียวตอน component mount (ไม่ใช่ตอนเปิด modal — เผื่อผู้ใช้เปิดค้างไว้นานๆ วันที่/เวลาจะไม่รีเซ็ตตามจริงทุกครั้งที่เปิด)
    // เปิด/ปิด dialog
    //const open = () => dialogRef.current?.showModal();
    // เปิด modal + โหลดหมวดหมู่
    const openModal = async () => {
        try {
            const { categories: loadedCategories, purchaseTypes: loadedPurchaseTypes } = await loadOptions(); // ยิงโหลด categories+purchaseTypes พร้อมกัน (ผ่าน hook), ใช้ผลลัพธ์ตรงจาก return แทนรอ state อัปเดต
            // ตั้ง default หมวดหมู่เป็น "วัตถุดิบรายวัน" (CostCategoryID = 1) ถ้ายังไม่ได้เลือก — เพราะเป็นหมวดที่ถูกใช้บ่อยสุดตอนเพิ่มรายการใหม่
            if (!categoryId) {
                const defaultCategory = loadedCategories.find((c) => c.costCategoryID === 1);
                if (defaultCategory) setCategoryId(String(defaultCategory.costCategoryID)); // เช็คว่ามีจริงในลิสต์ก่อนตั้งค่า กันกรณี backend ไม่มีหมวด ID 1 แล้ว dropdown ค้างค่าที่ไม่มีตัวเลือกจริงรองรับ
            }
            // ตั้ง default ให้เลือกตัวแรกถ้ายังไม่ได้เลือก
            if (!costPurchaseTypeId && loadedPurchaseTypes.length > 0) {
                setCostPurchaseTypeId(String(loadedPurchaseTypes[0].costPurchaseTypeID)); // ยังไม่เคยเลือกวิธีชำระเงิน → เลือกตัวแรกในลิสต์ให้อัตโนมัติ
            }
        } catch (err) {
            console.error("โหลด costCategory ไม่ได้:", err); // โหลดพัง ก็ไม่บล็อกผู้ใช้ — ปล่อยให้เปิด modal ต่อ (แค่ dropdown จะว่าง)
        }
        finally {
            if (dialogRef.current) dialogRef.current.showModal(); // ไม่ว่าโหลดสำเร็จหรือพัง ก็เปิด modal เสมอ
        }
    };

    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (e) => {
        if (isSaving) return; // กันกด submit ซ้ำระหว่างกำลังบันทึกอยู่
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        setIsSaving(true);

        // หาข้อความของ option ที่เลือกจาก dropdown
        const categoryText = categories.find(
            (c) => String(c.costCategoryID) === String(categoryId)
        )?.description || ""; // ใช้เป็นค่า fallback ของ "รายละเอียด" ถ้าผู้ใช้ไม่ได้พิมพ์อะไรเอง (ดูตรง CostDescription ด้านล่าง)
        // สร้าง payload สำหรับ API

        const payload = {
            CostPrice: Number(costPrice || 0),                              // แปลง string จาก input เป็นตัวเลข ("" → 0)
            CostDate: costDate,
            CostTime: costTime.length === 5 ? costTime + ":00" : costTime,  // input type=time ให้ค่า "HH:mm" (5 ตัวอักษร) ต้องเติม ":00" ให้เป็น HH:mm:ss ตามที่ backend ต้องการ
            CostCategoryID: categoryId,
            CostDescription: (costDescription || categoryText).trim(),     // ถ้าผู้ใช้ไม่กรอกรายละเอียดเอง ใช้ชื่อหมวดหมู่แทน
            CostPurchaseTypeID: costPurchaseTypeId,
            IsPurchase: isPurchase,
            UpdateBy: authData?.userId || null, // ใช้ userId จาก authData ถ้ามี
        };
        // ตรวจฟอร์มฝั่ง client ก่อนยิง API — เจอปัญหาอะไรก็ปลดล็อกปุ่ม + โชว์ toast บอกแล้วหยุดทำงานทันที (return เปล่าๆ)
        if (!payload.CostPrice || payload.CostPrice <= 0) {
            setIsSaving(false);
            showToast?.("กรุณากรอกจำนวนเงินให้ถูกต้อง", "error", 2000);
            return;
        }
        if (!payload.CostDate) {
            setIsSaving(false);
            showToast?.("กรุณาเลือกวันที่", "error", 2000);
            return;
        }
        if (payload.CostCategoryID === "" || payload.CostCategoryID === null) {
            setIsSaving(false);
            showToast?.("กรุณาเลือกหมวดหมู่", "error", 2000);
            return;
        }
        try {
            await createCost(payload); // ยิง POST /cost/CreateCost ผ่าน service layer
            //alert(payload.CostDescription);
            onCreated?.(); // ให้ parent ไป refresh list ถ้าต้องการ — Cost.jsx จะเพิ่ม refreshKey ทำให้ Unpaid/PaidCostList fetch ใหม่
            showToast?.("บันทึกสำเร็จ!", "success", 2000);
            resetForm();  // เคลียร์ฟอร์มกลับเป็นค่าเริ่มต้น เผื่อผู้ใช้จะเพิ่มรายการถัดไปต่อ
            closeModal(); // ปิด modal


            //close();
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ"; // พยายามดึงข้อความ error จาก backend ก่อน ถ้าไม่มีค่อย fallback เป็นข้อความทั่วไป
            showToast?.(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false); // ปลดล็อกปุ่มไม่ว่าผลจะเป็นอย่างไร

        }
    };



    // รีเซ็ตค่าฟอร์มกลับเป็นค่าเริ่มต้น (เรียกหลังบันทึกสำเร็จ)
    const resetForm = () => {
        setCostPrice("");
        setCategoryId("");
        setCostDescription("");
        setCostPurchaseTypeId("");
        const now = new Date();
        setCostDate(now.toISOString().slice(0, 10));  // รีเซ็ตวันที่กลับเป็น "วันนี้" ใหม่ (เผื่อเวลาผ่านไปนานตั้งแต่เปิด modal)
        setCostTime(now.toTimeString().slice(0, 5));
        setIsPurchase(true); // หมายเหตุ: ตั้งเป็น true ตรงนี้ ต่างจากค่าเริ่มต้นตอน mount ที่เป็น false — คือหลังบันทึกรอบแรกไปแล้ว รอบถัดไปจะ default เป็น "จ่ายแล้ว" ไว้ก่อน
    };


    return (
        <>
            {/* ปุ่มเปิด modal — ปิดปุ่มไว้ระหว่างกำลังโหลด category/purchase options */}
            <button className="btn btn-success text-white" onClick={openModal} disabled={isLoading}>
                {isLoading ? "⏳ กำลังโหลด..." : "✏️ เพิ่มค่าใช้จ่าย"}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">

                    <h3 className="font-bold text-lg">✏️ สร้างรายการค่าใช้จ่ายใหม่</h3>

                    <form
                        className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                        onSubmit={handleSubmit}
                    >

                        {/* ช่องจำนวนเงิน */}
                        <label className="form-control sm:col-span-12 md:col-span-3">
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
                                className="input input-bordered w-full"
                                placeholder="เช่น 120.00"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                required
                            />
                        </label>

                        {/* ช่องวันที่ */}
                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={dt_costDateId}>
                                    วันที่
                                </span>
                            </div>
                            <br />
                            <input
                                id={dt_costDateId}
                                type="date"
                                className="input input-bordered w-full"
                                value={costDate}
                                onChange={(e) => setCostDate(e.target.value)}
                                required
                            />
                        </label>

                        {/* ช่องเวลา */}
                        <label className="form-control md:col-span-1">
                            <div className="label">
                                <span className="label-text" htmlFor={tm_costTimeId}>
                                    เวลา
                                </span>
                            </div>
                            <br />
                            <input
                                id={tm_costTimeId}
                                type="time"
                                className="input input-bordered w-full"
                                value={costTime}
                                onChange={(e) => setCostTime(e.target.value)}
                                required
                            />
                        </label>

                        {/* dropdown เลือกหมวดหมู่ — ตัวเลือกมาจาก categories (useCostOptions) */}
                        <label className="form-control md:col-span-3">

                            <div className="label">
                                <span className="label-text" htmlFor={ddl_costCategoryId}>
                                    ประเภท
                                </span> &nbsp;
                            </div><br />
                            <select
                                id={ddl_costCategoryId}
                                className="select select-bordered w-full"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกประเภทค่าใช้จ่าย —</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.costCategoryID}
                                        value={String(category.costCategoryID)}
                                    >
                                        {category.description}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* dropdown เลือกวิธีการชำระเงิน — ตัวเลือกมาจาก purchaseTypes (useCostOptions) */}
                        <label className="form-control md:col-span-3">
                            <div className="label">
                                <span className="label-text">วิธีการชำระเงิน</span>
                            </div>
                            <select
                                className="select select-bordered w-full"
                                value={costPurchaseTypeId}
                                onChange={e => setCostPurchaseTypeId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกวิธีการชำระเงิน —</option>
                                {purchaseTypes.map((purchase) => (
                                    <option
                                        key={purchase.costPurchaseTypeID}
                                        value={String(purchase.costPurchaseTypeID)}
                                    >
                                        {purchase.description}
                                    </option>
                                ))}
                            </select>
                        </label>


                        {/* ช่องรายละเอียด (ไม่บังคับ — ถ้าเว้นว่างจะ fallback เป็นชื่อหมวดหมู่ตอน submit) */}
                        <label className="form-control md:col-span-3">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_costDescriptionId}>
                                    รายละเอียดการซื้อ
                                </span>&nbsp;
                            </div>
                            <br />
                            <textarea
                                id={txt_costDescriptionId}
                                className="textarea textarea-bordered w-full"
                                rows={3}
                                placeholder="รายละเอียดการซื้อ เช่น ซื้อวัตถุดิบ, ค่าบริการ, ค่าขนส่ง ฯลฯ"
                                value={costDescription}
                                onChange={(e) => setCostDescription(e.target.value)}
                            />
                        </label>
                        {/* checkbox บอกว่าจ่ายเงินแล้วหรือยัง — ผลตรงนี้กำหนดว่ารายการจะไปโผล่ที่ UnpaidCostList หรือ PaidCostList */}
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

                        {/* ปุ่มบันทึก/ปิด */}
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
