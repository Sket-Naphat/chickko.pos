import { getCostCategories, getCostPurchases } from "../../services/costService";
import { useRef, useState, useId, useEffect } from "react";
import { api } from "../../lib/api";
import Cookies from "js-cookie";

export default function ModalConfirmPayment({ onConfirm, item, showToast, buttonText = "จ่าย" }) {
    const num_costPriceId = useId();
    // const dt_purchaseDateId = useId();
    const ddl_costCategoryId = useId();
    const dialogRef = useRef(null);
    const txt_costDescriptionId = useId();
    const txt_costTimeId = useId();
    const txt_costDateId = useId();

    // สถานะต่างๆ สำหรับ modal
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // สถานะต่างๆ สำหรับข้อมูลค่าใช้จ่าย
    const [costCategories, setCostCategories] = useState([]);
    const [costPrice, setCostPrice] = useState(item.costPrice);
    const [purchaseDate, setPurchaseDate] = useState(item.purchaseDate || new Date().toISOString().slice(0, 10));
    const [costDate, setCostDate] = useState(item.costDate || new Date().toISOString().slice(0, 10));
    const [categoryId, setCategoryId] = useState(item.costCategoryID || item.costCategory?.costCategoryID);
    const [costDescription, setCostDescription] = useState(item.costDescription);
    const [costTime, setCostTime] = useState(item.costTime || "");
    const [costPurchaseTypeId, setCostPurchaseTypeId] = useState(item.costPurchaseTypeID || "");
    const [costPurchase, setCostPurchase] = useState([]);
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;

    useEffect(() => {
        // default วันนี้ถ้าไม่มีค่า
        setPurchaseDate((prev) => prev || new Date().toISOString().slice(0, 10));
        setCostDate((prev) => prev || new Date().toISOString().slice(0, 10));
        setCostTime((prev) => prev || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, []);

    // เปิด modal เมื่อมีการคลิกปุ่ม
    const openModal = async () => {
        if (isSaving) return; // ป้องกันการเปิด modal ซ้ำในขณะที่กำลังบันทึก
        try {
            setIsLoadingModal(true);

            const categories = await getCostCategories();
            setCostCategories(categories);
            // ถ้ายังไม่มี categoryId ให้ใช้ค่าจาก item หรือค่าแรกใน list
            if (!categoryId && categories.length > 0) {
                setCategoryId(String(item.costCategoryID || item.costCategory?.costCategoryID || categories[0].costCategoryID));
            }

            const types = await getCostPurchases();
            setCostPurchase(types);
            if (!costPurchaseTypeId && types.length > 0) {
                setCostPurchaseTypeId(String(item.costPurchaseTypeID || types[0].costPurchaseTypeID));
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
        const purchaseTime = costTime || `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        // หาข้อความของ option ที่เลือกจาก dropdown
        const categoryText = costCategories.find(
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
            CostPurchaseTypeID: costPurchaseTypeId, // เพิ่มฟิลด์นี้
            CostDate : costDate, // เพิ่มฟิลด์นี้ (ถ้าจำเป็นสำหรับ API ของคุณ)
            CostTime : costTime, // เพิ่มฟิลด์นี้ (ถ้าจำเป็นสำหรับ API ของคุณ)
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
            <button
                className="btn btn-sm lg:btn-md btn-primary shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                onClick={openModal}
                disabled={isLoadingModal}
            >
                {isLoadingModal ? (
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
                    {/* Modal Header */}
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
                                }} // ซิงค์ costDate กับ purchaseDate
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

                        {/* Category Selection */}
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
                                {costCategories.map((category) => (
                                    <option
                                        key={category.costCategoryID}
                                        value={String(category.costCategoryID)}
                                    >
                                        {category.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Method */}
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
                                {costPurchase.map((purchase) => (
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
                            <button
                                type="button"
                                className="btn btn-outline btn-base-content hover:bg-base-200 transition-all duration-200 order-2 sm:order-1"
                                onClick={closeModal}
                                disabled={isSaving}
                            >
                                <span className="text-lg">❌</span>
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-success text-success-content shadow-lg hover:shadow-xl transition-all duration-200 order-1 sm:order-2 ${isSaving ? "loading" : ""}`}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        ⏳ กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">✅</span>
                                        {/* ✅ เปลี่ยนปุ่ม submit ตาม buttonText */}
                                        {buttonText === "แก้ไข" ? "บันทึกการแก้ไข" : "ยืนยันการจ่าย"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
}
