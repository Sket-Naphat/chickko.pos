// src/pages/CheckStockDetail.jsx
import { useEffect, useState, useMemo, Fragment, useRef } from "react";
import ModalUpdateStockItem from "../components/stock/ModalUpdateStockItem"
// import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import Toast from "../components/ui/Toast";
export default function CheckStockDetail() {

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
    const [modifiedIds, setModifiedIds] = useState([]);
    const [invalidIds, setInvalidIds] = useState([]); // แถวที่ qty ว่าง/ไม่ถูกต้อง
    const [errorMsg, setErrorMsg] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshData = () => {
        // ฟังก์ชันสำหรับรีเฟรชข้อมูล
        setRefreshKey((prev) => prev + 1);
    };

    // State for refreshing dropdowns
    const [refreshDropdownKey, setRefreshDropdownKey] = useState(0);

    const markModified = (id) => {
        setModifiedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };
    const [groupBy, setGroupBy] = useState("category"); // "location" | "category"
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

    // ...ใน component

    // ปุ่ม OK ของ modal

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);

        (async () => {
            try {
                const res = await api.get("/stock/GetAllStockItem");
                const raw = res?.data?.data ?? [];  // backend ห่อใน { success, data, message }
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
                    remark: s.remark,
                    active: s.active,
                }));
                setItems(list);
                // ✅ ค่าเริ่มต้น: เคลียร์สถานะไฮไลต์/ไม่ถูกต้องทุกครั้งที่โหลดใหม่
                setModifiedIds?.([]);
                setInvalidIds?.([]);
                setErrorMsg?.("");

            } catch (err) {
                if (ac.signal.aborted) return;    // ถ้าถูกยกเลิก ไม่ต้องทำอะไรต่อ
                console.error(err);
                setItems([]);
                setErrorMsg?.("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            } finally {
                if (!ac.signal.aborted) setLoading(false);
            }
        })();

        return () => ac.abort();              // cleanup: ยกเลิก request เมื่อ unmount
    }, [refreshKey]);



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

    // Unit list state
    const [unitList, setUnitList] = useState([]);
    // Location list state
    const [locationList, setLocationList] = useState([]);
    // Category list state
    const [categoryList, setCategoryList] = useState([]);

    // Fetch unit list and location list on mount
    useEffect(() => {
        let ac = new AbortController();
        (async () => {
            try {
                const unitRes = await api.get("/stock/GetStockUnitType", {}, { signal: ac.signal });
                setUnitList(unitRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลหน่วยไม่สำเร็จ", err);
                }
            }
            try {
                const locationRes = await api.get("/stock/GetStockLocation", {}, { signal: ac.signal });
                setLocationList(locationRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลตำแหน่งไม่สำเร็จ", err);
                }
            }
            try {
                const categoryRes = await api.get("/stock/GetStockCategory", {}, { signal: ac.signal });
                setCategoryList(categoryRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ", err);
                }
            }

        })();
        return () => ac.abort();
    }, []);

    // const handleAlertOk = () => {
    //     setAlertOpen(false);
    // };
    
    const handleSave = async (item) => {
        if (!item) return;

        // ✅ เพิ่ม validation สำหรับทุก dropdown ใหม่
        if (newUnitRows.has(item.stockId) && !newUnitNames[item.stockId]?.trim()) {
            showToast("กรุณากรอกชื่อหน่วยใหม่", "error");
            return;
        }
        if (newLocationRows.has(item.stockId) && !newLocationNames[item.stockId]?.trim()) {
            showToast("กรุณากรอกชื่อตำแหน่งใหม่", "error");
            return;
        }
        if (newCategoryRows.has(item.stockId) && !newCategoryNames[item.stockId]?.trim()) {
            showToast("กรุณากรอกชื่อหมวดใหม่", "error");
            return;
        }

        try {
            setLoading(true);
            
            const payload = {
                stockId: item.stockId,
                itemName: item.itemName?.trim(),
                stockCategoryID: item.stockCategoryID,
                stockLocationID: item.stockLocationID,
                stockUnitTypeID: item.stockUnitTypeID,
                requiredQTY: item.requiredQTY,
                totalQTY: item.totalQTY,
                stockInQTY: item.stockInQTY,
                active: item.active,
                // ✅ เพิ่มข้อมูลใหม่
                StockUnitTypeName: newUnitNames[item.stockId]?.trim() || "ไม่ระบุ",
                StockLocationName: newLocationNames[item.stockId]?.trim() || "ไม่ระบุ",
                StockCategoryName: newCategoryNames[item.stockId]?.trim() || "ไม่ระบุ"
            };

            await api.post("/stock/UpdateStockDetail", payload);
            
            // ✅ เคลียร์ข้อมูลใหม่ทั้งหมดหลังบันทึกสำเร็จ
            setNewUnitRows(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.stockId);
                return newSet;
            });
            setNewUnitNames(prev => {
                const { [item.stockId]: _, ...rest } = prev;
                return rest;
            });
            setNewLocationRows(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.stockId);
                return newSet;
            });
            setNewLocationNames(prev => {
                const { [item.stockId]: _, ...rest } = prev;
                return rest;
            });
            setNewCategoryRows(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.stockId);
                return newSet;
            });
            setNewCategoryNames(prev => {
                const { [item.stockId]: _, ...rest } = prev;
                return rest;
            });
            
            setModifiedIds(prev => prev.filter(id => id !== item.stockId));
            showToast("บันทึกข้อมูล " + item.itemName + " สำเร็จ ✅", "success");
            
            refreshData();
            setRefreshDropdownKey(prev => prev + 1);
            
        } catch (err) {
            showToast("บันทึกข้อมูลไม่สำเร็จ: " + err.message, "error");
            setErrorMsg("บันทึกข้อมูลไม่สำเร็จ: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const hideTimer = useRef(null);
    const showToast = (message, type = "success", duration = 2000) => {
        // เคลียร์ timer เดิม (กันทับ)
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setToast({ show: true, message, type });
        hideTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), duration);
    };

    // เพิ่ม state สำหรับเก็บ stockId ที่เลือก "เพิ่มรายการใหม่"
    const [newUnitRows, setNewUnitRows] = useState(new Set());
    const [newUnitNames, setNewUnitNames] = useState({}); // { stockId: "ชื่อหน่วยใหม่" }

    // ✅ เพิ่ม state สำหรับ Location และ Category ใหม่
    const [newLocationRows, setNewLocationRows] = useState(new Set());
    const [newLocationNames, setNewLocationNames] = useState({}); // { stockId: "ชื่อตำแหน่งใหม่" }
    const [newCategoryRows, setNewCategoryRows] = useState(new Set());
    const [newCategoryNames, setNewCategoryNames] = useState({}); // { stockId: "ชื่อหมวดใหม่" }

    // ✅ อัปเดต useEffect dropdown ให้รับ dependency
    useEffect(() => {
        let ac = new AbortController();
        (async () => {
            try {
                const unitRes = await api.get("/stock/GetStockUnitType", {}, { signal: ac.signal });
                setUnitList(unitRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลหน่วยไม่สำเร็จ", err);
                }
            }
            try {
                const locationRes = await api.get("/stock/GetStockLocation", {}, { signal: ac.signal });
                setLocationList(locationRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลตำแหน่งไม่สำเร็จ", err);
                }
            }
            try {
                const categoryRes = await api.get("/stock/GetStockCategory", {}, { signal: ac.signal });
                setCategoryList(categoryRes?.data ?? []);
            } catch (err) {
                if (!ac.signal.aborted) {
                    console.error("โหลดข้อมูลหมวดหมู่ไม่สำเร็จ", err);
                }
            }
        })();
        return () => ac.abort();
    }, [refreshDropdownKey]); // ✅ เพิ่ม dependency

    return (
        <div className="p-4 space-y-4">
            {/* Global Toast */}
            <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    จัดการรายการใบสั่ง
                </h1>

            </div>
            <div className="flex items-center justify-between">
                <div className="join">
                    <button
                        className={`btn btn-sm join-item ${groupBy === "location" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("location")}
                        title="จัดเรียงตามตำแหน่งเก็บ"
                    >
                        ตามตำแหน่งเก็บ
                    </button>
                    <button
                        className={`btn btn-sm join-item ${groupBy === "category" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setGroupBy("category")}
                        title="จัดเรียงตามหมวดหมู่"
                    >
                        ตามหมวดหมู่
                    </button>
                </div>
                <div>
                    <ModalUpdateStockItem onCreated={refreshData} showToast={showToast} />
                </div>
            </div>

            {errorMsg && (
                <div className="alert alert-warning">
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <span className="loading loading-spinner loading-sm"></span> กำลังโหลด…
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 bg-base-100 z-20">รายการ</th>
                                        <th className="text-right">จำนวนที่ต้องใช้</th>
                                        <th className="text-right">จำนวนที่นับได้</th>
                                        <th className="text-right">จำนวนที่ต้องซื้อเข้า</th>
                                        <th>หน่วย</th>
                                        <th>หมวดหมู่</th>
                                        <th>ตำแหน่งเก็บ</th>
                                        <th>ใช้งาน</th>
                                        <th className="text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!items || items.length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-base-content/60">ไม่มีรายการ</td>
                                        </tr>
                                    )}

                                    {groups.map(group => (
                                        <Fragment key={`grp-${group.id}`}>
                                            {/* หัวข้อกลุ่ม */}
                                            <tr className="bg-base-200">
                                                <td colSpan={9} className="font-bold text-lg bg-info">
                                                    {group.name}
                                                </td>
                                            </tr>

                                            {/* รายการในกลุ่ม */}
                                            {group.items.map((it) => {
                                                const modified = modifiedIds.includes(it.stockId);
                                                const invalid = invalidIds.includes(it.stockId);
                                                const rowClass = invalid ? "bg-error/30" : modified ? "bg-warning/20" : "";
                                                const rowClassItemName = invalid ? "bg-error" : modified ? "bg-warning" : "";
                                                return (
                                                    <tr key={it.stockId} className={rowClass}>
                                                        <td className={`sticky left-0 bg-base-100 z-10 ${rowClassItemName}`}>
                                                            <input 
                                                                type="text" 
                                                                className="input input-ghost input-sm w-full min-w-max" 
                                                                value={it.itemName || ""}
                                                                placeholder="ชื่อรายการ"
                                                                onChange={e => {
                                                                    const newName = e.target.value;
                                                                    setItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, itemName: newName } : x))
                                                                    );
                                                                    markModified(it.stockId);
                                                                }} 
                                                            />
                                                        </td>

                                                        <td className="text-right bg-success/10">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    className="btn btn-xs btn-outline btn-error"
                                                                    onClick={() => {
                                                                        const n = Math.max(0, Number(it.requiredQTY || 0) - 1);
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, requiredQTY: String(n) } : x))
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
                                                                    className="input input-bordered input-xs w-14 text-center text-lg"
                                                                    value={it.requiredQTY}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0)) {
                                                                            setItems((prev) =>
                                                                                prev.map((x) => (x.stockId === it.stockId ? { ...x, requiredQTY: v } : x))
                                                                            );
                                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                />

                                                                <button
                                                                    className="btn btn-xs btn-outline btn-success"
                                                                    onClick={() => {
                                                                        const n = Number(it.requiredQTY || 0) + 1;
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, requiredQTY: String(n) } : x))
                                                                        );
                                                                        setInvalidIds((prev) => prev.filter((x) => x !== it.stockId));
                                                                        markModified(it.stockId);
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                        {/* นับได้ */}
                                                        <td className="text-right bg-secondary/10 text-info-content">
                                                            <div className="flex items-center justify-end gap-2">
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
                                                                    className="input input-bordered input-xs w-14 text-center text-lg"
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
                                                        <td className="text-right bg-success/10">
                                                            <div className="flex items-center justify-end gap-2">
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
                                                                    className="input input-bordered input-xs w-14 text-center text-lg"
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
                                                        <td className="text-left">
                                                            <div className="flex flex-col gap-1">
                                                                <select
                                                                    className="select select-bordered select-xs w-24"
                                                                    value={newUnitRows.has(it.stockId) ? 0 : (it.stockUnitTypeID || "")}
                                                                    onChange={async (e) => {
                                                                        const selectedValue = e.target.value;
                                                                        
                                                                        if (selectedValue === "0") {
                                                                            // เลือก "เพิ่มรายการใหม่"
                                                                            setNewUnitRows(prev => new Set([...prev, it.stockId]));
                                                                            setNewUnitNames(prev => ({ ...prev, [it.stockId]: "" }));
                                                                            
                                                                            // ✅ เพิ่มการอัปเดต stockUnitTypeID เป็น 0
                                                                            setItems(prev =>
                                                                                prev.map(x =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockUnitTypeID: 0,
                                                                                            stockUnitTypeName: "หน่วยใหม่"
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        } else {
                                                                            // เลือกหน่วยที่มีอยู่
                                                                            const newUnitId = Number(selectedValue);
                                                                            const selectedUnit = unitList.find(u => u.stockUnitTypeID === newUnitId);
                                                                            
                                                                            // ลบออกจาก newUnitRows ถ้ามี
                                                                            setNewUnitRows(prev => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.delete(it.stockId);
                                                                                return newSet;
                                                                            });
                                                                            setNewUnitNames(prev => {
                                                                                const { [it.stockId]: _removed, ...rest } = prev;
                                                                                return rest;
                                                                            });
                                                                            
                                                                            setItems(prev =>
                                                                                prev.map(x =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockUnitTypeID: newUnitId,
                                                                                            stockUnitTypeName: selectedUnit?.stockUnitTypeName || ""
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* ตัวเลือกที่มีอยู่ */}
                                                                    {unitList.map(unit => (
                                                                        <option key={unit.stockUnitTypeID} value={unit.stockUnitTypeID}>
                                                                            {unit.stockUnitTypeName}
                                                                        </option>
                                                                    ))}
                                                                    {/* ตัวเลือกเพิ่มรายการใหม่ */}
                                                                    <option value="0" className="text-primary font-semibold">
                                                                        + เพิ่มหน่วยใหม่
                                                                    </option>
                                                                </select>
                                                                
                                                                {/* Input สำหรับชื่อหน่วยใหม่ */}
                                                                {newUnitRows.has(it.stockId) && (
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-xs w-full"
                                                                        placeholder="ชื่อหน่วยใหม่"
                                                                        value={newUnitNames[it.stockId] || ""}
                                                                        onChange={(e) => {
                                                                            setNewUnitNames(prev => ({
                                                                                ...prev,
                                                                                [it.stockId]: e.target.value
                                                                            }));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex flex-col gap-1">
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={newLocationRows.has(it.stockId) ? "0" : (it.stockLocationID || "")}
                                                                    onChange={(e) => {
                                                                        const selectedValue = e.target.value;
                                                                        
                                                                        if (selectedValue === "0") {
                                                                            // เลือก "เพิ่มตำแหน่งใหม่"
                                                                            setNewLocationRows(prev => new Set([...prev, it.stockId]));
                                                                            setNewLocationNames(prev => ({ ...prev, [it.stockId]: "" }));
                                                                            
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockLocationID: 0,
                                                                                            stockLocationName: "ตำแหน่งใหม่"
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        } else {
                                                                            // เลือกตำแหน่งที่มีอยู่
                                                                            const newLocationId = Number(selectedValue);
                                                                            const selectedLocation = locationList.find(l => l.stockLocationID === newLocationId);
                                                                            
                                                                            // ลบออกจาก newLocationRows ถ้ามี
                                                                            setNewLocationRows(prev => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.delete(it.stockId);
                                                                                return newSet;
                                                                            });
                                                                            setNewLocationNames(prev => {
                                                                                const { [it.stockId]: _, ...rest } = prev;
                                                                                return rest;
                                                                            });
                                                                            
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockLocationID: newLocationId,
                                                                                            stockLocationName: selectedLocation?.stockLocationName || ""
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">-- เลือกตำแหน่งเก็บ --</option>
                                                                    {locationList.map(location => (
                                                                        <option key={location.stockLocationID} value={location.stockLocationID}>
                                                                            {location.stockLocationName}
                                                                        </option>
                                                                    ))}
                                                                    <option value="0" className="text-primary font-semibold">
                                                                        + เพิ่มตำแหน่งใหม่
                                                                    </option>
                                                                </select>
                                                                
                                                                {/* Input สำหรับชื่อตำแหน่งใหม่ */}
                                                                {newLocationRows.has(it.stockId) && (
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-xs w-full"
                                                                        placeholder="ชื่อตำแหน่งใหม่"
                                                                        value={newLocationNames[it.stockId] || ""}
                                                                        onChange={(e) => {
                                                                            setNewLocationNames(prev => ({
                                                                                ...prev,
                                                                                [it.stockId]: e.target.value
                                                                            }));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex flex-col gap-1">
                                                                <select
                                                                    className="select select-bordered select-sm w-full"
                                                                    value={newCategoryRows.has(it.stockId) ? "0" : (it.stockCategoryID || "")}
                                                                    onChange={(e) => {
                                                                        const selectedValue = e.target.value;
                                                                        
                                                                        if (selectedValue === "0") {
                                                                            // เลือก "เพิ่มหมวดใหม่"
                                                                            setNewCategoryRows(prev => new Set([...prev, it.stockId]));
                                                                            setNewCategoryNames(prev => ({ ...prev, [it.stockId]: "" }));
                                                                            
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockCategoryID: 0,
                                                                                            stockCategoryName: "หมวดใหม่"
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        } else {
                                                                            // เลือกหมวดที่มีอยู่
                                                                            const newCategoryId = Number(selectedValue);
                                                                            const selectedCategory = categoryList.find(c => c.stockCategoryID === newCategoryId);
                                                                            
                                                                            // ลบออกจาก newCategoryRows ถ้ามี
                                                                            setNewCategoryRows(prev => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.delete(it.stockId);
                                                                                return newSet;
                                                                            });
                                                                            setNewCategoryNames(prev => {
                                                                                const { [it.stockId]: _, ...rest } = prev;
                                                                                return rest;
                                                                            });
                                                                            
                                                                            setItems((prev) =>
                                                                                prev.map((x) =>
                                                                                    x.stockId === it.stockId
                                                                                        ? {
                                                                                            ...x,
                                                                                            stockCategoryID: newCategoryId,
                                                                                            stockCategoryName: selectedCategory?.stockCategoryName || ""
                                                                                        }
                                                                                        : x
                                                                                )
                                                                            );
                                                                            markModified(it.stockId);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="">-- เลือกหมวดหมู่ --</option>
                                                                    {categoryList.map(category => (
                                                                        <option key={category.stockCategoryID} value={category.stockCategoryID}>
                                                                            {category.stockCategoryName}
                                                                        </option>
                                                                    ))}
                                                                    <option value="0" className="text-primary font-semibold">
                                                                        + เพิ่มหมวดใหม่
                                                                    </option>
                                                                </select>
                                                                
                                                                {/* Input สำหรับชื่อหมวดใหม่ */}
                                                                {newCategoryRows.has(it.stockId) && (
                                                                    <input
                                                                        type="text"
                                                                        className="input input-bordered input-xs w-full"
                                                                        placeholder="ชื่อหมวดใหม่"
                                                                        value={newCategoryNames[it.stockId] || ""}
                                                                        onChange={(e) => {
                                                                            setNewCategoryNames(prev => ({
                                                                                ...prev,
                                                                                [it.stockId]: e.target.value
                                                                            }));
                                                                            markModified(it.stockId);
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </td>
                                                        {/* {active} */}
                                                        <td>
                                                            <label className="swap">
                                                                <input type="checkbox"
                                                                    checked={it.active}
                                                                    onChange={(e) => {
                                                                        const newIsActive = e.target.checked;
                                                                        setItems((prev) =>
                                                                            prev.map((x) => (x.stockId === it.stockId ? { ...x, active: newIsActive } : x))
                                                                        );
                                                                        markModified(it.stockId);
                                                                    }} />
                                                                <div className="swap-on">✅</div>
                                                                <div className="swap-off">❌</div>
                                                            </label>

                                                        </td>
                                                        {/* บันทึก */}
                                                        <td className="text-right">
                                                            <button
                                                                className="btn btn-xs btn-success"
                                                                disabled={!modified}
                                                                onClick={() => {
                                                                    handleSave(it);
                                                                }}
                                                            >
                                                                บันทึก
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
                    )}
                </div>
            </div>

        </div>
    );
}
