// src/pages/CheckStockDetail.jsx
import { useEffect, useState, useMemo, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Cookies from "js-cookie";
import Toast from "../components/ui/Toast"

export default function CheckStockDetail() {
    const { orderId } = useParams(); // "new" หรือเลข id จริง
    const isNew = orderId === "new";
    const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
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

    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    const showToast = (message, type = "info", timeout = 2000) => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type });
        }, timeout);
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
                    const res = await api.get(`/stock/orders/${orderId}/items`, { signal: ac.signal });
                    const raw = res?.data?.data ?? [];
                    const list = raw.map(r => ({
                        id: r.id ?? r.itemId ?? r.stockId ?? r.StockId,
                        name: r.name ?? r.itemName ?? r.stockName ?? r.StockName,
                        qty: String(r.qty ?? r.Qty ?? r.quantity ?? 0)
                    }));
                    setItems(list);
                }

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

    const validate = () => {
        const invalid = items.filter((it) => it.totalQTY === "");
        setInvalidIds(invalid.map((it) => it.stockId));
        if (invalid.length > 0) {
            setErrorMsg(`กรุณากรอกจำนวนให้ครบ (${invalid.length} รายการยังว่าง)`);
            return false;
        }
        setErrorMsg("");
        return true;
    };

    const save = async () => {
        if (!validate()) return;

        setIsSaving(true);
        // time HH:mm:ss แบบ 24 ชม.
        const nowTime = new Date().toLocaleTimeString("en-GB", {
            hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
        });

        // helper แปลงตัวเลข (ว่าง -> null, มีค่า -> Number)
        const toIntOrNull = (v) =>
            v === "" || v === null || v === undefined ? null : Number(v);

        // ✅ แปลง items -> List<StockCountDto>
        const payload = items.map((it) => ({
            stockId: Number(it.stockId),
            stockInDate: orderDate,    // yyyy-MM-dd จาก input
            stockInTime: nowTime,      // HH:mm:ss ปัจจุบัน
            totalQTY: Number(it.totalQTY || 0),     // คงเหลือที่นับได้ (required)
            requiredQTY: toIntOrNull(it.requiredQTY),
            stockInQTY: toIntOrNull(it.stockInQTY),
            remark: it.remark ?? "",
            UpdateBy: authData?.userId ?? 0, // ใช้ userId จาก authData ถ้ามี
        }));

        try {
            if (isNew) {
                //await api.post("/stock/CreateStockCount", payload);
                navigate("/stock", { state: { shouldRefresh: true } });
            } else {
                // ถ้าโหมดแก้ไขใช้ endpoint อื่น ก็สลับตามจริง
                await api.post("/stock/CreateStockCount", payload);
            }
            showToast?.("บันทึกสำเร็จ!", "success", 2000);
        } catch (err) {
            console.error(err);
            showToast?.("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error", 3000);
        }
        finally {
            setIsSaving(false);
        }

    };


    const isSaveDisabled = isNew && items.some((it) => it.totalQTY === "");

    return (
        <div className="p-4 space-y-4">
            {/* Global Toast */}
            <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    {isNew ? "สร้างรายการเช็ค Stock ใหม่" : `จัดการรายการใบสั่ง: ${orderId}`}
                </h1>

            </div>
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

            {errorMsg && (
                <div className="alert alert-warning">
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body">
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
                                        <th className="text-right bg-secondary text-info-content">จำนวนที่นับได้</th>
                                        <th className="text-right">จำนวนที่ต้องซื้อเข้า</th>
                                        <th>หน่วย</th>
                                        <th>หมายเหตุ</th>
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
                                                <td colSpan={7} className="font-bold text-lg bg-info">
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
                                                        <td className={`sticky left-0 bg-base-100 z-10 ${rowClassItemName}`}>{it.itemName}</td>
                                                        <td className="text-right text-lg">{it.requiredQTY}</td>

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
                                                        <td className="text-right">
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
                                                            {it.unitTypeName || it.stockUnitTypeName || "หน่วยไม่ระบุ"}
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
                                                                className="btn btn-xs btn-outline btn-error"
                                                                onClick={() => {
                                                                    setItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, totalQTY: "", stockInQTY: 0, remark: "" } : x))
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
                    )}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                    วันที่สั่งซื้อ:{" "}
                    <input
                        type="date"
                        className="input input-bordered input-sm w-40"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                    />

                </span>
                <button
                    className="btn btn-primary w-30"
                    onClick={save}
                    disabled={isSaveDisabled || isSaving}
                    title={isSaveDisabled ? "กรุณากรอกจำนวนให้ครบก่อนบันทึก" : ""}
                >
                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>
        </div>
    );
}
