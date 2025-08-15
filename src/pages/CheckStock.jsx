// src/pages/CheckStockDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function CheckStockDetail() {
    const { orderId } = useParams(); // "new" หรือเลข id จริง
    const navigate = useNavigate();
    const isNew = orderId === "new";

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
    const [modifiedIds, setModifiedIds] = useState([]);
    const [invalidIds, setInvalidIds] = useState([]); // แถวที่ qty ว่าง/ไม่ถูกต้อง
    const [errorMsg, setErrorMsg] = useState("");

    const markModified = (id) => {
        setModifiedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    useEffect(() => {
        const ac = new AbortController();     // ใช้ยกเลิก request เมื่อ component unmount
        setLoading(true);

        (async () => {
            try {
                if (isNew) {
                    // 🔹 โหมดสร้างใหม่: ดึงรายการสต๊อกทั้งหมด แล้วตั้ง qty = "" ให้ผู้ใช้กรอกเอง
                    const res = await api.get("/stock/GetCurrentStock", { signal: ac.signal });
                    const raw = res?.data?.data ?? [];  // backend ห่อใน { success, data, message }
                    const list = raw.map(m => ({
                        id: m.stockId ,
                        name: m.itemName ,
                        qty: ""                          // ค่าว่างตามที่ต้องการ
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



    const onQtyChange = (id, value) => {
        // อนุญาตค่าว่างชั่วคราว + ตัวเลขบวกเท่านั้น
        if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty: value } : x)));
            setInvalidIds((prev) => prev.filter((x) => x !== id)); // ถ้าพิมพ์แล้วถูกต้อง เอาออกจาก invalid
            markModified(id);
        }
    };

    const validate = () => {
        const invalid = items.filter((it) => it.qty === "");
        setInvalidIds(invalid.map((it) => it.id));
        if (invalid.length > 0) {
            setErrorMsg(`กรุณากรอกจำนวนให้ครบ (${invalid.length} รายการยังว่าง)`);
            return false;
        }
        setErrorMsg("");
        return true;
    };

    const save = async () => {
        if (!validate()) return;

        const payload = { items: items.map(({ id, qty }) => ({ itemId: id, qty: Number(qty) })) };

        if (isNew) {
            // const res = await api.post("/stock/orders", payload);
            // const newId = res.data.id;
            alert(payload); // debug: ดู payload ที่จะส่ง
            //navigate("/stock", { state: { shouldRefresh: true } });
        } else {
            // await api.put(`/stock/orders/${orderId}/items`, payload);
            //navigate("/stock", { state: { shouldRefresh: true } });
        }
    };

    const isSaveDisabled = isNew && items.some((it) => it.qty === "");

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    {isNew ? "สร้างรายการเช็ค Stock ใหม่" : `จัดการรายการใบสั่ง: ${orderId}`}
                </h1>
                <div className="flex gap-2">
                    <button className="btn" onClick={() => navigate(-1)}>กลับ</button>
                    <button
                        className="btn btn-primary"
                        onClick={save}
                        disabled={isSaveDisabled}
                        title={isSaveDisabled ? "กรุณากรอกจำนวนให้ครบก่อนบันทึก" : ""}
                    >
                        บันทึก
                    </button>
                </div>
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
                                        <th>รายการ</th>
                                        <th className="text-right">จำนวนที่นับได้</th>
                                        <th className="text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => {
                                        const modified = modifiedIds.includes(it.id);
                                        const invalid = invalidIds.includes(it.id);
                                        const rowClass = invalid
                                            ? "bg-warning/30"
                                            : modified
                                                ? "bg-warning/20"
                                                : "";
                                        return (
                                            <tr key={it.id} className={rowClass}>
                                                <td>{it.name}</td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* - */}
                                                        <button
                                                            className="btn btn-xs"
                                                            onClick={() => {
                                                                const n = Math.max(0, Number(it.qty || 0) - 1);
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.id === it.id ? { ...x, qty: String(n) } : x))
                                                                );
                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.id));
                                                                markModified(it.id);
                                                            }}
                                                        >
                                                            -
                                                        </button>

                                                        {/* input (แคบ พอสำหรับเลขหลักสิบ) */}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="99"
                                                            className="input input-bordered input-xs w-12 text-right"
                                                            value={it.qty}
                                                            placeholder={isNew ? "0" : undefined}
                                                            onChange={(e) => onQtyChange(it.id, e.target.value)}
                                                        />

                                                        {/* + */}
                                                        <button
                                                            className="btn btn-xs"
                                                            onClick={() => {
                                                                const n = Number(it.qty || 0) + 1;
                                                                setItems((prev) =>
                                                                    prev.map((x) => (x.id === it.id ? { ...x, qty: String(n) } : x))
                                                                );
                                                                setInvalidIds((prev) => prev.filter((x) => x !== it.id));
                                                                markModified(it.id);
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="btn btn-xs btn-outline"
                                                        onClick={() => {
                                                            // 1) เคลียร์ qty ให้เป็นค่าว่าง
                                                            setItems((prev) =>
                                                                prev.map((x) => (x.id === it.id ? { ...x, qty: "" } : x))
                                                            );

                                                            // 2) เอา id นี้ออกจากรายการ modified และ invalid
                                                            setModifiedIds((prev) => prev.filter((x) => x !== it.id));
                                                            setInvalidIds((prev) => prev.filter((x) => x !== it.id));
                                                        }}
                                                    >
                                                        เคลียร์
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-base-content/60">
                                                ไม่มีรายการ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
