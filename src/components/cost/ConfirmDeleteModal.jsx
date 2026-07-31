import { useEffect, useRef } from "react";
import { formatCurrency } from "../../lib/formatUtils"; // format ราคาให้มี comma คั่นหลักพัน

/**
 * ยืนยันการลบรายการค่าใช้จ่าย ใช้ native <dialog> เพื่อให้ซ้อนเปิดทับ modal อื่น (เช่น ModalConfirmPayment) ได้ถูกต้อง
 * โดย top layer ของ <dialog> จัดการลำดับการแสดงผลให้เองโดยไม่ต้องกังวลเรื่อง z-index/stacking context
 *
 * Props:
 * - show: boolean       ควบคุมเปิด/ปิด (ไม่ใช่ conditional render ธรรมดา — ใช้ effect สั่ง showModal()/close() แทน)
 * - item: object         รายการค่าใช้จ่ายที่กำลังจะลบ (เอาไปโชว์รายละเอียดให้ผู้ใช้เช็คก่อนกดยืนยัน)
 * - isDeleting: boolean  true ระหว่างรอ API ลบเสร็จ (ใช้ปิดปุ่ม/โชว์ spinner)
 * - onConfirm, onCancel: callback ไม่รับ argument ที่มีความหมาย เรียกจากปุ่มหรือ native cancel event (กด Esc)
 */
export default function ConfirmDeleteModal({ show, item, isDeleting, onConfirm, onCancel }) {
  const dialogRef = useRef(null); // อ้างอิง DOM node ของ <dialog> เพื่อเรียก .showModal()/.close() ตรงๆ (React ไม่มี prop ควบคุมสองอย่างนี้ให้)

  // ทุกครั้งที่ prop `show` เปลี่ยน ให้สั่งเปิด/ปิด dialog จริงๆ ผ่าน DOM API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return; // ยังไม่ mount เสร็จ (เช่น render ครั้งแรกก่อน ref ผูกเสร็จ) ข้ามไปก่อน
    if (show && !dialog.open) dialog.showModal(); // อยากให้โชว์ แต่ตอนนี้ยังปิดอยู่ → เปิด (เข้า top layer ของ browser)
    if (!show && dialog.open) dialog.close();     // อยากให้ซ่อน แต่ตอนนี้ยังเปิดอยู่ → ปิด
  }, [show]); // ทำงานใหม่ทุกครั้งที่ show เปลี่ยนค่าเท่านั้น

  return (
    // onCancel ดักจับ native "cancel" event ของ <dialog> (ผู้ใช้กด Esc) ให้เรียก callback เดียวกับปุ่ม "ยกเลิก"
    <dialog ref={dialogRef} className="modal" onCancel={onCancel}>
      <div className="modal-box bg-gradient-to-br from-base-100 to-base-200 border-2 border-error/30 shadow-2xl">
        {/* Modal Header: ไอคอนถังขยะ + หัวข้อ + คำเตือนว่าย้อนกลับไม่ได้ */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-error/20 rounded-full">
            <span className="text-2xl">🗑️</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-error">ยืนยันการลบรายการ</h3>
            <p className="text-sm text-base-content/70">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>

        {/* Modal Content: สรุปข้อมูลของรายการที่จะลบ ให้ผู้ใช้เช็คอีกครั้งว่าใช่รายการที่ตั้งใจลบจริง */}
        <div className="bg-base-200/50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">วันที่:</span>
              <span className="font-medium">{item?.costDate}</span> {/* ?. กันกรณี item ยังเป็น null ตอนแรก render ก่อน state อัปเดต */}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">หมวดหมู่:</span>
              <span className="badge badge-sm">{item?.costCategory?.description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">ราคา:</span>
              <span className="font-bold text-error">{formatCurrency(item?.costPrice)} บาท</span>
            </div>
            <div className="pt-2 border-t border-base-300">
              <span className="text-sm text-base-content/70">รายละเอียด:</span>
              <p className="text-sm mt-1 break-words">{item?.costDescription}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions: ปุ่มยกเลิก (ปิด modal เฉยๆ) และปุ่มยืนยันลบ (เรียก onConfirm ให้ผู้เรียกไปสั่ง API ลบจริง) */}
        <div className="modal-action gap-3">
          <button
            className="btn btn-outline btn-base-content hover:bg-base-200 transition-all duration-200"
            onClick={onCancel}
            disabled={isDeleting} // ระหว่างกำลังลบ ห้ามกดยกเลิก กันสถานะค้าง/แข่งกับ request ที่ยิงไปแล้ว
          >
            ยกเลิก
          </button>
          <button
            className="btn btn-error text-error-content shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={onConfirm}
            disabled={isDeleting} // กันกดซ้ำระหว่างรอผลลัพธ์
          >
            {isDeleting ? (
              // กำลังลบอยู่ → โชว์ spinner + ข้อความรอ
              <>
                <span className="loading loading-spinner loading-sm"></span>
                กำลังลบ...
              </>
            ) : (
              // ยังไม่กด → โชว์ปุ่มปกติ
              <>🗑️ ลบรายการ</>
            )}
          </button>
        </div>
      </div>
      {/* พื้นหลังโปร่งแสง คลิกนอกกล่องเพื่อยกเลิกได้เหมือนกดปุ่ม "ยกเลิก" */}
      <div className="modal-backdrop bg-black/50" onClick={onCancel}></div>
    </dialog>
  );
}
