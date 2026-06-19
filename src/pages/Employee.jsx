import { useState, useEffect } from "react";
import { api } from "../lib/api";
import Toast from "../components/ui/Toast";
import { IoPencil, IoPersonAdd, IoSearch } from "react-icons/io5";

// ============================================================
// หน้าจัดการข้อมูลพนักงาน (Permission 1 - Owner เท่านั้น)
// field จริงจาก GET /auth/GetAllEmployee:
//   userId, username, name, contact, isActive, site,
//   bankAccount, bankID, bankName,
//   startWorkDate, wageCost,
//   userPermistionID, userPermistionName
// ============================================================

export default function Employee() {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState("");

  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "success") => setToast({ message, type });

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "create",   // "create" | "edit"
    employee: null,
  });

  // ── ดึงรายชื่อพนักงานทั้งหมด ──
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/GetAllEmployee");
      setEmployees(res.data ?? []);
    } catch {
      showToast("โหลดข้อมูลพนักงานไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmployees(); }, []);

  // ── กรองตามชื่อหรือ username แล้วเรียง active ขึ้นก่อน ──
  const filteredEmployees = employees
    .filter((emp) => {
      const q = searchText.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.username?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));

  const openCreateModal = () => setModal({ isOpen: true, mode: "create", employee: null });
  const openEditModal   = (emp) => setModal({ isOpen: true, mode: "edit", employee: emp });
  const closeModal      = () => setModal({ isOpen: false, mode: "create", employee: null });

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary">👥 จัดการพนักงาน</h1>
          <p className="text-xs md:text-sm text-base-content/60 mt-0.5">
            พนักงานทั้งหมด {employees.length} คน
          </p>
        </div>
        <button className="btn btn-primary btn-sm md:btn-md gap-2" onClick={openCreateModal}>
          <IoPersonAdd size={18} />
          <span className="hidden sm:inline">เพิ่มพนักงาน</span>
        </button>
      </div>

      {/* ── Search ── */}
      <div className="mb-5 w-full sm:max-w-sm">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <IoSearch size={16} className="text-base-content/50 shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือ username..."
            className="grow min-w-0"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>
      </div>

      {/* ── List ── */}
      <EmployeeList
        employees={filteredEmployees}
        loading={loading}
        onEdit={openEditModal}
      />

      {/* ── Modal ── */}
      {modal.isOpen && (
        <EmployeeModal
          mode={modal.mode}
          employee={modal.employee}
          onClose={closeModal}
          onSaved={() => { closeModal(); fetchEmployees(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ============================================================
// รายการพนักงาน
// ============================================================
function EmployeeList({ employees, loading, onEdit }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  if (employees.length === 0) {
    return <div className="text-center py-16 text-base-content/50">ไม่พบข้อมูลพนักงาน</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      {employees.map((emp) => (
        <EmployeeCard key={emp.userId} employee={emp} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ── badge สี permission ──
const PERMISSION_BADGE = {
  owner:   "badge-error",
  manager: "badge-warning",
  staff:   "badge-info",
};

// ============================================================
// การ์ดพนักงานแต่ละคน
// ============================================================
function EmployeeCard({ employee, onEdit }) {
  const permBadge = PERMISSION_BADGE[employee.userPermistionName] ?? "badge-ghost";

  return (
    <div className={`card shadow border ${employee.isActive ? "bg-base-100 border-base-300" : "bg-error/10 border-error/30"}`}>
      <div className="card-body p-4 gap-3">

        {/* ชื่อ + permission badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-base md:text-lg text-primary truncate">
              {employee.name || "-"}
            </div>
            <div className="text-xs text-base-content/50">@{employee.username}</div>
          </div>
          <div className={`badge badge-sm shrink-0 ${permBadge}`}>
            {employee.userPermistionName || "-"}
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="text-xs text-base-content/60 flex flex-wrap gap-x-4 gap-y-1">
          <span>สาขา: <span className="font-semibold text-base-content">{employee.site || "-"}</span></span>
          <span>
            สถานะ:{" "}
            <span className={`font-semibold ${employee.isActive ? "text-success" : "text-error"}`}>
              {employee.isActive ? "ทำงานอยู่" : "ออกแล้ว"}
            </span>
          </span>
          {employee.wageCost > 0 && (
            <span>อัตราค่าจ้าง: <span className="font-semibold text-base-content">{employee.wageCost.toLocaleString()} บาท/ชม.</span></span>
          )}
        </div>

        {/* บัญชีธนาคาร */}
        <div className="border border-base-300 rounded-lg p-3 space-y-0.5">
          <div className="text-xs text-base-content/50">บัญชีรับเงินเดือน</div>
          <div className="text-sm text-base-content/70">{employee.bankName || "-"}</div>
          <div className="font-bold tracking-wider">{employee.bankAccount || "-"}</div>
        </div>

        {/* ปุ่มแก้ไข */}
        <button
          className="btn btn-sm btn-outline btn-primary w-full gap-2"
          onClick={() => onEdit(employee)}
        >
          <IoPencil size={14} />
          แก้ไขข้อมูล
        </button>

      </div>
    </div>
  );
}

// ============================================================
// Modal เพิ่ม / แก้ไขพนักงาน
// ============================================================
function EmployeeModal({ mode, employee, onClose, onSaved, showToast }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name:             employee?.name             ?? "",
    username:         employee?.username         ?? "",
    contact:          employee?.contact          ?? "",
    site:             employee?.site             ?? "HKT",
    bankID:           employee?.bankID           ?? "",
    bankAccount:      employee?.bankAccount      ?? "",
    wageCost:         employee?.wageCost         ?? 0,
    userPermistionID: employee?.userPermistionID ?? 3,
    isActive:         employee?.isActive         ?? true,
  });
  const [saving, setSaving] = useState(false);

  // ── ดึงรายการธนาคารจาก API ──
  const [bankList, setBankList]       = useState([]);
  const [bankLoading, setBankLoading] = useState(false);

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const res = await api.get("/auth/GetBankList");
        setBankList(res.data ?? []);
      } catch {
        showToast("โหลดรายการธนาคารไม่สำเร็จ", "error");
      } finally {
        setBankLoading(false);
      }
    };
    fetchBanks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("กรุณากรอกชื่อพนักงาน", "error");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.post("/auth/UpdateEmployee", {
          userId:           employee.userId,
          name:             form.name,
          username:         form.username,
          contact:          form.contact,
          site:             form.site,
          bankID:           form.bankID !== "" ? Number(form.bankID) : null,  // int? — ต้องเป็น number หรือ null
          bankAccount:      form.bankAccount || null,
          wageCost:         form.wageCost,
          userPermistionID: form.userPermistionID,
          isActive:         form.isActive,
        });
        showToast("แก้ไขข้อมูลพนักงานสำเร็จ");
      } else {
        // TODO: await api.post("/auth/CreateEmployee", form);
        showToast("เพิ่มพนักงานสำเร็จ");
      }
      onSaved();
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md max-h-[90vh] overflow-y-auto">

        <h3 className="font-bold text-lg mb-4">
          {isEdit ? "✏️ แก้ไขข้อมูลพนักงาน" : "➕ เพิ่มพนักงานใหม่"}
        </h3>

        <div className="space-y-3">

          {/* ชื่อ */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">ชื่อ-นามสกุล *</span></label>
            <input type="text" className="input input-bordered input-sm"
              placeholder="ชื่อ นามสกุล"
              value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          {/* username */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">Username</span></label>
            <input type="text" className="input input-bordered input-sm"
              placeholder="username"
              value={form.username} onChange={(e) => set("username", e.target.value)} />
          </div>

          {/* เบอร์ติดต่อ */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">เบอร์ติดต่อ</span></label>
            <input type="text" className="input input-bordered input-sm"
              placeholder="08x-xxx-xxxx"
              value={form.contact} onChange={(e) => set("contact", e.target.value)} />
          </div>

          {/* สาขา + Permission แถวเดียวกัน */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text">สาขา</span></label>
              <select className="select select-bordered select-sm"
                value={form.site} onChange={(e) => set("site", e.target.value)}>
                <option value="HKT">HKT - ภูเก็ต</option>
                <option value="BKK">BKK - กรุงเทพ</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text">ตำแหน่ง</span></label>
              <select className="select select-bordered select-sm"
                value={form.userPermistionID} onChange={(e) => set("userPermistionID", Number(e.target.value))}>
                <option value={1}>Owner</option>
                <option value={2}>Manager</option>
                <option value={3}>Staff</option>
              </select>
            </div>
          </div>

          {/* ธนาคาร — dropdown จาก API */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">ธนาคาร</span></label>
            <select
              className="select select-bordered select-sm"
              value={form.bankID}
              onChange={(e) => set("bankID", e.target.value)}
              disabled={bankLoading}
            >
              <option value="">
                {bankLoading ? "กำลังโหลด..." : "-- เลือกธนาคาร --"}
              </option>
              {bankList.map((bank) => (
                <option key={bank.bankID} value={bank.bankID}>
                  {bank.bankName}
                </option>
              ))}
            </select>
          </div>

          {/* เลขบัญชี */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">เลขบัญชี</span></label>
            <input type="text" className="input input-bordered input-sm"
              placeholder="xxx-x-xxxxx-x"
              value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
          </div>

          {/* อัตราค่าจ้าง */}
          <div className="form-control">
            <label className="label py-1"><span className="label-text">อัตราค่าจ้าง (บาท/ชม.)</span></label>
            <input type="number" className="input input-bordered input-sm"
              min={0}
              value={form.wageCost} onChange={(e) => set("wageCost", Number(e.target.value))} />
          </div>

          {/* สถานะ — แสดงเฉพาะกรณี edit */}
          {isEdit && (
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3 py-1">
                <input type="checkbox" className="toggle toggle-success toggle-sm"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)} />
                <span className="label-text">พนักงานยังทำงานอยู่</span>
              </label>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="modal-action gap-2 mt-5">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-xs" /> : "บันทึก"}
          </button>
        </div>

      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
