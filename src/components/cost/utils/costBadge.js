// ป้ายสีตามหมวดหมู่ค่าใช้จ่าย ใช้ร่วมกันระหว่าง UnpaidCostList และ PaidCostList (ทั้งเวอร์ชัน desktop + mobile)
// รับ costCategoryID (ตัวเลขจาก backend) แล้วคืนชื่อ class ของ daisyUI badge ที่ตรงกัน
// หมายเหตุ: ชื่อหมวดหมู่จริง (เช่น "ค่าวัตถุดิบ") มาจาก item.costCategory.description ที่ backend ส่งมา
// ไม่ได้ hardcode ไว้ที่นี่ — ฟังก์ชันนี้ทำหน้าที่แค่ "แปลง ID → สี" เท่านั้น
export function getCostCategoryBadgeClass(costCategoryID) {
    switch (costCategoryID) {
        case 1: return "badge-primary";
        case 2: return "badge-secondary";
        case 3: return "badge-accent";
        case 4: return "badge-info";
        case 5: return "badge-warning";
        case 6: return "badge-error";
        default: return "badge-neutral"; // ID ที่ไม่รู้จัก/ไม่มีในระบบ → สีเทากลาง กันพัง
    }
}
