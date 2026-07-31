import { api } from "../lib/api"; // axios instance กลาง (แนบ JWT, จัดการ loading/error ให้อัตโนมัติ)

// เรียก GET /cost/GetCostCategoryList เพื่อดึงรายการ "หมวดหมู่ค่าใช้จ่าย" ทั้งหมด
// ใช้โดย ModalNewCost.jsx และ ModalConfirmPayment.jsx (ผ่าน hooks/useCostOptions.js) ตอนเปิด dropdown "ประเภท"
export async function getCostCategories() {
    const res = await api.get("/cost/GetCostCategoryList"); // ✅ path ตาม Controller คุณ — ยิง GET ไป backend
    return res.data ?? [];                                   // คืน array จาก body; ถ้าไม่มีข้อมูล (null/undefined) คืน [] กันหน้าเว็บพัง
}

// เรียก GET /cost/GetCostPurchaseTypeList เพื่อดึงรายการ "วิธีการชำระเงิน" ทั้งหมด (เช่น เงินสด/โอน)
// ใช้คู่กับ getCostCategories เสมอ (โหลดพร้อมกันใน useCostOptions.js)
export async function getCostPurchases() {
    const res = await api.get("/cost/GetCostPurchaseTypeList"); // ✅ path ตาม Controller คุณ
    return res.data ?? [];
}

// เรียก POST /cost/GetAllCostList เพื่อดึง "รายการค่าใช้จ่าย" ตามเงื่อนไขที่ส่งเข้ามาใน params
// ใช้ POST (ไม่ใช่ GET) เพราะ backend ต้องการ filter object (เดือน/ปี/สถานะจ่ายเงิน ฯลฯ) เป็น body
// เรียกจาก UnpaidCostList.jsx (params: { IsPurchase: false }) และ PaidCostList.jsx (params: filter เต็มรูปแบบ)
export async function getCostList(params) {
    const res = await api.post("/cost/GetAllCostList", params); // ส่ง params ที่ผู้เรียกกำหนดเองเป็น body ตรงๆ
    return res.data ?? [];
}

// เรียก DELETE /cost/DeleteCost/{costId} เพื่อลบรายการค่าใช้จ่าย 1 รายการ
// ใช้จาก UnpaidCostList.jsx (ปุ่มลบตรงๆ) และ ModalConfirmPayment.jsx (ปุ่มลบในโหมดแก้ไข) ทั้งคู่ผ่าน ConfirmDeleteModal ยืนยันก่อน
export async function deleteCost(costId) {
    const res = await api.delete(`/cost/DeleteCost/${costId}`); // ใส่ costId ต่อท้าย URL ตาม REST convention
    return res.data; // backend คืนข้อความสรุปผล (ใช้โชว์ toast ต่อ) ไม่ใช่ array จึงไม่ต้อง ?? []
}

// เรียก POST /cost/CreateCost เพื่อสร้างรายการค่าใช้จ่ายใหม่
// ใช้จาก ModalNewCost.jsx เมื่อกดปุ่ม "บันทึก" ในฟอร์มเพิ่มค่าใช้จ่าย
export async function createCost(payload) {
    const res = await api.post("/cost/CreateCost", payload); // payload คือฟอร์มทั้งก้อนที่ ModalNewCost.jsx ประกอบไว้แล้ว
    return res.data;
}

// เรียก POST /cost/UpdatePurchaseCost เพื่ออัปเดตรายการค่าใช้จ่าย (ใช้ได้ทั้งตอน "ยืนยันจ่ายเงิน" และ "แก้ไขรายการที่จ่ายแล้ว")
// ใช้จาก ModalConfirmPayment.jsx เมื่อกดปุ่ม "ยืนยันการจ่าย"/"บันทึกการแก้ไข"
export async function updatePurchaseCost(payload) {
    const res = await api.post("/cost/UpdatePurchaseCost", payload);
    return res.data;
}
