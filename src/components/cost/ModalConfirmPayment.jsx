import { updatePurchaseCost, deleteCost } from "../../services/costService"; // เรียก backend อัปเดต/ลบผ่าน service layer
import { useCostOptions } from "./hooks/useCostOptions"; // hook กลาง โหลด category/purchase-type (ใช้ร่วมกับ ModalNewCost)
import ConfirmDeleteModal from "./ConfirmDeleteModal";     // modal ยืนยันก่อนลบ ซ้อนเปิดทับ modal นี้ได้ (ดูหมายเหตุ ConfirmDeleteModal.jsx)
import { useRef, useState, useId, useEffect } from "react";
import Cookies from "js-cookie";

// component นี้ทำงาน 2 โหมดในตัวเดียว แยกด้วย prop `buttonText`:
// - buttonText="จ่าย" (ค่า default) → ใช้ใน UnpaidCostList.jsx สำหรับ "ยืนยันจ่ายเงิน" รายการที่ยังไม่จ่าย (ไม่มีปุ่มลบ)
// - buttonText="แก้ไข" → ใช้ใน PaidCostList.jsx สำหรับ "แก้ไข" รายการที่จ่ายแล้ว (มีปุ่มลบเพิ่มมาด้วย)
// ทั้งสองโหมดยิง API เดียวกันคือ updatePurchaseCost — ต่างกันแค่ label/ปุ่มที่โชว์บนหน้าจอ
export default function ModalConfirmPayment({ onConfirm, item, showToast, buttonText = "จ่าย" }) {
    // useId() สร้าง id ไม่ซ้ำกันสำหรับผูก label กับ input แต่ละช่อง กันชนกันถ้ามี modal นี้เปิดพร้อมกันหลาย instance (เช่นในตาราง PaidCostList ที่มีปุ่ม "แก้ไข" ทุกแถว)
    const num_costPriceId = useId();
    // const dt_purchaseDateId = useId();
    const ddl_costCategoryId = useId();
    const dialogRef = useRef(null); // ref ของ native <dialog> ใช้เรียก .showModal()/.close()
    const txt_costDescriptionId = useId();
    const txt_costTimeId = useId();
    const txt_costDateId = useId();

    // สถานะต่างๆ สำหรับ modal
    const { categories, purchaseTypes, isLoading, loadOptions } = useCostOptions(); // ตัวเลือก dropdown + สถานะโหลด
    const [isSaving, setIsSaving] = useState(false);           // true ระหว่างรอ updatePurchaseCost() ตอบกลับ
    const [isDeleting, setIsDeleting] = useState(false);       // true ระหว่างรอ deleteCost() ตอบกลับ
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // ควบคุมเปิด/ปิด ConfirmDeleteModal ที่ซ้อนอยู่ข้างใน
    // สถานะต่างๆ สำหรับข้อมูลค่าใช้จ่าย — ทุกตัว seed ค่าเริ่มต้นมาจาก `item` ที่รับเข้ามา (รายการที่กำลังจะจ่าย/แก้ไข)
    const [costPrice, setCostPrice] = useState(item.costPrice);
    const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate || new Date().toISOString().slice(0, 10)); // ยังไม่เคยมีวันที่จ่าย (โหมด "จ่าย" ครั้งแรก) → default วันนี้
    const [costDate, setCostDate] = useState(item.costDate || new Date().toISOString().slice(0, 10));
    const [categoryId, setCategoryId] = useState(item.costCategoryID || item.costCategory?.costCategoryID); // เผื่อ backend ส่งมาคนละ field กันในบางเคส
    const [costDescription, setCostDescription] = useState(item.costDescription);
    const [costTime, setCostTime] = useState(item.costTime || "");
    const [costPurchaseTypeId, setCostPurchaseTypeId] = useState(item.costPurchaseTypeID || "");
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null; // ผู้ใช้ปัจจุบัน ใช้บันทึกว่าใครเป็นคนแก้ไข

    useEffect(() => {
        // default วันนี้ถ้าไม่มีค่า
        // ใช้ functional update (prev) แทนอ่านตัวแปรตรงๆ กัน stale closure — เผื่อ item เปลี่ยนหลัง mount (ไม่เกิดจริงในทางปฏิบัติ แต่เขียนกันไว้)
        setPurchaseDate((prev) => prev || new Date().toISOString().slice(0, 10));
        setCostDate((prev) => prev || new Date().toISOString().slice(0, 10));
        setCostTime((prev) => prev || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })); // en-GB locale ให้ผลเป็น 24 ชม. รูปแบบ HH:mm
    }, []); // ทำครั้งเดียวตอน mount

    // เปิด modal เมื่อมีการคลิกปุ่ม
    const openModal = async () => {
        if (isSaving) return; // ป้องกันการเปิด modal ซ้ำในขณะที่กำลังบันทึก
        try {
            const { categories: loadedCategories, purchaseTypes: loadedPurchaseTypes } = await loadOptions(); // โหลด dropdown options พร้อมกัน
            // ถ้ายังไม่มี categoryId ให้ใช้ค่าจาก item หรือค่าแรกใน list
            if (!categoryId && loadedCategories.length > 0) {
                setCategoryId(String(item.costCategoryID || item.costCategory?.costCategoryID || loadedCategories[0].costCategoryID));
            }
            if (!costPurchaseTypeId && loadedPurchaseTypes.length > 0) {
                setCostPurchaseTypeId(String(item.costPurchaseTypeID || loadedPurchaseTypes[0].costPurchaseTypeID));
            }
        }
        catch (err) {
            console.error("เปิด modal ไม่ได้:", err); // โหลดพังก็ไม่บล็อกผู้ใช้ ปล่อยให้เปิด modal ต่อ
        }
        finally {
            if (dialogRef.current) dialogRef.current.showModal(); // เปิด modal เสมอไม่ว่าโหลด option สำเร็จหรือไม่
        }
    }

    const closeModal = () => dialogRef.current?.close();

    // กด submit ฟอร์ม (ปุ่ม "ยืนยันการจ่าย"/"บันทึกการแก้ไข" แล้วแต่โหมด)
    const handleSubmit = async (e) => {
        e.preventDefault(); // กันฟอร์ม submit แบบ native ที่จะรีเฟรชหน้า
        if (isSaving) return; // กันกดซ้ำ
        setIsSaving(true);

        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0"); // เติม 0 ข้างหน้าตัวเลขให้ครบ 2 หลัก เช่น 5 → "05"

        // ฟังก์ชัน format เวลาให้เป็น HH:mm:ss
        const formatTime = (timeStr) => {
            if (!timeStr) return `${pad(now.getHours())}:${pad(now.getMinutes())}:00`; // ไม่มีค่าเลย → ใช้เวลาปัจจุบัน
            // ถ้ามีแค่ HH:mm ให้เพิ่ม :00 ต่อท้าย
            if (/^\d{2}:\d{2}$/.test(timeStr)) return `${timeStr}:00`; // input type=time ให้ค่าแค่ HH:mm ต้องเติมวินาทีเอง
            return timeStr; // เผื่อกรณีมี :ss มาแล้วอยู่แล้ว ก็คืนตรงๆ
        };

        const purchaseTime = formatTime(costTime);       // ใช้ค่าเดียวกันทั้งสองชื่อ field เพราะ backend ต้องการทั้ง PurchaseTime และ CostTime
        const formattedCostTime = formatTime(costTime);

        // หาข้อความของ option ที่เลือกจาก dropdown
        const categoryText = categories.find(
            (c) => String(c.costCategoryID) === String(categoryId)
        )?.description || ""; // ใช้เป็น fallback รายละเอียดถ้าผู้ใช้ไม่ได้กรอกเอง

        const payload = {
            CostID: item.costID, // ต้องส่ง ID ของรายการเดิมเสมอ (ต่างจาก ModalNewCost ที่เป็นการสร้างใหม่ ไม่มี ID)
            CostPrice: Number(costPrice || 0),
            PurchaseDate: purchaseDate,         // YYYY-MM-DD
            PurchaseTime: purchaseTime,         // HH:mm:ss
            CostCategoryID: Number(categoryId),
            CostDescription: (costDescription || categoryText).trim(),
            IsPurchase: true,                   // บันทึกผ่าน modal นี้ = ถือว่าจ่ายแล้วเสมอ (ทั้งสองโหมด)
            UpdateBy: authData?.userId || null,
            CostPurchaseTypeID: Number(costPurchaseTypeId),
            CostDate: costDate,
            CostTime: formattedCostTime,        // HH:mm:ss
        };
        // ตรวจฟอร์มฝั่ง client ก่อนยิง API — พังจุดไหนก็โชว์ toast แล้วหยุดทันที (return เปล่าๆ)
        if (!payload.CostPrice || payload.CostPrice <= 0) {
            setIsSaving(false);
            showToast("กรุณากรอกจำนวนเงินให้ถูกต้อง", "error", 2000);
            return;
        }
        if (!payload.PurchaseDate) {
            setIsSaving(false);
            showToast("กรุณาเลือกวันที่", "error", 2000);
            return;
        }
        if (payload.CostCategoryID === "" || payload.CostCategoryID === null) {
            setIsSaving(false);
            showToast("กรุณาเลือกหมวดหมู่", "error", 2000);
            return;
        }
        try {
            await updatePurchaseCost(payload); // ยิง POST /cost/UpdatePurchaseCost — ใช้ endpoint เดียวกันทั้งโหมด "จ่าย" และ "แก้ไข"
            //alert(payload);


            showToast("บันทึกสำเร็จ!", "success", 2000);
            onConfirm?.(); // ให้ parent ไป refresh list ถ้าต้องการ — UnpaidCostList/PaidCostList จะ fetch ข้อมูลใหม่
            closeModal();

        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ"; // ดึงข้อความจาก backend ก่อน ถ้าไม่มีค่อย fallback
            showToast(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);
            setTimeout(() => {
            }, 2500); // หมายเหตุ: setTimeout เปล่าๆ ไม่มีผลอะไร (โค้ดเดิมทิ้งไว้) — ไม่ได้ลบเพราะไม่กระทบ behavior แค่ไม่มีประโยชน์
        }
    };

    // กดปุ่ม "ลบรายการ" ในฟอร์ม (โหมด "แก้ไข" เท่านั้น) → เปิด ConfirmDeleteModal ก่อน ยังไม่ลบจริง
    const handleDeleteClick = () => {
        if (isDeleting) return;
        setShowDeleteConfirm(true);
    };

    // ปิด ConfirmDeleteModal โดยไม่ลบ (กด "ยกเลิก"/Esc/คลิกพื้นหลัง)
    const handleDeleteCancel = () => setShowDeleteConfirm(false);

    // กดยืนยัน "ลบรายการ" ใน ConfirmDeleteModal → ยิง API ลบจริง
    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteCost(item.costID);
            showToast("ลบรายการเรียบร้อยแล้ว", "success", 2000);
            onConfirm?.();               // บอก parent ให้ refresh list (รายการที่ลบจะหายไป)
            setShowDeleteConfirm(false); // ปิด confirm modal
            closeModal();                // ปิด modal แก้ไขด้วย (ลบสำเร็จแล้วไม่มีอะไรให้แก้ไขต่อ)
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "ลบรายการไม่สำเร็จ";
            showToast(apiMsg, "error", 2000);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* ปุ่มเปิด modal — ข้อความบนปุ่มมาจาก buttonText prop ("จ่าย" หรือ "แก้ไข") */}
            <button
                className="btn btn-sm lg:btn-md btn-primary shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                onClick={openModal}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="loading loading-spinner loading-sm"></span>
                        ⏳กำลังโหลด...
                    </>
                ) : (
                    <>
                        <span className="text-lg">💳</span>
                        {/* ✅ ใช้ buttonText prop แทนการ hardcode */}
                        {buttonText}
                    </>
                )}
            </button>

            {/* Modal Dialog */}
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-3xl bg-gradient-to-br from-base-100 to-base-200 border-2 border-primary/20 shadow-2xl">
                    {/* Modal Header: หัวข้อเปลี่ยนไปตามโหมด */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-base-300">
                        <div className="p-3 bg-primary/20 rounded-full">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            {/* ✅ เปลี่ยน title ตาม buttonText */}
                            <h3 className="font-bold text-xl text-primary">
                                {buttonText === "แก้ไข" ? "แก้ไขข้อมูลค่าใช้จ่าย" : "ยืนยันการจ่ายเงิน"}
                            </h3>
                            <p className="text-sm text-base-content/70 mt-1">รายการ: {item.costDescription}</p>
                        </div>
                    </div>

                    <form className="max-w-md mx-auto space-y-6" onSubmit={handleSubmit}>
                        {/* Payment Amount */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">💵</span>
                                    จำนวนเงิน (บาท)
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    id={num_costPriceId}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input input-bordered input-primary w-full pr-12 bg-base-50 focus:bg-base-100 transition-colors"
                                    placeholder="เช่น 120.00"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-base-content/60">
                                    ฿
                                </span>
                            </div>
                        </div>

                        {/* Payment Date */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">📅</span>
                                    {/* ✅ เปลี่ยน label ตาม buttonText */}
                                    {buttonText === "แก้ไข" ? "วันที่ค่าใช้จ่าย" : "วันที่จ่ายเงิน"}
                                </span>
                            </div>
                            <input
                                id={txt_costDateId}
                                type="date"
                                className="input input-bordered input-primary w-full bg-base-50 focus:bg-base-100 transition-colors"
                                value={costDate}
                                onChange={(e) => {
                                    setPurchaseDate(e.target.value);
                                    setCostDate(e.target.value);
                                }} // ซิงค์ costDate กับ purchaseDate — ฟอร์มนี้มีแค่ input วันที่ช่องเดียว แต่ต้องส่งทั้ง CostDate และ PurchaseDate ไป backend จึงอัปเดตคู่กันเสมอ
                                required
                            />
                        </div>

                        {/* Payment Time */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">⏰</span>
                                    เวลา
                                </span>
                            </div>
                            <input
                                id={txt_costTimeId}
                                type="time"
                                className="input input-bordered input-primary w-full bg-base-50 focus:bg-base-100 transition-colors"
                                value={costTime}
                                onChange={(e) => setCostTime(e.target.value)}
                                required
                                step="60"
                            />
                        </div>

                        {/* Category Selection — ตัวเลือกจาก categories (useCostOptions) */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">🏷️</span>
                                    ประเภทค่าใช้จ่าย
                                </span>
                            </div>
                            <select
                                id={ddl_costCategoryId}
                                className="select select-bordered select-primary w-full bg-base-50 focus:bg-base-100 transition-colors"
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
                        </div>

                        {/* Payment Method — ตัวเลือกจาก purchaseTypes (useCostOptions) */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">💳</span>
                                    วิธีการชำระเงิน
                                </span>
                            </div>
                            <select
                                className="select select-bordered select-primary w-full bg-base-50 focus:bg-base-100 transition-colors"
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
                        </div>

                        {/* Description */}
                        <div className="form-control w-full">
                            <div className="mb-2 text-start">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    รายละเอียดการซื้อ
                                </span>
                            </div>
                            <textarea
                                id={txt_costDescriptionId}
                                className="textarea textarea-bordered textarea-primary w-full bg-base-50 focus:bg-base-100 transition-colors min-h-[100px]"
                                rows={4}
                                placeholder="รายละเอียดการซื้อ เช่น ซื้อวัตถุดิบ, ค่าบริการ, ค่าขนส่ง ฯลฯ"
                                value={costDescription}
                                onChange={(e) => setCostDescription(e.target.value)}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 mt-6 border-t border-base-300">

                            {/* ปุ่มลบ - แสดงเฉพาะเมื่อเป็นโหมดแก้ไข (ไม่มีปุ่มลบในโหมด "จ่าย" เพราะรายการยังไม่จ่ายให้ไปลบที่ UnpaidCostList แทน) */}
                            {buttonText === "แก้ไข" && (
                                <button
                                    type="button"
                                    className="btn btn-error btn-outline transition-all duration-200 order-3 sm:order-1 sm:mr-auto"
                                    onClick={handleDeleteClick}
                                    disabled={isSaving || isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            กำลังลบ...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg">🗑️</span>
                                            ลบรายการ
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                className="btn btn-outline btn-base-content hover:bg-base-200 transition-all duration-200 order-2"
                                onClick={closeModal}
                                disabled={isSaving || isDeleting}
                            >
                                <span className="text-lg">❌</span>
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-success text-success-content shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-3 ${isSaving ? "loading" : ""}`}
                                disabled={isSaving || isDeleting}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        ⏳ กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">✅</span>
                                        {buttonText === "แก้ไข" ? "บันทึกการแก้ไข" : "ยืนยันการจ่าย"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                {/* ซ้อน ConfirmDeleteModal ไว้ "ข้างใน" <dialog> เดียวกัน (ไม่ใช่ sibling นอก dialog)
                    เพื่อให้ browser จัดการ top-layer stacking ให้ถูกต้องเวลาเปิดซ้อนทับฟอร์มแก้ไขที่เปิดอยู่แล้ว */}
                <ConfirmDeleteModal
                    show={showDeleteConfirm}
                    item={item}
                    isDeleting={isDeleting}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                />
            </dialog>
        </>
    );
}
