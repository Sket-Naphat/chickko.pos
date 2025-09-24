// src/pages/CheckStockDetail.jsx
import { useEffect, useState, useMemo, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Cookies from "js-cookie";

export default function CheckStockDetail() {
    const { orderId } = useParams(); // "new" หรือเลข id จริง
    const isNew = orderId === "new";
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
    const [itemsNotCounted, setItemsNotCounted] = useState([]);
    const [modifiedIds, setModifiedIds] = useState([]);
    const [invalidIds, setInvalidIds] = useState([]); // แถวที่ qty ว่าง/ไม่ถูกต้อง
    const [errorMsg, setErrorMsg] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    // helper: คืน yyyy-MM-dd แบบ local (ไม่คลาดวัน)
    const todayLocal = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const [orderDate, setOrderDate] = useState(todayLocal());
    const markModified = (id) => {
        setModifiedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    const [groupBy, setGroupBy] = useState("location"); // "location" | "category"
    // กลุ่มรายการตามสถานที่เก็บ พร้อมเรียงตาม StockLocationID และเรียงชื่อสินค้าในกลุ่ม
    const groups = useMemo(() => {
        if (!items || items.length === 0) return [];

        // รองรับชื่อพร็อพได้หลายแบบ
        const catId = (it) => it.stockCategoryID ?? it.stockCategoryId ?? it.categoryID ?? it.categoryId;
        const catName = (it) => it.stockCategoryName ?? it.categoryName;

        const locId = (it) => it.stockLocationID ?? it.stockLocationId ?? it.locationID ?? it.locationId;
        const locName = (it) => it.stockLocationName ?? it.locationName;

        const idOf = (it) => groupBy === "category" ? catId(it) : locId(it);
        const nameOf = (it) => groupBy === "category" ? catName(it) : locName(it);

        const map = new Map(); // id -> { id, name, items: [] }
        for (const it of items) {
            const id = Number(idOf(it) ?? -1); // บังคับเป็นตัวเลขเพื่อเรียงถูก
            const name = nameOf(it) ?? (groupBy === "category" ? `หมวด #${id}` : `ตำแหน่ง #${id}`);
            if (!map.has(id)) map.set(id, { id, name, items: [] });
            map.get(id).items.push(it);
        }

        return Array.from(map.values())
            .sort((a, b) => a.id - b.id) // เรียงกลุ่มตาม id
            .map(g => ({
                ...g,
                items: g.items.sort((a, b) => (a.itemName ?? "").localeCompare(b.itemName ?? "")), // เรียงชื่อในกลุ่ม
            }));
    }, [items, groupBy]);

    // กลุ่มรายการที่ยังไม่ได้นับ
    const groupsNotCounted = useMemo(() => {
        if (!itemsNotCounted || itemsNotCounted.length === 0) return [];

        // รองรับชื่อพร็อพได้หลายแบบ
        const catId = (it) => it.stockCategoryID ?? it.stockCategoryId ?? it.categoryID ?? it.categoryId;
        const catName = (it) => it.stockCategoryName ?? it.categoryName;

        const locId = (it) => it.stockLocationID ?? it.stockLocationId ?? it.locationID ?? it.locationId;
        const locName = (it) => it.stockLocationName ?? it.locationName;

        const idOf = (it) => groupBy === "category" ? catId(it) : locId(it);
        const nameOf = (it) => groupBy === "category" ? catName(it) : locName(it);

        const map = new Map(); // id -> { id, name, items: [] }
        for (const it of itemsNotCounted) {
            const id = Number(idOf(it) ?? -1); // บังคับเป็นตัวเลขเพื่อเรียงถูก
            const name = nameOf(it) ?? (groupBy === "category" ? `หมวด #${id}` : `ตำแหน่ง #${id}`);
            if (!map.has(id)) map.set(id, { id, name, items: [] });
            map.get(id).items.push(it);
        }

        return Array.from(map.values())
            .sort((a, b) => a.id - b.id) // เรียงกลุ่มตาม id
            .map(g => ({
                ...g,
                items: g.items.sort((a, b) => (a.itemName ?? "").localeCompare(b.itemName ?? "")), // เรียงชื่อในกลุ่ม
            }));
    }, [itemsNotCounted, groupBy]);

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
        const ac = new AbortController();     // ใช้ยกเลิก request เมื่อ component unmount
        setLoading(true);

        (async () => {
            try {
                if (isNew) {
                    // 🔹 โหมดสร้างใหม่: ดึงรายการสต๊อกทั้งหมด แล้วตั้ง qty = "" ให้ผู้ใช้กรอกเอง
                    const res = await api.get("/stock/GetCurrentStock");
                    const raw = res?.data?.data ?? [];  // backend ห่อใน { success, data, message }
                    const list = raw.map(s => ({
                        stockId: s.stockId,
                        itemName: s.itemName,
                        stockCategoryID: s.stockCategoryID,
                        stockCategoryName: s.stockCategoryName,
                        stockUnitTypeID: s.stockUnitTypeID,
                        stockUnitTypeName: s.stockUnitTypeName,
                        stockLocationID: s.stockLocationID,
                        stockLocationName: s.stockLocationName,
                        totalQTY: "", // ให้กรอกเอง"",
                        requiredQTY: s.requiredQTY,
                        stockInQTY: 0,
                        remark: s.remark
                    }));
                    setItems(list);

                } else {
                    // 🔹 โหมดแก้ไขใบเดิม: ดึงรายการของใบนี้ แล้วแสดง qty เดิม
                    const res = await api.post("/stock/GetStockCountLogByCostId", {
                        costId: orderId
                    });
                    const raw = res?.data.stockCountDtos ?? [];  // backend ห่อใน { success, data, message }
                    const list = raw.map(s => ({
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
                        remark: s.remark
                    }));

                    const rawNotCount = res?.data.stockNotCountDtos ?? [];  // backend ห่อใน { success, data, message }
                    const listNotCounted = rawNotCount.map(s => ({
                        stockLogId: s.stockLogId,
                        stockId: s.stockId,
                        itemName: s.itemName,
                        stockCategoryID: s.stockCategoryID,
                        stockCategoryName: s.stockCategoryName,
                        stockUnitTypeID: s.stockUnitTypeID,
                        stockUnitTypeName: s.stockUnitTypeName,
                        stockLocationID: s.stockLocationID,
                        stockLocationName: s.stockLocationName,
                        totalQTY: "", // ให้กรอกเอง"",
                        requiredQTY: s.requiredQTY,
                        stockInQTY: 0,
                        remark: s.remark
                    }));

                    setItems(list);
                    setItemsNotCounted(listNotCounted);
                    setOrderDate(raw[0]?.stockCountDate || todayLocal()); // ตั้งวันที่ตามใบสั่ง
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
    }, [isNew, orderId]);



    const onQtyChange = (stockId, value) => {
        // อนุญาตค่าว่างชั่วคราว + ตัวเลขบวกเท่านั้น
        if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
            setItems((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, totalQTY: value } : x)));
            setInvalidIds((prev) => prev.filter((x) => x !== stockId)); // ถ้าพิมพ์แล้วถูกต้อง เอาออกจาก invalid
            markModified(stockId);
        }
        //ถ้าเป็นตัวเลขให้คิดค่า stockInQTY อัตโนมัติ
        if (/^\d+$/.test(value)) {
            const requiredQTY = items.find(it => it.stockId === stockId)?.requiredQTY || 0;
            const stockInQTY = requiredQTY - Number(value);
            setItems((prev) =>
                prev.map((x) => (x.stockId === stockId ? { ...x, stockInQTY: String(stockInQTY < 0 ? 0 : stockInQTY) } : x))
            );
        }
    };

    // ฟังก์ชันสำหรับรายการที่ยังไม่ได้นับ
    const onQtyChangeNotCounted = (stockId, value) => {
        // อนุญาตค่าว่างชั่วคราว + ตัวเลขบวกเท่านั้น
        if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
            setItemsNotCounted((prev) => prev.map((x) => (x.stockId === stockId ? { ...x, totalQTY: value } : x)));
            setInvalidIds((prev) => prev.filter((x) => x !== stockId)); // ถ้าพิมพ์แล้วถูกต้อง เอาออกจาก invalid
            markModified(stockId);
        }
        //ถ้าเป็นตัวเลขให้คิดค่า stockInQTY อัตโนมัติ
        if (/^\d+$/.test(value)) {
            const requiredQTY = itemsNotCounted.find(it => it.stockId === stockId)?.requiredQTY || 0;
            const stockInQTY = requiredQTY - Number(value);
            setItemsNotCounted((prev) =>
                prev.map((x) => (x.stockId === stockId ? { ...x, stockInQTY: String(stockInQTY < 0 ? 0 : stockInQTY) } : x))
            );
        }
    };

    const validate = () => {
        // ไม่ต้องตรวจสอบว่าทุกรายการต้องกรอก เพียงแค่มีรายการที่จะบันทึกอย่างน้อย 1 รายการ
        const itemsToSave = items.filter((it) => it.totalQTY !== "" && it.totalQTY !== null && it.totalQTY !== undefined);
        if (itemsToSave.length === 0) {
            setErrorMsg("กรุณานับอย่างน้อย 1 รายการก่อนบันทึก");
            return false;
        }
        setErrorMsg("");
        return true;
    };

    const save = async () => {
        if (!validate()) return;

        setIsSaving(true);

        const nowTime = new Date().toLocaleTimeString("en-GB", {
            hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
        });

        const toIntOrNull = (v) =>
            v === "" || v === null || v === undefined ? null : Number(v);

        // บันทึกเฉพาะรายการที่มีการนับได้เท่านั้น (รวมทั้งรายการเดิมและรายการที่ยังไม่ได้นับ)
        const itemsToSave = items.filter((it) => it.totalQTY !== "" && it.totalQTY !== null && it.totalQTY !== undefined);
        const itemsNotCountedToSave = itemsNotCounted.filter((it) => it.totalQTY !== "" && it.totalQTY !== null && it.totalQTY !== undefined);
        
        // รวมรายการทั้งหมดที่จะบันทึก
        const allItemsToSave = [...itemsToSave, ...itemsNotCountedToSave];
        
        const payload = allItemsToSave.map((it) => ({
            stockLogId: it.stockLogId || 0, // ถ้าไม่มีคือสร้างใหม่
            costId: isNew ? 0 : Number(orderId),
            stockId: Number(it.stockId),
            StockCountDate: orderDate,
            StockCountTime: nowTime,
            totalQTY: Number(it.totalQTY || 0),
            requiredQTY: toIntOrNull(it.requiredQTY),
            stockInQTY: toIntOrNull(it.stockInQTY),
            remark: it.remark ?? "",
            UpdateBy: authData?.userId ?? 0,
        }));

        try {
            if (isNew) {
                await api.post("/stock/CreateStockCount", payload, { timeout: 120000 });
            } else {
                const updateStockCountDto = {
                    StockCountDto: payload,
                    StockCountDate: orderDate,
                    CostID: Number(orderId)
                };

                await api.post("/stock/UpdateStockCount", updateStockCountDto, { timeout: 120000 });
            }

            // ✅ แสดง alert แทน toast
            setAlertTitle("บันทึกสำเร็จ");
            setAlertMessage(`บันทึกข้อมูลเรียบร้อยแล้ว (${allItemsToSave.length} รายการ)`);
            setAlertNext(() => () => {
                navigate("/stock", { state: { shouldRefresh: true } });
            });
            setAlertOpen(true);

        } catch (err) {
            console.error(err);
            // แสดง alert กรณี error ก็ได้ (ถ้าต้องการ)
            setAlertTitle("บันทึกไม่สำเร็จ");
            setAlertMessage("กรุณาลองใหม่อีกครั้ง");
            setAlertNext(() => () => { }); // ไม่ต้องทำอะไรต่อ
            setAlertOpen(true);
        } finally {
            setIsSaving(false);
        }
    };


    // เปลี่ยนเงื่อนไขการปิดปุ่มบันทึก - ให้บันทึกได้ถ้ามีรายการที่นับแล้วอย่างน้อย 1 รายการ (รวมทั้งรายการเดิมและรายการที่ยังไม่ได้นับ)
    const itemsWithCount = items.filter((it) => it.totalQTY !== "" && it.totalQTY !== null && it.totalQTY !== undefined);
    const itemsNotCountedWithCount = itemsNotCounted.filter((it) => it.totalQTY !== "" && it.totalQTY !== null && it.totalQTY !== undefined);
    const totalItemsWithCount = itemsWithCount.length + itemsNotCountedWithCount.length;
    const isSaveDisabled = totalItemsWithCount === 0;

    // State สำหรับปุ่มกลับด้านบน
    const [showBackToTop, setShowBackToTop] = useState(false);

    // ตรวจสอบการ scroll เพื่อแสดงปุ่มกลับด้านบน
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ฟังก์ชันกลับด้าน���น
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="p-2 sm:p-4 space-y-3 max-w-full overflow-hidden">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-primary break-words">
                    {isNew ? "✏️ สร้างรายการเช็ค Stock ใหม่" : `จัดการรายการใบสั่ง: ${orderId}`}
                </h1>
            </div>
            {/* Footer - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 bg-base-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium">📅 วันที่สั่งซื้อ:</label>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full sm:w-40"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                    />
                </div>
                
                <button
                    className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
                    onClick={save}
                    disabled={isSaveDisabled || isSaving}
                    title={isSaveDisabled ? "กรุณานับอย่างน้อย 1 รายการก่อนบันทึก" : `บันทึก ${totalItemsWithCount} รายการที่นับแล้ว`}
                >
                    {isSaving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            กำลังบันทึก...
                        </>
                    ) : (
                        `💾 บันทึก${totalItemsWithCount > 0 ? ` (${totalItemsWithCount})` : ""}`
                    )}
                </button>
            </div>
            {/* Group Toggle Buttons - Mobile Friendly */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <div className="join w-full sm:w-auto">
                    <button
                        className={`btn btn-sm flex-1 sm:flex-none text-base sm:text-lg join-item ${groupBy === "location" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("location")}
                        title="จัดเรียงตามตำแหน่งเก็บ"
                    >
                        📍 ตำแหน่งเก็บ
                    </button>
                    <button
                        className={`btn btn-sm flex-1 sm:flex-none text-base sm:text-lg join-item ${groupBy === "category" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("category")}
                        title="จัดเรียงตามหมวดหมู่"
                    >
                        📂 หมวดหมู่
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="alert alert-warning">
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Mobile & Desktop Table Container */}
            <div className="card bg-base-100 shadow">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex items-center gap-2 p-4">
                            <span className="loading loading-spinner loading-sm"></span> ⏳ กำลังโหลด…
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden xl:block overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 bg-base-100 z-20 text-lg min-w-32">รายการ</th>
                                            <th className="text-center text-sm">ที่ต้องใช้</th>
                                            <th className="text-center bg-secondary text-secondary-content text-sm">☝️ นับได้</th>
                                            <th className="text-center bg-success text-success-content text-sm">✅ ต้องซื้อ</th>
                                            <th className="text-center text-sm">หน่วย</th>
                                            <th className="text-center text-sm">หมายเหตุ</th>
                                            <th className="text-center text-sm">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!items || items.length === 0) && (
                                            <tr>
                                                <td colSpan="7" className="text-center text-base-content/60 p-4">ไม่มีรายการ</td>
                                            </tr>
                                        )}

                                        {groups.map(group => (
                                            <Fragment key={`grp-${group.id}`}>
                                                {/* หัวข้อกลุ่ม */}
                                                <tr className="bg-base-200">
                                                    <td colSpan={7} className="font-bold text-sm bg-info p-2" >
                                                        {group.name}
                                                    </td>
                                                </tr>

                                                {/* รายการในกลุ่ม - Desktop */}
                                                {group.items.map((it) => {
                                                    const modified = modifiedIds.includes(it.stockId);
                                                    const invalid = invalidIds.includes(it.stockId);
                                                    const rowClass = invalid ? "bg-error/30" : modified ? "bg-warning/20" : "";
                                                    return (
                                                        <tr key={it.stockId} className={rowClass}>
                                                            <td className="sticky left-0 bg-base-100 z-10 text-sm p-2 min-w-32">
                                                                {it.itemName}
                                                            </td>
                                                            <td className="text-center text-sm p-1">{it.requiredQTY}</td>

                                                            {/* นับได้ */}
                                                            <td className="text-center bg-secondary/10 p-1">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        className="btn btn-xs btn-outline btn-error"
                                                                        onClick={() => {
                                                                            const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                            let stockInQTY = it.requiredQTY - n;
                                                                            stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                )
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
                                                                        className="input input-bordered input-xs w-12 text-center text-sm"
                                                                        value={it.totalQTY}
                                                                        onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                    />

                                                                    <button
                                                                        className="btn btn-xs btn-outline btn-success"
                                                                        onClick={() => {
                                                                            const n = Number(it.totalQTY || 0) + 1;
                                                                            let stockInQTY = it.requiredQTY - n;
                                                                            stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                )
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* ต้องซื้อเข้า */}
                                                            <td className="text-center bg-success/10 p-1">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        className="btn btn-xs btn-outline btn-error"
                                                                        onClick={() => {
                                                                            const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                        className="input input-bordered input-xs w-12 text-center text-sm"
                                                                        value={it.stockInQTY}
                                                                        onChange={(e) => {
                                                                            const v = e.target.value;
                                                                            if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }
                                                                        }}
                                                                    />

                                                                    <button
                                                                        className="btn btn-xs btn-outline btn-success"
                                                                        onClick={() => {
                                                                            const n = Number(it.stockInQTY || 0) + 1;
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                            <td className="text-center text-xs p-1">
                                                                {it.unitTypeName || it.stockUnitTypeName || ""}
                                                            </td>

                                                            {/* หมายเหตุ */}
                                                            <td className="text-center p-1">
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-xs w-20 text-center text-xs"
                                                                    value={it.remark}
                                                                    placeholder="หมายเหตุ"
                                                                    onChange={(e) => {
                                                                        const newRemark = e.target.value;
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                            </td>

                                                            {/* เคลียร์ */}
                                                            <td className="text-center p-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                                        );
                                                                        setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    }}
                                                                    title="เคลียร์ข้อมูล"
                                                                >
                                                                    🗑️
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

                            {/* Tablet View - Medium screens */}
                            <div className="hidden md:block xl:hidden overflow-x-auto">
                                <div className="space-y-2 p-3">
                                    {(!items || items.length === 0) && (
                                        <div className="text-center text-base-content/60 p-4">ไม่มีรายการ</div>
                                    )}

                                    {groups.map(group => (
                                        <div key={`tablet-grp-${group.id}`} className="space-y-2">
                                            {/* หัวข้อกลุ่ม Tablet */}
                                            <div className="bg-info text-info-content p-3 rounded-lg font-bold text-sm">
                                                {group.name}
                                            </div>

                                            {/* Grid Layout สำหรับ Tablet */}
                                            <div className="grid grid-cols-1 gap-3">
                                                {group.items.map((it) => {
                                                    const modified = modifiedIds.includes(it.stockId);
                                                    const invalid = invalidIds.includes(it.stockId);
                                                    const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";
                                                    
                                                    return (
                                                        <div key={`tablet-${it.stockId}`} className={`border ${cardClass} rounded-lg p-4 shadow-sm`}>
                                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                                {/* ชื่อสินค้า - 4 columns */}
                                                                <div className="col-span-4">
                                                                    <div className="font-bold text-primary break-words text-lg">
                                                                        {it.itemName}
                                                                    </div>
                                                                    <div className="text-lg text-base-content/70 mt-1">
                                                                        ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span> {it.unitTypeName || it.stockUnitTypeName || ""}
                                                                    </div>
                                                                </div>

                                                                {/* จำนวนที่นับได้ - 3 columns */}
                                                                <div className="col-span-3">
                                                                    <label className="text-lg text-base-content/70 block mb-2">☝️ จำนวนที่นับได้</label>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            className="btn btn-sm btn-outline btn-error"
                                                                            onClick={() => {
                                                                                const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                                let stockInQTY = it.requiredQTY - n;
                                                                                stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) =>
                                                                                        x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                    )
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
                                                                            className="input input-bordered input-sm w-16 text-center text-base font-bold"
                                                                            value={it.totalQTY}
                                                                            onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                        />

                                                                        <button
                                                                            className="btn btn-sm btn-outline btn-success"
                                                                            onClick={() => {
                                                                                const n = Number(it.totalQTY || 0) + 1;
                                                                                let stockInQTY = it.requiredQTY - n;
                                                                                stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) =>
                                                                                        x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                    )
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* จำนวนที่ต้องซื้อ - 3 columns */}
                                                                <div className="col-span-3">
                                                                    <label className="text-lg text-base-content/70 block mb-2">✅ จำนวนที่ต้องซื้อ</label>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            className="btn btn-sm btn-outline btn-error"
                                                                            onClick={() => {
                                                                                const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                            className="input input-bordered input-sm w-16 text-center text-base font-bold"
                                                                            value={it.stockInQTY}
                                                                            onChange={(e) => {
                                                                                const v = e.target.value;
                                                                                if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                                    setItems((prev) =>
                                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                                    );
                                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                    markModified(it.stockId);
                                                                                }
                                                                            }}
                                                                        />

                                                                        <button
                                                                            className="btn btn-sm btn-outline btn-success"
                                                                            onClick={() => {
                                                                                const n = Number(it.stockInQTY || 0) + 1;
                                                                                setItems((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* หมายเหตุและจัดการ - 2 columns */}
                                                                <div className="col-span-2 space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-sm w-full text-sm"
                                                                        placeholder="หมายเหตุ..."
                                                                        value={it.remark}
                                                                        onChange={(e) => {
                                                                            const newRemark = e.target.value;
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                            );
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        className="btn btn-sm btn-outline btn-error w-full"
                                                                        onClick={() => {
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                                            );
                                                                            setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        }}
                                                                        title="เคลียร์ข้อมูล"
                                                                    >
                                                                        🗑️ เคลียร์
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

                            {/* Mobile Compact View */}
                            <div className="md:hidden space-y-2 p-2">
                                {(!items || items.length === 0) && (
                                    <div className="text-center text-base-content/60 p-4">ไม่มีรายการ</div>
                                )}

                                {groups.map(group => (
                                    <div key={`mobile-grp-${group.id}`} className="space-y-1">
                                        {/* หัวข้อกลุ่ม Mobile - Compact */}
                                        <div className="bg-info text-info-content px-3 py-2 rounded font-bold text-xs">
                                            {group.name}
                                        </div>

                                        {/* รายการในกลุ่ม Mobile - Compact */}
                                        {group.items.map((it) => {
                                            const modified = modifiedIds.includes(it.stockId);
                                            const invalid = invalidIds.includes(it.stockId);
                                            const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";
                                            
                                            return (
                                                <div key={`mobile-${it.stockId}`} className={`border ${cardClass} rounded p-2 space-y-2`}>
                                                    {/* ชื่อสินค้าและข้อมูลพื้นฐาน */}
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 pr-2">
                                                            <div className="font-bold text-lg text-primary break-words mb-1">{it.itemName}</div>
                                                            <div className="text-md text-base-content/70">
                                                                ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span> {it.unitTypeName || it.stockUnitTypeName || ""}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-xs btn-outline btn-error"
                                                            onClick={() => {
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                                );
                                                                setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                            }}
                                                            title="เคลียร์"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>

                                                    {/* Controls ในแนวนอน */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* นับได้ */}
                                                        <div>
                                                            <label className="text-xs text-base-content/70 block mb-1">☝️ นับได้</label>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                        let stockInQTY = it.requiredQTY - n;
                                                                        stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                        setItems((prev) =>
                                                                            prev.map((x) =>
                                                                                x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                            )
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
                                                                    className="input input-bordered input-xs w-12 text-center text-sm font-bold"
                                                                    value={it.totalQTY}
                                                                    onChange={(e) => onQtyChange(it.stockId, e.target.value)}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.totalQTY || 0) + 1;
                                                                        let stockInQTY = it.requiredQTY - n;
                                                                        stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                        setItems((prev) =>
                                                                            prev.map((x) =>
                                                                                x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                            )
                                                                        );
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* ต้องซื้อ */}
                                                        <div>
                                                            <label className="text-xs text-base-content/70 block mb-1">✅ ต้องซื้อ</label>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                    className="input input-bordered input-xs w-12 text-center text-sm font-bold"
                                                                    value={it.stockInQTY}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.stockInQTY || 0) + 1;
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
                                                                        );
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* หมายเหตุ */}
                                                    <input
                                                        type="text"
                                                        className="input input-bordered input-xs w-full text-xs"
                                                        placeholder="หมายเหตุ..."
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
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* รายการที่ยังไม่ได้นับ - แสดงเฉพาะในโหมดแก้ไข */}
            {!isNew && itemsNotCounted.length > 0 && (
                <div className="card bg-base-100 shadow mt-6">
                    <div className="card-header bg-warning text-warning-content p-4">
                        <h2 className="text-lg font-bold">📝 รายการที่ยังไม่ได้นับ ({itemsNotCounted.length} รายการ)</h2>
                        <p className="text-sm opacity-90">รายการเหล่านี้ยังไม่ได้ทำการตรวจนับ สามารถนับเพิ่มได้</p>
                    </div>
                    <div className="card-body p-0">
                        {/* Desktop Table View - รายการที่ยังไม่ได้นับ */}
                        <div className="hidden xl:block overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 bg-base-100 z-20 text-lg min-w-32">รายการ</th>
                                        <th className="text-center text-sm">ที่ต้องใช้</th>
                                        <th className="text-center bg-secondary text-secondary-content text-sm">☝️ นับได้</th>
                                        <th className="text-center bg-success text-success-content text-sm">✅ ต้องซื้อ</th>
                                        <th className="text-center text-sm">หน่วย</th>
                                        <th className="text-center text-sm">หมายเหตุ</th>
                                        <th className="text-center text-sm">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupsNotCounted.map(group => (
                                        <Fragment key={`notcounted-grp-${group.id}`}>
                                            {/* หัวข้อกลุ่ม */}
                                            <tr className="bg-base-200">
                                                <td colSpan={7} className="font-bold text-sm bg-warning p-2">
                                                    {group.name}
                                                </td>
                                            </tr>

                                            {/* รายการในกลุ่ม - Desktop */}
                                            {group.items.map((it) => {
                                                const modified = modifiedIds.includes(it.stockId);
                                                const invalid = invalidIds.includes(it.stockId);
                                                const rowClass = invalid ? "bg-error/30" : modified ? "bg-warning/20" : "";
                                                return (
                                                    <tr key={`notcounted-${it.stockId}`} className={rowClass}>
                                                        <td className="sticky left-0 bg-base-100 z-10 text-sm p-2 min-w-32">
                                                            {it.itemName}
                                                        </td>
                                                        <td className="text-center text-sm p-1">{it.requiredQTY}</td>

                                                        {/* นับได้ */}
                                                        <td className="text-center bg-secondary/10 p-1">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                        let stockInQTY = it.requiredQTY - n;
                                                                        stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) =>
                                                                                x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                            )
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
                                                                    className="input input-bordered input-xs w-12 text-center text-sm"
                                                                    value={it.totalQTY}
                                                                    onChange={(e) => onQtyChangeNotCounted(it.stockId, e.target.value)}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.totalQTY || 0) + 1;
                                                                        let stockInQTY = it.requiredQTY - n;
                                                                        stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) =>
                                                                                x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                            )
                                                                        );
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* ต้องซื้อเข้า */}
                                                        <td className="text-center bg-success/10 p-1">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                    className="input input-bordered input-xs w-12 text-center text-sm"
                                                                    value={it.stockInQTY}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                            setItemsNotCounted((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.stockInQTY || 0) + 1;
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                        <td className="text-center text-xs p-1">
                                                            {it.unitTypeName || it.stockUnitTypeName || ""}
                                                        </td>

                                                        {/* หมายเหตุ */}
                                                        <td className="text-center p-1">
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-xs w-20 text-center text-xs"
                                                                value={it.remark}
                                                                placeholder="หมายเหตุ"
                                                                onChange={(e) => {
                                                                    const newRemark = e.target.value;
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                    );
                                                                    markModified(it.stockId);
                                                                }}
                                                            />
                                                        </td>

                                                        {/* เคลียร์ */}
                                                        <td className="text-center p-1">
                                                            <button
                                                                className="btn btn-xs btn-outline btn-error"
                                                                onClick={() => {
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                                    );
                                                                    setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                }}
                                                                title="เคลียร์ข้อมูล"
                                                            >
                                                                🗑️
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

                        {/* Tablet View - รายการที่ยังไม่ได้นับ */}
                        <div className="hidden md:block xl:hidden overflow-x-auto">
                            <div className="space-y-2 p-3">
                                {groupsNotCounted.map(group => (
                                    <div key={`notcounted-tablet-grp-${group.id}`} className="space-y-2">
                                        {/* หัวข้อกลุ่ม Tablet */}
                                        <div className="bg-warning text-warning-content p-3 rounded-lg font-bold text-sm">
                                            {group.name}
                                        </div>

                                        {/* Grid Layout สำหรับ Tablet - รายการที่ยังไม่ได้นับ */}
                                        <div className="grid grid-cols-1 gap-3">
                                            {group.items.map((it) => {
                                                const modified = modifiedIds.includes(it.stockId);
                                                const invalid = invalidIds.includes(it.stockId);
                                                const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";
                                                
                                                return (
                                                    <div key={`notcounted-tablet-${it.stockId}`} className={`border ${cardClass} rounded-lg p-4 shadow-sm`}>
                                                        <div className="grid grid-cols-12 gap-4 items-center">
                                                            {/* ชื่อสินค้า - 4 columns */}
                                                            <div className="col-span-4">
                                                                <div className="font-bold text-primary break-words text-lg">
                                                                    {it.itemName}
                                                                </div>
                                                                <div className="text-lg text-base-content/70 mt-1">
                                                                    ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span> {it.unitTypeName || it.stockUnitTypeName || ""}
                                                                </div>
                                                            </div>

                                                            {/* จำนวนที่นับได้ - 3 columns */}
                                                            <div className="col-span-3">
                                                                <label className="text-lg text-base-content/70 block mb-2">☝️ จำนวนที่นับได้</label>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        className="btn btn-sm btn-outline btn-error"
                                                                        onClick={() => {
                                                                            const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                            let stockInQTY = it.requiredQTY - n;
                                                                            stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                            setItemsNotCounted((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                )
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
                                                                        className="input input-bordered input-sm w-16 text-center text-base font-bold"
                                                                        value={it.totalQTY}
                                                                        onChange={(e) => onQtyChangeNotCounted(it.stockId, e.target.value)}
                                                                    />

                                                                    <button
                                                                        className="btn btn-sm btn-outline btn-success"
                                                                        onClick={() => {
                                                                            const n = Number(it.totalQTY || 0) + 1;
                                                                            let stockInQTY = it.requiredQTY - n;
                                                                            stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                            setItemsNotCounted((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                                )
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* จำนวนที่ต้องซื้อ - 3 columns */}
                                                            <div className="col-span-3">
                                                                <label className="text-lg text-base-content/70 block mb-2">✅ จำนวนที่ต้องซื้อ</label>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        className="btn btn-sm btn-outline btn-error"
                                                                        onClick={() => {
                                                                            const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                            setItemsNotCounted((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                        className="input input-bordered input-sm w-16 text-center text-base font-bold"
                                                                        value={it.stockInQTY}
                                                                        onChange={(e) => {
                                                                            const v = e.target.value;
                                                                            if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                                setItemsNotCounted((prev) =>
                                                                                    prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                                );
                                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                                markModified(it.stockId);
                                                                            }
                                                                        }}
                                                                    />

                                                                    <button
                                                                        className="btn btn-sm btn-outline btn-success"
                                                                        onClick={() => {
                                                                            const n = Number(it.stockInQTY || 0) + 1;
                                                                            setItemsNotCounted((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* หมายเหตุและจัดการ - 2 columns */}
                                                            <div className="col-span-2 space-y-2">
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-sm w-full text-sm"
                                                                    placeholder="หมายเหตุ..."
                                                                    value={it.remark}
                                                                    onChange={(e) => {
                                                                        const newRemark = e.target.value;
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }}
                                                                />
                                                                <button
                                                                    className="btn btn-sm btn-outline btn-error w-full"
                                                                    onClick={() => {
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                                        );
                                                                        setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    }}
                                                                    title="เคลียร์ข้อมูล"
                                                                >
                                                                    🗑️ เคลียร์
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

                        {/* Mobile View - รายการที่ยังไม่ได้นับ */}
                        <div className="md:hidden space-y-2 p-2">
                            {groupsNotCounted.map(group => (
                                <div key={`notcounted-mobile-grp-${group.id}`} className="space-y-1">
                                    {/* หัวข้อกลุ่ม Mobile */}
                                    <div className="bg-warning text-warning-content px-3 py-2 rounded font-bold text-xs">
                                        {group.name}
                                    </div>

                                    {/* รายการในกลุ่ม Mobile */}
                                    {group.items.map((it) => {
                                        const modified = modifiedIds.includes(it.stockId);
                                        const invalid = invalidIds.includes(it.stockId);
                                        const cardClass = invalid ? "border-error bg-error/10" : modified ? "border-warning bg-warning/10" : "border-base-300";
                                        
                                        return (
                                            <div key={`notcounted-mobile-${it.stockId}`} className={`border ${cardClass} rounded p-2 space-y-2`}>
                                                {/* ชื่อสินค้าและข้อมูลพื้นฐาน */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-2">
                                                        <div className="font-bold text-lg text-primary break-words mb-1">{it.itemName}</div>
                                                        <div className="text-md text-base-content/70">
                                                            ต้องใช้: <span className="font-bold text-accent">{it.requiredQTY}</span> {it.unitTypeName || it.stockUnitTypeName || ""}
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-outline btn-error"
                                                        onClick={() => {
                                                            setItemsNotCounted((prev) =>
                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
                                                            );
                                                            setModifiedIds((prev) => prev.filter((x) => x !== it.stockId));
                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                        }}
                                                        title="เคลียร์"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>

                                                {/* Controls ในแนวนอน */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    {/* นับได้ */}
                                                    <div>
                                                        <label className="text-xs text-base-content/70 block mb-1">☝️ นับได้</label>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="btn btn-xs btn-outline btn-error"
                                                                onClick={() => {
                                                                    const n = Math.max(0, Number(it.totalQTY || 0) - 1);
                                                                    let stockInQTY = it.requiredQTY - n;
                                                                    stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) =>
                                                                            x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                        )
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
                                                                className="input input-bordered input-xs w-12 text-center text-sm font-bold"
                                                                value={it.totalQTY}
                                                                onChange={(e) => onQtyChangeNotCounted(it.stockId, e.target.value)}
                                                            />

                                                            <button
                                                                className="btn btn-xs btn-outline btn-success"
                                                                onClick={() => {
                                                                    const n = Number(it.totalQTY || 0) + 1;
                                                                    let stockInQTY = it.requiredQTY - n;
                                                                    stockInQTY = stockInQTY < 0 ? 0 : stockInQTY;
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) =>
                                                                            x.stockId === it.stockId ? { ...x, totalQTY: String(n), stockInQTY: String(stockInQTY) } : x
                                                                        )
                                                                    );
                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* ต้องซื้อ */}
                                                    <div>
                                                        <label className="text-xs text-base-content/70 block mb-1">✅ ต้องซื้อ</label>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                className="btn btn-xs btn-outline btn-error"
                                                                onClick={() => {
                                                                    const n = Math.max(0, Number(it.stockInQTY || 0) - 1);
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
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
                                                                className="input input-bordered input-xs w-12 text-center text-sm font-bold"
                                                                value={it.stockInQTY}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                        setItemsNotCounted((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: v } : x))
                                                                        );
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        markModified(it.stockId);
                                                                    }
                                                                }}
                                                            />

                                                            <button
                                                                className="btn btn-xs btn-outline btn-success"
                                                                onClick={() => {
                                                                    const n = Number(it.stockInQTY || 0) + 1;
                                                                    setItemsNotCounted((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, stockInQTY: String(n) } : x))
                                                                    );
                                                                    setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* หมายเหตุ */}
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full text-xs"
                                                    placeholder="หมายเหตุ..."
                                                    value={it.remark}
                                                    onChange={(e) => {
                                                        const newRemark = e.target.value;
                                                        setItemsNotCounted((prev) =>
                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, remark: newRemark } : x))
                                                        );
                                                        markModified(it.stockId);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
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
                    {/* ไม่ใส่ปุ่ม/label บน backdrop → ผู้ใช้กดพื้นหลังแล้วจะไม่ปิด */}
                    <div className="modal-backdrop"></div>
                </div>
            )}

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 btn btn-circle btn-primary shadow-lg z-50 hover:scale-110 transition-transform duration-200"
                    title="กลับด้านบน"
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
                            d="M5 10l7-7m0 0l7 7m-7-7v18" 
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
