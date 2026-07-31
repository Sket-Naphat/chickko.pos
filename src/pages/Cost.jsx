import { useState, useEffect, useRef } from "react";
import ModalNewCost from "../components/cost/ModalNewCost";       // ปุ่ม + form modal "เพิ่มค่าใช้จ่ายใหม่"
import UnpaidCostList from "../components/cost/UnpaidCostList";   // ตาราง/การ์ด รายการค้างจ่าย (ดึงข้อมูลเอง)
import PaidCostList from "../components/cost/PaidCostList";       // ตาราง/การ์ด รายการจ่ายแล้ว + ตัวกรองเดือน/ปี (ดึงข้อมูลเอง)
import Toast from "../components/ui/Toast";                       // กล่องแจ้งเตือนลอยมุมล่าง ใช้แสดงผล action ทั้งหมดในหน้านี้

// หน้า "บันทึกค่าใช้จ่าย" (route /cost) — ทำหน้าที่แค่เป็น "page shell":
// ประกอบ layout, ถือ state ที่ share กันระหว่าง child (toast, refreshKey), ไม่มี logic เรียก API เองเลย
// (logic การดึง/แก้/ลบข้อมูลจริงอยู่ใน UnpaidCostList / PaidCostList / ModalNewCost แทน)
export default function Cost() {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" }); // state ของ Toast กลางที่ทุก child เรียกผ่าน showToast()
  const hideTimer = useRef(null); // เก็บ timer id ของ setTimeout ที่จะซ่อน toast อัตโนมัติ (ไว้ clear ทิ้งถ้ามี toast ใหม่มาซ้อน)

  // ✅ เพิ่ม state สำหรับ Go to Top
  const [showGoTop, setShowGoTop] = useState(false); // true เมื่อ scroll ลงมาเกิน 300px แล้วโชว์ปุ่มลอย "กลับขึ้นบน"

  // ✅ เพิ่ม scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowGoTop(window.scrollY > 300); // เช็คตำแหน่ง scroll ปัจจุบัน ทุกครั้งที่ผู้ใช้เลื่อนหน้าจอ
    };
    window.addEventListener("scroll", handleScroll); // ผูก listener ตอน mount
    return () => window.removeEventListener("scroll", handleScroll); // ถอด listener ตอน unmount กัน memory leak
  }, []); // ทำครั้งเดียวตอน mount เท่านั้น

  // ✅ ฟังก์ชัน scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" }); // เลื่อนกลับขึ้นบนสุดแบบ smooth animation
  };

  // ฟังก์ชันกลางสำหรับโชว์ toast — ส่งลงไปเป็น prop `showToast` ให้ ModalNewCost, UnpaidCostList, PaidCostList เรียกใช้
  const showToast = (message, type = "success", duration = 2000) => {
    // เคลียร์ timer เดิม (กันทับ)
    if (hideTimer.current) clearTimeout(hideTimer.current); // ถ้ามี toast ก่อนหน้ายังรอปิดอยู่ ยกเลิกก่อน กันมันไปปิด toast ใหม่แทน
    setToast({ show: true, message, type });                // โชว์ toast ใหม่ทันที
    hideTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), duration); // ตั้งเวลาให้ปิดอัตโนมัติ
  };

  const [refreshKey, setRefreshKey] = useState(0); // ตัวเลขที่เพิ่มขึ้นทุกครั้งที่ต้องการบอกให้ list ทั้งสองก้อน fetch ข้อมูลใหม่

  const refreshData = () => {
    // ฟังก์ชันสำหรับรีเฟรชข้อมูล
    setRefreshKey((prev) => prev + 1); // เปลี่ยนค่า refreshKey → useEffect ใน UnpaidCostList/PaidCostList ที่มี refreshKey เป็น dependency จะ fetch ใหม่
  }

  return (
    <div className="p-2 md:p-4 space-y-2 md:space-y-3 max-w-7xl mx-auto">
      {/* Global Toast: โชว์ตาม state ด้านบน ไม่มี logic เอง แค่รับ props มาแสดงผล */}
      <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />

      {/* Header Section: ชื่อหน้า + ปุ่มเปิด modal เพิ่มรายการใหม่ */}
      <div className="bg-gradient-to-r from-accent/10 to-secondary/10 backdrop-blur-sm border border-accent/20 rounded-xl p-2 md:p-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent/20 rounded-lg">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-primary">
                บันทึกค่าใช้จ่าย
              </h1>
              <p className="text-xs text-base-content/70 hidden sm:block">
                จัดการรายการค่าใช้จ่ายของร้าน
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {/* onCreated={refreshData}: พอสร้างรายการใหม่สำเร็จ ให้สั่ง list ทั้งสองก้อน fetch ใหม่
                showToast={showToast}: ให้ modal เรียกโชว์ toast กลางได้เมื่อบันทึกสำเร็จ/ล้มเหลว */}
            <ModalNewCost onCreated={refreshData} showToast={showToast} />
          </div>
        </div>
      </div>

      {/* Unpaid Expenses Card: กรอบการ์ดสีแดง ครอบ UnpaidCostList ไว้ */}
      <div className="card bg-base-100 shadow-xl border-2 border-error/30 hover:border-error/50 transition-all duration-300 rounded-xl overflow-hidden">
        <div className="card-header bg-gradient-to-r from-error/10 to-error/5 border-b border-error/20 p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-error/20 rounded-lg">
                <span className="text-base">⚠️</span>
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-error">
                  รายการค่าใช้จ่ายที่ยังไม่ชำระเงิน
                </h2>
                <p className="text-xs text-error/70 hidden sm:block">รายการที่รอดำเนินการชำระเงิน</p>
              </div>
            </div>
            <div className="badge badge-error badge-sm shadow-md">
              <span className="text-xs font-medium">รอดำเนินการ</span>
            </div>
          </div>
        </div>
        <div className="card-body p-3 md:p-4 bg-gradient-to-b from-base-100 to-base-50">
          {/* refreshKey: trigger ให้ fetch ใหม่ / onConfirm: เรียกกลับมาที่นี่เมื่อจ่ายเงิน/ลบสำเร็จ เพื่อ refresh ทั้งหน้า / showToast: ส่งลงไปให้ modal ลูกใช้ */}
          <UnpaidCostList refreshKey={refreshKey} onConfirm={refreshData} showToast={showToast} />
        </div>
      </div>

      {/* Paid Expenses Card: กรอบการ์ดสีเขียว ครอบ PaidCostList ไว้ */}
      <div className="card bg-base-100 shadow-xl border-2 border-success/30 hover:border-success/50 transition-all duration-300 rounded-xl overflow-hidden">
        <div className="card-header bg-gradient-to-r from-success/10 to-success/5 border-b border-success/20 p-2 md:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-success/20 rounded-lg">
                <span className="text-base">✅</span>
              </div>
              <div>
                <h2 className="text-sm md:text-base font-bold text-success">
                  รายการค่าใช้จ่ายที่ชำระเงินแล้ว
                </h2>
                <p className="text-xs text-success/70 hidden sm:block">รายการที่ดำเนินการเสร็จสิ้นแล้ว</p>
              </div>
            </div>
            <div className="badge badge-success badge-sm shadow-md">
              <span className="text-xs font-medium">ดำเนินการแล้ว</span>
            </div>
          </div>
        </div>
        <div className="card-body p-3 md:p-4 bg-gradient-to-b from-base-100 to-base-50">
          {/* PaidCostList ดึงข้อมูลเองผ่านตัวกรองเดือน/ปีภายในตัวมันเอง ไม่ต้องรับ onConfirm เพราะ modal แก้ไข/ลบข้างในเรียก refresh ของตัวเองอยู่แล้ว */}
          <PaidCostList refreshKey={refreshKey} showToast={showToast} />
        </div>
      </div>

      {/* ✅ ปุ่ม Go to Top: โชว์เฉพาะตอน scroll ลงมาไกลพอ (ดูจาก showGoTop) */}
      {showGoTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 btn btn-circle btn-primary shadow-lg"
          aria-label="กลับขึ้นด้านบน"
        >
          ▲
        </button>
      )}
    </div>
  );
}
