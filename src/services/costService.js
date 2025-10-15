import { api } from "../lib/api";
export async function getCostCategories() {
    const res = await api.get("/cost/GetCostCategoryList"); // ✅ path ตาม Controller คุณ
    return res.data ?? [];
}
export const formatDisplayDate = (dateString) => {
  // สร้าง Date object จาก string
  const date = new Date(dateString);
  
  // ตรวจสอบว่าเป็น valid date หรือไม่
  if (isNaN(date.getTime())) {
    return dateString; // return กลับไปถ้าไม่ใช่วันที่ที่ถูกต้อง
  }
  
  // Array ชื่อวันภาษาไทย
  const dayNames = [
    'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
  ];
  
  // Array ชื่อเดือนภาษาไทย
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  // ดึงข้อมูลวัน เดือน ปี
  const dayName = dayNames[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const monthName = monthNames[date.getMonth()];
  //const year = date.getFullYear(); // ✅ แปลงเป็นปีพุทธศักราช
  
  // สร้าง format: วัน เสาร์ ที่ 01 ตุลาคม 2568
//   return `วัน${dayName} ที่ ${day} ${monthName} ${year}`;
return `วัน${dayName} ที่ ${day} ${monthName} `;
};