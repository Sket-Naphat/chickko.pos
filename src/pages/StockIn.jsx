// src/pages/CheckStockDetail.jsx
import { useEffect, useState, useMemo, useCallback, Fragment } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import Cookies from "js-cookie";

export default function StockInDetail() {
    const { orderId } = useParams(); // "new" หรือเลข id จริง
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
    const [modifiedIds, setModifiedIds] = useState([]);
    const [invalidIds, setInvalidIds] = useState([]); // แถวที่ qty ว่าง/ไม่ถูกต้อง
    const [errorMsg, setErrorMsg] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showZeroItems, setShowZeroItems] = useState(false); // แสดงรายการที่ยังไม่ได้นับ
    const [zeroItems, setZeroItems] = useState([]); // รายการที่ยังไม่ได้นับ
    const navigate = useNavigate();
    const location = useLocation();
    
    // ✅ จดจำหน้าที่เข้ามา
    const fromPage = location.state?.from || '/stock'; // default กลับไป /stock
    
    // helper: คืน yyyy-MM-dd แบบ local (ไม่คลาดวัน)
    const todayLocal = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };
    const [costPrice, setCostPrice] = useState(0);
    const [orderDate, setOrderDate] = useState(todayLocal());
    const [isPurchase, setIsPurchase] = useState(false); // true = จ่ายแล้ว, false = ยังไม่จ่าย
    const markModified = (id) => {
        setModifiedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    const [groupBy, setGroupBy] = useState("category"); // "location" | "category"
    const [showBackToTop, setShowBackToTop] = useState(false);

    // ✅ จัดการ Back to Top Button
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setShowBackToTop(scrollTop > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ✅ แก้ไข groups เพื่อแสดงเฉพาะรายการหลัก
    const groups = useMemo(() => {
        // ใช้เฉพาะ items (ไม่รวม zeroItems)
        if (!items || items.length === 0) return [];

        const catId = (it) => it.stockCategoryID ?? it.stockCategoryId ?? it.categoryID ?? it.categoryId;
        const catName = (it) => it.stockCategoryName ?? it.categoryName;
        const locId = (it) => it.stockLocationID ?? it.stockLocationId ?? it.locationID ?? it.locationId;
        const locName = (it) => it.stockLocationName ?? it.locationName;

        const idOf = (it) => groupBy === "category" ? catId(it) : locId(it);
        const nameOf = (it) => groupBy === "category" ? catName(it) : locName(it);

        const map = new Map();
        for (const it of items) {
            const id = Number(idOf(it) ?? -1);
            const name = nameOf(it) ?? (groupBy === "category" ? `หมวด #${id}` : `ตำแหน่ง #${id}`);
            if (!map.has(id)) map.set(id, { id, name, items: [] });
            map.get(id).items.push(it);
        }

        return Array.from(map.values())
            .sort((a, b) => a.id - b.id)
            .map(g => ({
                ...g,
                items: g.items.sort((a, b) => (a.itemName ?? "").localeCompare(b.itemName ?? "")),
            }));
    }, [items, groupBy]); // ✅ ลบ zeroItems และ showZeroItems ออก

    // ✅ เพิ่ม groups สำหรับรายการที่ยังไม่ได้นับ
    const zeroGroups = useMemo(() => {
        if (!zeroItems || zeroItems.length === 0) return [];

        const catId = (it) => it.stockCategoryID ?? it.stockCategoryId ?? it.categoryID ?? it.categoryId;
        const catName = (it) => it.stockCategoryName ?? it.categoryName;
        const locId = (it) => it.stockLocationID ?? it.stockLocationId ?? it.locationID ?? it.locationId;
        const locName = (it) => it.stockLocationName ?? it.locationName;

        const idOf = (it) => groupBy === "category" ? catId(it) : locId(it);
        const nameOf = (it) => groupBy === "category" ? catName(it) : locName(it);

        const map = new Map();
        for (const it of zeroItems) {
            const id = Number(idOf(it) ?? -1);
            const name = nameOf(it) ?? (groupBy === "category" ? `หมวด #${id}` : `ตำแหน่ง #${id}`);
            if (!map.has(id)) map.set(id, { id, name, items: [] });
            map.get(id).items.push(it);
        }

        return Array.from(map.values())
            .sort((a, b) => a.id - b.id)
            .map(g => ({
                ...g,
                items: g.items.sort((a, b) => (a.itemName ?? "").localeCompare(b.itemName ?? "")),
            }));
    }, [zeroItems, groupBy]);

    // ✅ Cache expensive calculations
    const itemsWithPurchaseQty = useMemo(() => {
        return zeroItems.filter(it => it.purchaseQTY !== "");
    }, [zeroItems]);

    // ...ใน component
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [alertNext, setAlertNext] = useState(null); // callback หลัง OK

    // ปุ่ม OK ของ modal
    const handleAlertOk = () => {
        setAlertOpen(false);
        if (typeof alertNext === "function") {
            alertNext();
        }
    };

    useEffect(() => {
        if (!orderId) {
            navigate("/stock");
            return;
        }
        const ac = new AbortController();     // ใช้ยกเลิก request เมื่อ component unmount
        setLoading(true);

        (async () => {
            try {
                if (!orderId || orderId === "new") {
                    navigate("/stock", { replace: true });

                } else {
                    // 🔹 โหมดแก้ไขใบเดิม: ดึงรายการของใบนี้ แล้วแสดง qty เดิม
                    const res = await api.post("/stock/GetStockCountLogByCostId", {
                        costId: orderId,
                        //IsStockIn: true, // แสดงรายการที่ซื้อเข้า
                    });
                    const raw = res?.data ?? [];  // backend ห่อใน { success, data, message }
                    // ✅ กรองเฉพาะรายการที่ StockInQTY > 0

                    const mainItems = raw.stockCountDtos.filter(s => s.stockInQTY > 0 || s.purchaseQTY > 0);
                    const zeroStockItems = raw.stockNotCountDtos;

                    const mainList = mainItems.map(s => ({
                        stockLogId: s.stockLogId,
                        stockId: s.stockId,
                        itemName: s.itemName,
                        stockCategoryID: s.stockCategoryID,
                        stockCategoryName: s.stockCategoryName,
                        stockUnitTypeID: s.stockUnitTypeID,
                        stockUnitTypeName: s.stockUnitTypeName,
                        stockLocationID: s.stockLocationID,
                        stockLocationName: s.stockLocationName,
                        totalQTY: s.totalQTY,
                        requiredQTY: s.requiredQTY,
                        stockInQTY: s.stockInQTY,
                        remark: s.remark,
                        price: 0, // ให้กรอกเอง
                        purchaseQTY: (s.purchaseQTY == 0 ? "" : s.purchaseQTY) // ให้กรอกเอง
                    }));

                    const zeroList = zeroStockItems.map(s => ({
                        stockLogId: s.stockLogId,
                        stockId: s.stockId,
                        itemName: s.itemName,
                        stockCategoryID: s.stockCategoryID,
                        stockCategoryName: s.stockCategoryName,
                        stockUnitTypeID: s.stockUnitTypeID,
                        stockUnitTypeName: s.stockUnitTypeName,
                        stockLocationID: s.stockLocationID,
                        stockLocationName: s.stockLocationName,
                        totalQTY: 0,//s.totalQTY,
                        requiredQTY: s.requiredQTY,
                        stockInQTY: s.stockInQTY,
                        remark: s.remark,
                        price: 0,
                        purchaseQTY: (s.purchaseQTY == 0 ? "" : s.purchaseQTY) // ให้กรอกเอง
                    }));

                    setItems(mainList);
                    setZeroItems(zeroList);

                    setOrderDate(raw.stockInDate || todayLocal()); // ตั้งวันที่ตามใบสั่ง
                    setCostPrice((raw.costPrice == 0 ? "" : raw.costPrice));
                }

                // ✅ ค่าเริ่มต้น: เคลียร์สถานะไฮไลต์/ไม่ถูกต้องทุกครั้งที่โหลดใหม่
                setModifiedIds?.([]);
                setInvalidIds?.([]);
                setErrorMsg?.("");

            } catch (err) {
                if (ac.signal.aborted) return;    // ถ้าถูกยกเลิก ไม่ต้องทำอะไรต่อ
                console.error(err);
                setItems([]);
                setErrorMsg?.("❌ โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            } finally {
                if (!ac.signal.aborted) setLoading(false);
            }
        })();

        return () => ac.abort();              // cleanup: ยกเลิก request เมื่อ unmount
    }, [orderId, navigate]);


    const onQtyChange = useCallback((stockId, value) => {
        if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
            // อัปเดตใน items
            setItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, purchaseQTY: value } : x)));
            // อัปเดตใน zeroItems
            setZeroItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, purchaseQTY: value } : x)));

            setInvalidIds((prev) => prev.filter((x) => x !== stockId));
            markModified(stockId);
        }
    }, []);

    // const onClickCopyQTYtoPurchaseQTY = (stockId, value) => {
    //     setItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, purchaseQTY: value } : x)));
    //     markModified(stockId);
    // };
    const onClickCopyQTYtoPurchaseQTY = useCallback((stockId, value) => {
        setItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, purchaseQTY: value } : x)));
        setZeroItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, purchaseQTY: value } : x)));
        markModified(stockId);
    }, []);
    // ✅ 2. Early Return หลัก - ป้องกัน render
    if (!orderId) {
        return null; // 🔥 นี่คือ Early Return หลัก
    }
    const validate = () => {
        // ไม่ต้อง validate ให้กรอกครบทุกรายการแล้ว
        setErrorMsg("");
        return true;
    };

    const save = async () => {
        if (!validate()) return;

        // ✅ บันทึกเฉพาะรายการที่มีการซื้อเข้า (purchaseQTY > 0)
        const mainItemsWithPurchase = items.filter(it =>
            it.purchaseQTY !== "" &&
            it.purchaseQTY !== "0" &&
            Number(it.purchaseQTY) > 0
        );

        // ✅ บันทึกรายการที่ยังไม่ได้นับที่มีการซื้อเข้า
        const zeroItemsWithPurchase = zeroItems.filter(it =>
            it.purchaseQTY !== "" &&
            it.purchaseQTY !== "0" &&
            Number(it.purchaseQTY) > 0
        );

        const allItemsToSave = [...mainItemsWithPurchase, ...zeroItemsWithPurchase];

        // ตรวจสอบว่ามีรายการที่จะบันทึกหรือไม่
        if (allItemsToSave.length === 0) {
            setErrorMsg("ไม่มีรายการที่จะบันทึก กรุณาแก้ไขข้อมูลก่อน");
            return;
        }

        setIsSaving(true);

        const nowTime = new Date().toLocaleTimeString("en-GB", {
            hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
        });

        const toDateOnly = (dateStr) => dateStr || null;
        const toTimeOnly = (timeStr) => timeStr || null;
        const toIntOrNull = (v) => v === "" || v === null || v === undefined ? 0 : Number(v);

        // ✅ ใช้ allItemsToSave แทน items
        const stockInDto = allItemsToSave.map((it) => ({
            StockLogId: it.stockLogId ?? 0,
            StockName: it.itemName ?? "",
            StockId: Number(it.stockId),
            StockInDate: toDateOnly(orderDate),
            StockInTime: toTimeOnly(nowTime),
            StockInQTY: toIntOrNull(it.stockInQTY),
            PurchaseQTY: toIntOrNull(it.purchaseQTY),
            Price: toIntOrNull(it.price),
            SupplyId: 0,
            Remark: it.remark ?? "",
            CostId: Number(orderId),
            IsStockIn: true,
            RequiredQTY: toIntOrNull(it.requiredQTY),
        }));

        const UpdateStockCostDto = {
            StockInDate: toDateOnly(orderDate),
            StockInTime: toTimeOnly(nowTime),
            CostPrice: toIntOrNull(costPrice),
            IsPurchase: isPurchase,
            CostID: Number(orderId),
            UpdateBy: authData?.userId ?? 0,
        }

        const payload = {
            UpdateStockCostDto: UpdateStockCostDto,
            StockInDto: stockInDto,
        };

        try {
            // ✅ เพิ่ม timeout สำหรับการบันทึก (60 วินาที)
            await api.post("/stock/CreateStockIn", payload, {
                timeout: 60000, // 60 วินาที
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log("Saving payload:", payload); // ✅ สำหรับ debug
            setAlertTitle("บันทึกสำเร็จ");
            setAlertMessage(`ข้อมูลถูกบันทึกเรียบร้อยแล้ว (${allItemsToSave.length} รายการ)`);
            setAlertNext(() => () => {
                navigate(fromPage, { state: { shouldRefresh: true } });
            });
            setAlertOpen(true);

        } catch (err) {
            console.error(err);
            setAlertTitle("บันทึกไม่สำเร็จ");
            setAlertMessage("กรุณาลองใหม่อีกครั้ง");
            setAlertNext(() => () => { });
            setAlertOpen(true);
        } finally {
            setIsSaving(false);
        }
    };




    return (
        <div className="p-2 md:p-4 space-y-3 md:space-y-4">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h1 className="text-lg md:text-xl font-bold text-primary">
                    {`จัดการรายการใบสั่ง: ${orderId}`}
                </h1>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="join">
                    <button
                        className={`btn btn-xs sm:btn-sm text-xs sm:text-sm join-item ${groupBy === "location" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("location")}
                        title="จัดเรียงตามตำแหน่งเก็บ"
                    >
                        ตามตำแหน่งเก็บ
                    </button>
                    <button
                        className={`btn btn-xs sm:btn-sm text-xs sm:text-sm join-item ${groupBy === "category" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("category")}
                        title="จัดเรียงตามหมวดหมู่"
                    >
                        ตามหมวดหมู่
                    </button>
                </div>


            </div>

            {errorMsg && (
                <div className="alert alert-warning">
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* ✅ Card บันทึก - ย้ายมาไว้ข้างบน */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-center">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-xs md:text-sm font-medium">📅 วันที่ซื้อเข้า:</span>
                            <input
                                type="date"
                                className="input input-bordered input-xs sm:input-sm md:input-md w-full sm:w-40"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-xs md:text-sm font-medium">💰 ราคารวม:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="input input-bordered input-xs sm:input-sm md:input-md text-md w-full sm:w-32 text-right"
                                    value={costPrice || ""}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    tabIndex={-1}
                                />
                                <span className="text-xs md:text-sm">บาท</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="toggle toggle-xs sm:toggle-sm toggle-primary"
                                checked={isPurchase}
                                onChange={(e) => setIsPurchase(e.target.checked)}
                            />
                            <span className="text-xs md:text-sm font-medium">✅ ชำระเงินแล้ว</span>
                        </div>

                        <button
                            className="btn btn-primary btn-sm md:btn-md xl:btn-lg w-full xl:w-auto"
                            onClick={save}
                            disabled={isSaving}
                            title="บันทึกรายการที่มีการซื้อเข้า"
                        >
                            <span className="text-sm md:text-md xl:text-lg">
                                {isSaving ? "⏳ กำลังบันทึก..." : "💾 บันทึกนำเข้า"}
                            </span>
                        </button>
                    </div>
                    {alertOpen && (
                        <div className="modal modal-open">
                            <div className="modal-box">
                                <h3 className="font-bold text-lg">{alertTitle}</h3>
                                <p className="py-2">{alertMessage}</p>
                                <div className="modal-action">
                                    <button className="btn btn-primary" onClick={handleAlertOk}>
                                        OK
                                    </button>
                                </div>
                            </div>
                            <div className="modal-backdrop"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="card bg-base-100 shadow" style={{ contain: 'layout style' }}>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex items-center gap-2 p-4">
                            <span className="loading loading-spinner loading-sm"></span> ⏳ กำลังโหลด…
                        </div>
                    ) : (
                        <>
                            {/* Desktop View - Table (≥1280px) */}
                            <div className="hidden xl:block overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 bg-base-100 z-20 text-lg">รายการ</th>
                                            <th className="text-right text-lg">ที่ต้องใช้</th>
                                            <th className="text-right text-lg">ที่นับได้</th>
                                            <th className="text-right text-lg bg-warning text-warning-content">ต้องซื้อเข้า</th>
                                            <th className="text-right text-lg bg-success text-success-content">ที่ซื้อจริง</th>
                                            <th className="text-lg">หน่วย</th>
                                            <th className="text-right text-lg">ราคาซื้อเข้า</th>
                                            <th className="text-lg">หมายเหตุ</th>
                                            <th className="text-right text-lg">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!items || items.length === 0) && (
                                            <tr>
                                                <td colSpan="9" className="text-center text-base-content/60">ไม่มีรายการ</td>
                                            </tr>
                                        )}

                                        {groups.map(group => (
                                            <Fragment key={`desktop-grp-${group.id}`}>
                                                {/* หัวข้อกลุ่ม */}
                                                <tr className="bg-base-200">
                                                    <td colSpan={9} className="font-bold text-lg bg-info p-1 text-info-content">
                                                        {group.name}
                                                    </td>
                                                </tr>

                                                {/* รายการในกลุ่ม */}
                                                {group.items.map((it) => {
                                                    const modified = modifiedIds.includes(it.stockId);
                                                    const invalid = invalidIds.includes(it.stockId);
                                                    const rowClass = invalid ? "bg-error/30 border-error" : modified ? "bg-warning/20 border-warning" : "border-info";
                                                    const rowClassItemName = invalid ? "bg-error" : modified ? "bg-warning" : "";
                                                    return (
                                                        <tr key={it.stockId} className={rowClass}>
                                                            <td className={`sticky text-lg p-1 left-0 bg-base-100 z-10  ${rowClassItemName}`}>{it.itemName}</td>
                                                            <td className="text-right text-lg">{it.requiredQTY}</td>
                                                            <td className="text-right text-lg">{it.totalQTY}</td>

                                                            <td className="text-right text-lg bg-warning/10">
                                                                <div className="flex items-center justify-between">
                                                                    <button
                                                                        onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                                        className="btn btn-md btn-outline btn-warning"
                                                                        title="คัดลอกจำนวนที่ต้องซื้อเข้า"
                                                                    >
                                                                        📋
                                                                    </button>
                                                                    <span className="text-right">{it.stockInQTY}</span>
                                                                </div>
                                                            </td>

                                                            {/* ต้องซื้อเข้า */}
                                                            <td className="text-right bg-success/10">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        className="btn btn-md btn-outline btn-error"
                                                                        onClick={() => {
                                                                            const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    >
                                                                        -
                                                                    </button>

                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="99"
                                                                        className="input input-bordered input-md w-14 text-center text-lg"
                                                                        value={it.purchaseQTY ?? ""}
                                                                        onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                    />

                                                                    <button
                                                                        className="btn btn-md btn-outline btn-success"
                                                                        onClick={() => {
                                                                            const n = Number(it.purchaseQTY || 0) + 1;
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            {/* หน่วย */}
                                                            <td className="text-left">
                                                                {it.unitTypeName || it.stockUnitTypeName || "หน่วยไม่ระบุ"}
                                                            </td>
                                                            {/* ราคา */}
                                                            <td className="text-right">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="input input-bordered input-primary input-md w-24 text-right text-lg"
                                                                    value={it.price || ""}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                            </td>
                                                            {/* หมายเหตุ */}
                                                            <td className="text-left">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-xs w-40 text-left"
                                                                        value={it.remark}
                                                                        onChange={(e) => {
                                                                            const newRemark = e.target.value;
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                            );
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>

                                                            {/* เคลียร์ */}
                                                            <td className="text-right">
                                                                <button
                                                                    className="btn btn-md btn-outline btn-error"
                                                                    onClick={() => {
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, } : x))
                                                                        );
                                                                        setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    }}
                                                                >
                                                                    เคลียร์
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tablet View - Grid (768px-1279px) */}
                            <div className="hidden md:block xl:hidden overflow-x-auto">
                                <div className="space-y-2 p-2">
                                    {(!items || items.length === 0) && (
                                        <div className="text-center text-base-content/60 p-4">ไม่มีรายการ</div>
                                    )}

                                    {groups.map(group => (
                                        <div key={`tablet-grp-${group.id}`} className="space-y-1">
                                            {/* หัวข้อกลุ่ม Tablet */}
                                            <div className="bg-info text-info-content px-3 py-2 rounded font-bold text-base">
                                                {group.name}
                                            </div>

                                            {/* Grid Layout สำหรับ Tablet */}
                                            <div className="grid grid-cols-1 gap-2">
                                                {group.items.map((it) => {
                                                    const modified = modifiedIds.includes(it.stockId);
                                                    const invalid = invalidIds.includes(it.stockId);
                                                    const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";

                                                    return (
                                                        <div key={`tablet-${it.stockId}`} className={`border ${cardClass} rounded-lg p-2 shadow-sm`}>
                                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                                {/* ชื่อสินค้า - 3 columns */}
                                                                <div className="col-span-3">
                                                                    <div className="font-bold text-base text-primary break-words leading-tight">
                                                                        {it.itemName}
                                                                    </div>
                                                                    <div className="text-sm text-base-content/70 space-x-2">
                                                                        <span>ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span></span>
                                                                        <span>นับได้: <span className="font-bold">{it.totalQTY}</span></span>
                                                                    </div>
                                                                    <div className="text-sm text-base-content/70">
                                                                        หน่วย: <span className="font-bold">{it.unitTypeName || it.stockUnitTypeName || "หน่วยไม่ระบุ"}</span>
                                                                    </div>
                                                                </div>

                                                                {/* ต้องซื้อเข้า - 2 columns */}
                                                                <div className="col-span-2">
                                                                    <div className="text-sm text-warning font-medium">⚠️ ต้องซื้อเข้า</div>
                                                                    <div className="flex items-center gap-1">

                                                                        <button
                                                                            onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                                            className="btn btn-xs btn-outline btn-warning"
                                                                            title="คัดลอก"
                                                                        >
                                                                            📋
                                                                        </button>
                                                                        <div className="font-bold text-warning text-base">{it.stockInQTY}</div>
                                                                    </div>
                                                                </div>

                                                                {/* ซื้อจริง - 3 columns */}
                                                                <div className="col-span-3">
                                                                    <div className="text-sm text-success font-medium">✅ ซื้อจริง</div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            className="btn btn-xs btn-outline btn-error"
                                                                            onClick={() => {
                                                                                const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        >
                                                                            -
                                                                        </button>

                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="99"
                                                                            className="input input-bordered input-xs w-14 text-center text-base font-bold"
                                                                            value={it.purchaseQTY ?? ""}
                                                                            onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                        />

                                                                        <button
                                                                            className="btn btn-xs btn-outline btn-success"
                                                                            onClick={() => {
                                                                                const n = Number(it.purchaseQTY || 0) + 1;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* ราคาและหมายเหตุ - 3 columns */}
                                                                <div className="col-span-3">
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="input input-bordered input-xs text-right text-sm font-medium"
                                                                            placeholder="ราคา..."
                                                                            value={it.price || ""}
                                                                            onChange={(e) => {
                                                                                const v = e.target.value;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                                                );
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            className="input input-bordered input-xs text-sm"
                                                                            placeholder="หมายเหตุ..."
                                                                            value={it.remark || ""}
                                                                            onChange={(e) => {
                                                                                const newRemark = e.target.value;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                                );
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* เคลียร์ - 1 column */}
                                                                <div className="col-span-1">
                                                                    <button
                                                                        className="btn btn-xs btn-outline btn-error w-full whitespace-nowrap"
                                                                        onClick={() => {
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, remark: "" } : x))
                                                                            );
                                                                            setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        }}
                                                                        title="เคลียร์ข้อมูล"
                                                                    >
                                                                        เคลียร์ 🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile View - Compact Cards (<768px) */}
                            <div className="md:hidden space-y-1 p-2">
                                {(!items || items.length === 0) && (
                                    <div className="text-center text-base-content/60 p-2">ไม่มีรายการ</div>
                                )}

                                {groups.map(group => (
                                    <div key={`mobile-grp-${group.id}`} className="space-y-1">
                                        {/* หัวข้อกลุ่ม Mobile - Compact */}
                                        <div className="bg-info text-info-content px-2 py-1 rounded font-bold text-sm">
                                            {group.name}
                                        </div>

                                        {/* รายการในกลุ่ม Mobile - Compact */}
                                        {group.items.map((it) => {
                                            const modified = modifiedIds.includes(it.stockId);
                                            const invalid = invalidIds.includes(it.stockId);
                                            const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";

                                            return (
                                                <div key={`mobile-${it.stockId}`} className={`border ${cardClass} rounded p-2 space-y-1`}>
                                                    {/* ชื่อสินค้าและข้อมูลพื้นฐาน */}
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 pr-2">
                                                            <div className="font-bold text-base text-primary break-words leading-tight">{it.itemName}</div>
                                                            <div className="text-sm text-base-content/70 flex gap-2">
                                                                <span>ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span></span>
                                                                <span>นับได้: <span className="font-bold">{it.totalQTY}</span></span>
                                                                <span>หน่วย: <span className="font-bold">{it.unitTypeName || it.stockUnitTypeName || "ไม่ระบุ"}</span></span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-xs btn-outline btn-error whitespace-nowrap"
                                                            onClick={() => {
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, remark: "" } : x))
                                                                );
                                                                setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                            }}
                                                            title="เคลียร์"
                                                        >
                                                            เคลียร์ 🗑️
                                                        </button>
                                                    </div>

                                                    {/* ต้องซื้อเข้า - แนวนอน */}
                                                    <div className="flex items-center justify-normal bg-warning/10 rounded px-2 py-1">
                                                        <span className="text-sm text-warning font-medium">⚠️ ต้องซื้อเข้า: <span className="font-bold text-base">{it.stockInQTY}</span></span>
                                                        <button
                                                            onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                            className="btn btn-xs btn-outline btn-warning ml-2"
                                                            title="คัดลอก"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>

                                                    {/* Controls - แนวนอนแบบกะทัดรัด */}
                                                    <div className="grid grid-cols-3 gap-2 items-center">
                                                        {/* ซื้อจริง */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="btn btn-xs btn-outline btn-error"
                                                                onClick={() => {
                                                                    const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                    setItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                    );
                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                -
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="99"
                                                                className="input input-bordered input-xs w-10 text-center text-base font-bold"
                                                                value={it.purchaseQTY ?? ""}
                                                                onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                            />

                                                            <button
                                                                className="btn btn-xs btn-outline btn-success"
                                                                onClick={() => {
                                                                    const n = Number(it.purchaseQTY || 0) + 1;
                                                                    setItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                    );
                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* ราคา */}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="input input-bordered input-xs text-right text-sm font-medium"
                                                            placeholder="ราคา"
                                                            value={it.price || ""}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                                );
                                                                markModified(it.stockId);
                                                            }}
                                                        />

                                                        {/* หมายเหตุ */}
                                                        <input
                                                            type="text"
                                                            className="input input-bordered input-xs text-sm"
                                                            placeholder="หมายเหตุ"
                                                            value={it.remark || ""}
                                                            onChange={(e) => {
                                                                const newRemark = e.target.value;
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                );
                                                                markModified(it.stockId);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* ✅ ปุ่มแสดง/ซ่อนรายการที่ยังไม่ได้นับ */}
            <button
                className={`btn btn-md sm:btn-sm text-md sm:text-sm ${showZeroItems ? "btn-warning" : "btn-outline"}`}
                onClick={() => setShowZeroItems(!showZeroItems)}
                title={showZeroItems ? "ซ่อนรายการที่ยังไม่ได้นับ" : "แสดงรายการที่ยังไม่ได้นับ"}
            >
                <span className="hidden sm:inline">
                    {showZeroItems ? "ซ่อนรายการที่ยังไม่ได้นับ" : `แสดงรายการที่ยังไม่ได้นับ (${zeroItems.length})`}
                </span>
                <span className="sm:hidden">
                    {showZeroItems ? "ซ่อนรายการที่ยังไม่ได้นับ" : `ดูรายการที่ยังไม่ได้นับ (${zeroItems.length})`}
                </span>
            </button>
            {/* ✅ Card รายการเพิ่มเติม (แสดงเมื่อ showZeroItems = true) */}
            {showZeroItems && (
                <div className="card bg-base-100 shadow border-2 border-warning" style={{ contain: 'layout style' }}>
                    <div className="card-header p-3 md:p-4 border-b bg-warning/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h2 className="text-md md:text-lg font-semibold text-warning-content">
                                📝 รายการที่ยังไม่ได้นับ
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="badge badge-warning badge-sm md:badge-md">
                                    {itemsWithPurchaseQty.length} / {zeroItems.length} 
                                </div>
                                <div className="text-sm text-warning-content opacity-90">
                                    รายการเหล่านี้ยังไม่ได้ทำการตรวจนับ สามารถซื้อเพิ่มได้
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {/* Desktop Zero Items - Table (≥1280px) */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 bg-base-100 z-20 text-lg">รายการ</th>
                                        <th className="text-right text-lg">ที่ต้องใช้</th>
                                        <th className="text-right text-lg">ที่นับได้</th>
                                        <th className="text-right text-lg bg-warning text-warning-content">ต้องซื้อเข้า</th>
                                        <th className="text-right text-lg bg-success text-success-content">ซื้อจริง</th>
                                        <th className="text-lg">หน่วย</th>
                                        <th className="text-right text-lg">ราคาซื้อเข้า</th>
                                        <th className="text-lg">หมายเหตุ</th>
                                        <th className="text-right text-lg">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!zeroItems || zeroItems.length === 0) && (
                                        <tr>
                                            <td colSpan="9" className="text-center text-base-content/60">ไม่มีรายการที่ยังไม่ได้นับ</td>
                                        </tr>
                                    )}

                                    {zeroGroups.map(group => (
                                        <Fragment key={`zero-grp-${group.id}`}>
                                            {/* หัวข้อกลุ่ม */}
                                            <tr className="bg-base-200">
                                                <td colSpan={9} className="font-bold text-lg bg-warning text-warning-content p-1">
                                                    {group.name}
                                                </td>
                                            </tr>

                                            {/* รายการในกลุ่ม */}
                                            {group.items.map((it) => {
                                                const modified = modifiedIds.includes(it.stockId);
                                                const hasValue = it.purchaseQTY !== "" && it.purchaseQTY !== "0" && it.purchaseQTY !== null;
                                                const hasAnyChange = modified || it.price !== 0 || it.remark !== "";
                                                const rowClass = hasValue ? "bg-info/20 border-info" : hasAnyChange ? "bg-info/10 border-info" : "bg-base-100 border-base-300";
                                                const rowClassItemName = hasValue ? "bg-info/30" : hasAnyChange ? "bg-info/10" : "bg-base-100";
                                                return (
                                                    <tr key={`zero-item-${it.stockId}`} className={rowClass}>
                                                        <td className={`sticky left-0 z-10 text-lg p-1 ${rowClassItemName}`}>{it.itemName}</td>
                                                        <td className="text-right text-lg">{it.requiredQTY}</td>
                                                        <td className="text-right text-lg">{it.totalQTY}</td>

                                                        <td className="text-right text-lg bg-warning/10">
                                                            <div className="flex items-center justify-between">
                                                                <button
                                                                    onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                                    className="btn btn-md btn-outline btn-warning"
                                                                    title="คัดลอกจำนวนที่ต้องซื้อเข้า"
                                                                >
                                                                    📋
                                                                </button>
                                                                <span className="text-right">{it.stockInQTY}</span>
                                                            </div>
                                                        </td>

                                                        {/* ต้องซื้อเข้า */}
                                                        <td className="text-right bg-success/10">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    className="btn btn-md btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                        // ✅ Batch state updates for better performance
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    -
                                                                </button>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="99"
                                                                    className="input input-bordered input-md w-14 text-center text-lg"
                                                                    value={it.purchaseQTY ?? ""}
                                                                    onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                />

                                                                <button
                                                                    className="btn btn-md btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.purchaseQTY || 0) + 1;
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                        {/* หน่วย */}
                                                        <td className="text-left">
                                                            {it.unitTypeName || it.stockUnitTypeName || "หน่วยไม่ระบุ"}
                                                        </td>
                                                        {/* ราคา */}
                                                        <td className="text-right">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="input input-bordered input-primary input-md w-24 text-right text-lg"
                                                                value={it.price || ""}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    setZeroItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                                    );
                                                                    markModified(it.stockId);
                                                                }}
                                                            />
                                                        </td>
                                                        {/* หมายเหตุ */}
                                                        <td className="text-left">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-xs w-40 text-left"
                                                                    value={it.remark}
                                                                    onChange={(e) => {
                                                                        const newRemark = e.target.value;
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* เคลียร์ */}
                                                        <td className="text-right">
                                                            <button
                                                                className="btn btn-md btn-outline btn-error"
                                                                onClick={() => {
                                                                    setZeroItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, remark: "" } : x))
                                                                    );
                                                                    setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                }}
                                                            >
                                                                เคลียร์
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Tablet Zero Items - Grid (768px-1279px) */}
                        <div className="hidden md:block xl:hidden space-y-2 p-2">
                            {(!zeroItems || zeroItems.length === 0) && (
                                <div className="text-center text-base-content/60 p-4">ไม่มีรายการที่ยังไม่ได้นับ</div>
                            )}

                            {zeroGroups.map(group => (
                                <div key={`tablet-zero-grp-${group.id}`} className="space-y-1">
                                    {/* หัวข้อกลุ่ม */}
                                    <div className="bg-warning text-warning-content px-3 py-2 rounded font-bold text-base">
                                        {group.name}
                                    </div>

                                    {/* Grid Layout สำหรับ Tablet */}
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.items.map((it) => {
                                            const modified = modifiedIds.includes(it.stockId);
                                            const hasValue = it.purchaseQTY !== "" && it.purchaseQTY !== "0" && it.purchaseQTY !== null;
                                            const hasAnyChange = modified || it.price !== 0 || it.remark !== "";
                                            const cardClass = hasValue ? "border-info bg-info/20" : hasAnyChange ? "border-info bg-info/10" : "border-base-300 bg-base-100";

                                            return (
                                                <div key={`tablet-zero-${it.stockId}`} className={`border ${cardClass} rounded-lg p-2 shadow-sm`}>
                                                    <div className="grid grid-cols-12 gap-2 items-center">
                                                        {/* ชื่อสินค้า - 3 columns */}
                                                        <div className="col-span-3">
                                                            <div className="font-bold text-base text-primary break-words leading-tight">
                                                                {it.itemName}
                                                            </div>
                                                            <div className="text-sm text-base-content/70 space-x-2">
                                                                <span>ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span></span>
                                                                {/* <span>นับได้: <span className="font-bold">{it.totalQTY}</span></span> */}
                                                            </div>
                                                            <div className="text-sm text-base-content/70">
                                                                หน่วย: <span className="font-bold">{it.unitTypeName || it.stockUnitTypeName || "หน่วยไม่ระบุ"}</span>
                                                            </div>
                                                        </div>

                                                        {/* ต้องซื้อเข้า - 2 columns */}
                                                        {/* <div className="col-span-2">
                                                            <div className="text-sm text-warning font-medium">⚠️ ต้องซื้อเข้า</div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="font-bold text-warning text-base">{it.stockInQTY}</div>
                                                                <button
                                                                    onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                                    className="btn btn-xs btn-outline btn-warning"
                                                                    title="คัดลอก"
                                                                >
                                                                    📋
                                                                </button>
                                                            </div>
                                                        </div> */}

                                                        {/* ซื้อจริง - 3 columns */}
                                                        <div className="col-span-3">
                                                            <div className="text-sm text-success font-medium">✅ ซื้อจริง</div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    -
                                                                </button>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="99"
                                                                    className="input input-bordered input-xs w-14 text-center text-base font-bold"
                                                                    value={it.purchaseQTY ?? ""}
                                                                    onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.purchaseQTY || 0) + 1;
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* ราคาและหมายเหตุ - 3 columns */}
                                                        <div className="col-span-3">
                                                            <div className="grid grid-cols-2 gap-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="input input-bordered input-xs text-right text-sm font-medium"
                                                                    placeholder="ราคา..."
                                                                    value={it.price || ""}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-xs text-sm"
                                                                    placeholder="หมายเหตุ..."
                                                                    value={it.remark || ""}
                                                                    onChange={(e) => {
                                                                        const newRemark = e.target.value;
                                                                        setZeroItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>                                                        {/* เคลียร์ - 1 column */}
                                                        <div className="col-span-1">
                                                            <button
                                                                className="btn btn-xs btn-outline btn-error w-full whitespace-nowrap"
                                                                onClick={() => {
                                                                    setZeroItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, remark: "" } : x))
                                                                    );
                                                                    setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                }}
                                                                title="เคลียร์ข้อมูล"
                                                            >
                                                                เคลียร์ 🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Zero Items - Compact Cards (<768px) */}
                        <div className="md:hidden space-y-1 p-2">
                            {(!zeroItems || zeroItems.length === 0) && (
                                <div className="text-center text-base-content/60 p-2">ไม่มีรายการที่ยังไม่ได้นับ</div>
                            )}

                            {zeroGroups.map(group => (
                                <div key={`mobile-zero-grp-${group.id}`} className="space-y-1">
                                    {/* หัวข้อกลุ่ม Mobile - Compact */}
                                    <div className="bg-warning text-warning-content px-2 py-1 rounded font-bold text-sm">
                                        {group.name}
                                    </div>

                                    {/* รายการในกลุ่ม Mobile - Compact */}
                                    {group.items.map((it) => {
                                        const modified = modifiedIds.includes(it.stockId);
                                        const hasValue = it.purchaseQTY !== "" && it.purchaseQTY !== "0" && it.purchaseQTY !== null;
                                        const hasAnyChange = modified || it.price !== 0 || it.remark !== "";
                                        const cardClass = hasValue ? "border-info bg-info/20" : hasAnyChange ? "border-info bg-info/10" : "border-base-300 bg-base-100";

                                        return (
                                            <div key={`mobile-zero-${it.stockId}`} className={`border ${cardClass} rounded p-2 space-y-1`}>
                                                {/* ชื่อสินค้าและข้อมูลพื้นฐาน */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-2">
                                                        <div className="font-bold text-base text-primary break-words leading-tight">{it.itemName}</div>
                                                        <div className="text-sm text-base-content/70 flex gap-2">
                                                            <span>ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span></span>
                                                            {/* <span>นับได้: <span className="font-bold">{it.totalQTY}</span></span> */}
                                                            <span>หน่วย: <span className="font-bold">{it.unitTypeName || it.stockUnitTypeName || "ไม่ระบุ"}</span></span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-outline btn-error whitespace-nowrap"
                                                        onClick={() => {
                                                            setZeroItems((prev) =>
                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: "", price: 0, remark: "" } : x))
                                                            );
                                                            setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                        }}
                                                        title="เคลียร์"
                                                    >
                                                        เคลียร์ 🗑️
                                                    </button>
                                                </div>

                                                {/* ต้องซื้อเข้า - แนวนอน */}
                                                {/* <div className="flex items-center justify-normal bg-warning/10 rounded px-2 py-1">
                                                    <span className="text-sm text-warning font-medium">⚠️ ต้องซื้อเข้า: <span className="font-bold text-base">{it.stockInQTY}</span></span>
                                                    <button
                                                        onClick={() => { onClickCopyQTYtoPurchaseQTY(it.stockId, it.stockInQTY) }}
                                                        className="btn btn-xs btn-outline btn-warning ml-2"
                                                        title="คัดลอก"
                                                    >
                                                        📋
                                                    </button>
                                                </div> */}

                                                {/* Controls - แนวนอนแบบกะทัดรัด */}
                                                <div className="grid grid-cols-3 gap-2 items-center">
                                                    {/* ซื้อจริง */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            className="btn btn-xs btn-outline btn-error"
                                                            onClick={() => {
                                                                const n = Math.max(0, Number(it.purchaseQTY || 0) - 1);
                                                                setZeroItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                );
                                                                markModified(it.stockId);
                                                            }}
                                                        >
                                                            -
                                                        </button>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="99"
                                                            className="input input-bordered input-xs w-10 text-center text-base font-bold"
                                                            value={it.purchaseQTY ?? ""}
                                                            onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                        />

                                                        <button
                                                            className="btn btn-xs btn-outline btn-success"
                                                            onClick={() => {
                                                                const n = Number(it.purchaseQTY || 0) + 1;
                                                                setZeroItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, purchaseQTY: String(n) } : x))
                                                                );
                                                                markModified(it.stockId);
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* ราคา */}
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="input input-bordered input-xs text-right text-sm font-medium"
                                                        placeholder="ราคา"
                                                        value={it.price || ""}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setZeroItems((prev) =>
                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, price: v } : x))
                                                            );
                                                            markModified(it.stockId);
                                                        }}
                                                    />

                                                    {/* หมายเหตุ */}
                                                    <input
                                                        type="text"
                                                        className="input input-bordered input-xs text-sm"
                                                        placeholder="หมายเหตุ"
                                                        value={it.remark || ""}
                                                        onChange={(e) => {
                                                            const newRemark = e.target.value;
                                                            setZeroItems((prev) =>
                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                            );
                                                            markModified(it.stockId);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Back to Top Button */}
            {showBackToTop && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={scrollToTop}
                        className="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
                        title="กลับไปข้างบน"
                        aria-label="กลับไปข้างบน"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                        </svg>
                    </button>
                </div>
            )}

        </div>
    );
}
