// src/pages/CheckStockDetail.jsx
import { useEffect, useState, useMemo, Fragment } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function CheckStockDetail() {
    const { getdata } = useParams(0); 

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]); // [{id, name, qty: string}]
    const [modifiedIds, setModifiedIds] = useState([]);
    const [invalidIds, setInvalidIds] = useState([]); // แถวที่ qty ว่าง/ไม่ถูกต้อง
    const [errorMsg, setErrorMsg] = useState("");


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
    }, [getdata]);



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


    // Modal alert state
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");

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

    const handleAlertOk = () => {
        setAlertOpen(false);
    };

    const handleSave = async (item) => {
        if (!item) return;

        // ตัวอย่างการส่งข้อมูลไป backend
        try {
            setLoading(true);
            const payload = {
                stockId: item.stockId,
                itemName: item.itemName,
                stockCategoryID: item.stockCategoryID,
                stockLocationID: item.stockLocationID,
                stockUnitTypeID: item.stockUnitTypeID,
                requiredQTY: item.requiredQTY,
                totalQTY: item.totalQTY,
                stockInQTY: item.stockInQTY,
                active: item.active,
            };
            //alert(JSON.stringify(payload, null, 2));
            await api.post("/stock/UpdateStockDetail", payload);
            setModifiedIds(prev => prev.filter(id => id !== item.stockId));
            setAlertTitle("บันทึกข้อมูล "+item.itemName+" สำเร็จ ✅");
            setAlertMessage("ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว");
            setAlertOpen(true);
        } catch (err) {
            setAlertOpen(true);
            setErrorMsg("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" + err.message);
        } finally {
            setLoading(false);
        }
    };

   

    return (
        <div className="p-4 space-y-4">

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">
                    จัดการรายการใบสั่ง
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
                                                            <input type="text" className="input input-ghost input-sm w-full max-w-xs" value={it.itemName}
                                                                onChange={e => {
                                                                    const newName = e.target.value;
                                                                    setItems((prev) =>
                                                                        prev.map((x) => (x.stockId === it.stockId ? { ...x, itemName: newName } : x))
                                                                    );
                                                                    markModified(it.stockId);
                                                                }} />
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
                                                            <select
                                                                className="select select-bordered select-xs w-24"
                                                                value={it.stockUnitTypeID || ""}
                                                                onChange={async (e) => {
                                                                    const newUnitId = Number(e.target.value);
                                                                    // หา unit name จาก unitList
                                                                    const selectedUnit = unitList.find(u => u.stockUnitTypeID === newUnitId);
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
                                                                }}
                                                            >
                                                                {unitList.map(unit => (
                                                                    <option key={unit.stockUnitTypeID} value={unit.stockUnitTypeID}>
                                                                        {unit.stockUnitTypeName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="select select-bordered select-sm w-full"
                                                                value={it.stockLocationID}
                                                                onChange={(e) => {
                                                                    const newLocationId = e.target.value;
                                                                    setItems((prev) =>
                                                                        prev.map((x) =>
                                                                            x.stockId === it.stockId
                                                                                ? { ...x, stockLocationID: newLocationId }
                                                                                : x
                                                                        )
                                                                    );
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                {locationList.map(location => (
                                                                    <option key={location.stockLocationID} value={location.stockLocationID}>
                                                                        {location.stockLocationName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="select select-bordered select-sm w-full"
                                                                value={it.stockCategoryID}
                                                                onChange={(e) => {
                                                                    const newCategoryId = e.target.value;
                                                                    setItems((prev) =>
                                                                        prev.map((x) =>
                                                                            x.stockId === it.stockId
                                                                                ? { ...x, stockCategoryID: newCategoryId }
                                                                                : x
                                                                        )
                                                                    );
                                                                    markModified(it.stockId);
                                                                }}
                                                            >
                                                                {categoryList.map(category => (
                                                                    <option key={category.stockCategoryID} value={category.stockCategoryID}>
                                                                        {category.stockCategoryName}
                                                                    </option>
                                                                ))}
                                                            </select>
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
        </div>
    );
}
