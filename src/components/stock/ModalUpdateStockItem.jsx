import { useRef, useState, useId, useEffect } from "react";
import { api } from "../../lib/api";
import Cookies from "js-cookie";

const ModalUpdateStockItem = ({ onCreated, showToast }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingModal, setIsLoadingModal] = useState(false);


    const dialogRef = useRef(null); // Reference to the dialog element
    const txt_itemName = useId();
    const txt_requiredQTY = useId();
    const txt_totalQTY = useId();
    const txt_StockInQTY = useId();
    const ddl_stockUnitId = useId();
    const ddl_stockLocationId = useId();
    const ddl_stockCategoryId = useId();
    const [unitList, setUnitList] = useState([]);
    const [locationList, setLocationList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);

    const [itemName, setItemName] = useState("");
    const [requiredQTY, setRequiredQTY] = useState("");
    const [totalQTY, setTotalQTY] = useState("");
    const [stockInQTY, setStockInQTY] = useState("");
    const [unitId, setUnitId] = useState("");
    const [locationId, setLocationId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");


    useEffect(() => {
        // default วันที่วันนี้
        // setCostDate(new Date().toISOString().slice(0, 10));

    }, []);
    // เปิด/ปิด dialog
    //const open = () => dialogRef.current?.showModal();
    // เปิด modal + โหลดหมวดหมู่
    const openModal = async () => {
        const ac = new AbortController(); // Define AbortController
        try {
            setIsLoadingModal(true);
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
        } catch (err) {
            console.error("โหลด costCategory ไม่ได้:", err);
        }
        finally {
            setIsLoadingModal(false);
            if (dialogRef.current) dialogRef.current.showModal();
        }
    };

    const closeModal = () => dialogRef.current?.close();

    const handleSubmit = async (e) => {
        if (isSaving) return;
        e.preventDefault(); // (A) กันการรีเฟรชหน้า/เปลี่ยนหน้า default ของฟอร์ม
        setIsSaving(true);
        // Get selected text for category, unit, and location
        const selectedCategory = categoryList.find(c => String(c.stockCategoryID) === categoryId);
        const selectedUnit = unitList.find(u => String(u.stockUnitTypeID) === unitId);
        const selectedLocation = locationList.find(l => String(l.stockLocationID) === locationId);

        const payload = {
            ItemName: itemName.trim(),
            RequiredQTY: Number(requiredQTY),
            TotalQTY: Number(totalQTY),
            StockInQTY: Number(stockInQTY),
            StockUnitTypeID: unitId ? Number(unitId) : null,
            StockLocationID: locationId ? Number(locationId) : null,
            StockCategoryID: categoryId ? Number(categoryId) : null,
            StockCategoryName: categoryId === "__new__" ? newCategoryName.trim() : selectedCategory?.description || "",
            StockUnitTypeName: selectedUnit?.description || "",
            StockLocationName: selectedLocation?.stockLocationName || "",
        };
        if (!payload.ItemName || payload.ItemName.trim() === "") {
            setIsSaving(false);
            return alert("กรุณากรอกชื่อรายการ");
        }
        if (isNaN(payload.RequiredQTY) || payload.RequiredQTY < 0) {
            setIsSaving(false);
            return alert("กรุณากรอกจำนวนที่ต้องใช้ให้ถูกต้อง");
        }
        if (isNaN(payload.TotalQTY) ) {
            setIsSaving(false);
            return alert("กรุณากรอกจำนวนคงเหลือให้ถูกต้อง");
        }
        if (isNaN(payload.StockInQTY) ) {
            setIsSaving(false);
            return alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
        }
        

        try {
            await api.post("/stock/CreateStockDetail", payload);
            //alert(JSON.stringify(payload));
            onCreated?.(); // ให้ parent ไป refresh list ถ้าต้องการ
            showToast?.("บันทึกสำเร็จ!", "success", 2000);
            resetForm();
            closeModal();


            //close();
        } catch (err) {
            console.error(err);
            const apiMsg = err?.response?.data?.message || err?.message || "บันทึกไม่สำเร็จ";
            showToast?.(apiMsg, "error", 2000);
        } finally {
            setIsSaving(false);

        }
    };



    const resetForm = () => {
        setItemName("");
        setRequiredQTY("");
        setTotalQTY("");
        setStockInQTY("");
        setUnitId("");
        setLocationId("");
        setCategoryId("");
    };

    return (
        <>
            <button className="btn btn-success text-white" onClick={openModal} disabled={isLoadingModal}>
                {isLoadingModal ? "กำลังโหลด..." : "เพิ่มรายการใหม่"}
            </button>

            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">

                    <h3 className="font-bold text-lg">สร้างรายการวัตถุดิบใหม่</h3>

                    <form
                        className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                        onSubmit={handleSubmit}
                    >
                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_itemName}>
                                    ชื่อรายการ
                                </span>&nbsp;
                            </div>
                            <input
                                id={txt_itemName}
                                type="text"
                                className="input input-bordered"
                                placeholder="เช่น ไก่สด, ข้าวสาร, น้ำตาล ฯลฯ"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                required
                            />
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={ddl_stockCategoryId}>
                                    ประเภทหมวดหมู่
                                </span> &nbsp;
                            </div>
                                 <select
                                id={ddl_stockCategoryId}
                                className="select select-bordered"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกประเภทหมวดหมู่ —</option>
                                <option value="__new__">+ เพิ่มหมวดหมู่ใหม่</option>
                                {categoryList.map((category) => (
                                    <option
                                        key={category.stockCategoryID}
                                        value={String(category.stockCategoryID)}
                                    >
                                        {category.description}
                                    </option>
                                ))}
                            </select>
                            {categoryId === "__new__" && (
                                <input
                                    type="text"
                                    className="input input-bordered mt-2"
                                    placeholder="กรอกชื่อหมวดหมู่ใหม่"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    required
                                />
                            )}
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={ddl_stockLocationId}>
                                    สถานที่จัดเก็บ
                                </span> &nbsp;
                            </div>
                            <select
                                id={ddl_stockLocationId}
                                className="select select-bordered"
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกสถานที่จัดเก็บ —</option>
                                {locationList.map((location) => (
                                    <option
                                        key={location.stockLocationID}
                                        value={String(location.stockLocationID)}
                                    >
                                        {location.stockLocationName}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={ddl_stockUnitId}>
                                    หน่วย
                                </span> &nbsp;
                            </div>
                            <select
                                id={ddl_stockUnitId}
                                className="select select-bordered"
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
                                required
                            >
                                <option value="" disabled>— เลือกหน่วย —</option>
                                {unitList.map((unit) => (
                                    <option
                                        key={unit.stockUnitTypeID}
                                        value={String(unit.stockUnitTypeID)}
                                    >
                                        {unit.description}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_requiredQTY}>
                                    จำนวนที่ต้องใช้
                                </span>&nbsp;
                            </div>
                            <input
                                id={txt_requiredQTY}
                                type="number"
                                className="input input-bordered"
                                min={0}
                                placeholder="ใส่จำนวนที่ต้องใช้"
                                value={requiredQTY}
                                onChange={(e) => setRequiredQTY(e.target.value)}
                                required
                            />
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_totalQTY}>
                                    จำนวนคงเหลือ
                                </span>&nbsp;
                            </div>
                            <input
                                id={txt_totalQTY}
                                type="number"
                                className="input input-bordered"
                                min={0}
                                placeholder="จำนวนคงเหลือในสต็อก"
                                value={totalQTY}
                                onChange={(e) => setTotalQTY(e.target.value)}
                                required
                            />
                        </label>

                        <label className="form-control md:col-span-2">
                            <div className="label">
                                <span className="label-text" htmlFor={txt_StockInQTY}>
                                    จำนวนที่สั่งซื้อ
                                </span>&nbsp;
                            </div>
                            <input
                                id={txt_StockInQTY}
                                type="number"
                                className="input input-bordered"
                                min={0}
                                placeholder="จำนวนที่ต้องสั่งซื้อ"
                                value={stockInQTY}
                                onChange={(e) => setStockInQTY(e.target.value)}
                                required
                            />
                        </label>

                        <div className="modal-action md:grid-span-2 lg:grid-span-3">
                            <button
                                type="submit"
                                className={`btn btn-success ${isSaving ? "loading" : ""}`}
                                disabled={isSaving}
                            >
                                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
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

export default ModalUpdateStockItem;