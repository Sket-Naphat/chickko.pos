import { useState, useCallback } from "react";
import { getCostCategories, getCostPurchases } from "../../../services/costService"; // ฟังก์ชันเรียก API จริง (services layer)

// Custom hook: โหลดหมวดหมู่ + วิธีการชำระเงินพร้อมกัน ใช้ร่วมกันระหว่าง ModalNewCost และ ModalConfirmPayment
// (ทั้งสอง modal ต้องใช้ 2 รายการนี้เหมือนกันตอนเปิด modal เพื่อเติม dropdown)
export function useCostOptions() {
    const [categories, setCategories] = useState([]);      // เก็บผลลัพธ์รายการหมวดหมู่ (state ให้ component ที่เรียกใช้ re-render เมื่อโหลดเสร็จ)
    const [purchaseTypes, setPurchaseTypes] = useState([]); // เก็บผลลัพธ์รายการวิธีชำระเงิน
    const [isLoading, setIsLoading] = useState(false);      // สถานะกำลังโหลด ใช้ปิดปุ่ม/โชว์ spinner ฝั่ง component

    // ฟังก์ชันสั่งโหลดจริง — ห่อด้วย useCallback เพื่อให้ reference คงที่ (เผื่อถูกใส่ใน dependency array ของ useEffect ที่อื่น)
    const loadOptions = useCallback(async () => {
        setIsLoading(true); // เริ่มโหลด → true ก่อน
        try {
            // ยิงสองคำขอพร้อมกันด้วย Promise.all แทนการ await ทีละอัน เพื่อลดเวลารอ (ทั้งสองไม่ขึ้นต่อกัน)
            const [categoriesRes, purchaseTypesRes] = await Promise.all([
                getCostCategories(),
                getCostPurchases(),
            ]);
            setCategories(categoriesRes);           // เก็บผลลัพธ์เข้า state ให้ component re-render
            setPurchaseTypes(purchaseTypesRes);
            // คืนค่ากลับไปด้วย (นอกจาก set state) เพราะ setState เป็น async — ผู้เรียก (openModal ในแต่ละ modal)
            // ต้องใช้ค่าที่เพิ่งโหลดมาทันทีเพื่อตั้งค่า default ของ dropdown โดยไม่ต้องรอ re-render รอบถัดไป
            return { categories: categoriesRes, purchaseTypes: purchaseTypesRes };
        } finally {
            setIsLoading(false); // ไม่ว่าสำเร็จหรือ error (error จะโยนต่อให้ผู้เรียก catch เอง) ก็ปิดสถานะโหลดเสมอ
        }
    }, []); // dependency ว่าง เพราะฟังก์ชันนี้ไม่ได้อ้างอิง state/props ภายนอกเลย

    // ส่งออกทั้ง state และฟังก์ชันโหลด ให้ component ที่ใช้ hook นี้เรียก loadOptions() ตอนเปิด modal เอง
    return { categories, purchaseTypes, isLoading, loadOptions };
}
