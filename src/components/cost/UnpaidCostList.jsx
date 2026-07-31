import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalConfirmPayment from "./ModalConfirmPayment"; // ปุ่ม + form modal "ยืนยันจ่ายเงิน" ต่อรายการ
import ConfirmDeleteModal from "./ConfirmDeleteModal";     // modal ยืนยันก่อนลบ (ใช้ร่วมกับ PaidCostList/ModalConfirmPayment)
import LoadingState from "../common/LoadingState";         // บล็อก spinner + ข้อความ "กำลังโหลดข้อมูล..."
import { getCostList, deleteCost } from "../../services/costService"; // เรียก backend ผ่าน service layer เท่านั้น ไม่มี api.* ตรงในไฟล์นี้
import { formatCurrency } from "../../lib/formatUtils";     // format ราคาให้มี comma คั่นหลักพัน
import { getCostCategoryBadgeClass } from "./utils/costBadge"; // แปลง costCategoryID → สี badge

/**
 * แสดงรายการค่าใช้จ่ายที่ยังไม่ชำระเงิน (คงค้าง) พร้อมปุ่มลบ/จ่ายเงิน
 * - หากกำลังโหลดข้อมูลจะแสดงข้อความ "กำลังโหลดข้อมูล..."
 * - หากไม่มีข้อมูลหรือข้อมูลว่างจะแสดงข้อความ "ไม่มีค่าใช้จ่ายคงค้าง"
 * - หากมีข้อมูลจะแสดงตารางรายละเอียดค่าใช้จ่ายแต่ละรายการ
 *
 * Props (ทั้งหมดส่งมาจาก src/pages/Cost.jsx):
 * - refreshKey: เปลี่ยนค่าทุกครั้งที่ต้อง fetch ใหม่ (เช่น พึ่งเพิ่ม/ลบ/จ่ายรายการที่อื่น)
 * - onConfirm: callback เรียกกลับไปบอก Cost.jsx ให้ refresh ทั้งหน้าเมื่อจ่ายเงิน/ลบสำเร็จ
 * - showToast: ฟังก์ชันโชว์ toast กลางของหน้า Cost
 */
export default function UnpaidCostList({ refreshKey, onConfirm, showToast }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);                                   // array รายการค่าใช้จ่ายที่ดึงมาจาก backend
  const [loading, setLoading] = useState(true);                           // true ระหว่างรอ fetch ครั้งแรก/ทุกครั้งที่ refreshKey เปลี่ยน
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null }); // ควบคุม ConfirmDeleteModal: show=เปิดไหม, item=รายการที่กำลังจะลบ
  const [isDeleting, setIsDeleting] = useState(false);                    // true ระหว่างรอ API ลบตอบกลับ (ปิดปุ่มกันกดซ้ำ)
  const navigate = useNavigate();                                         // ใช้เปลี่ยนหน้าไป /stockin/:id

  // กดปุ่ม "รายการ"/"ดูรายการ" (เฉพาะรายการที่มาจากการรับของเข้าสต๊อก) → เด้งไปหน้า StockIn ของออเดอร์นั้น
  const openStockIn = (orderId) => {
    navigate(`/stockin/${orderId}`, { state: { from: '/cost' } }); // ส่ง state 'from' ไว้ให้หน้า StockIn รู้ว่าต้องกลับมาที่ /cost
  };

  // เรียกทุกครั้งที่ ModalConfirmPayment จ่ายเงินสำเร็จ → บอก parent (Cost.jsx) ให้ refresh ทั้งหน้า
  const handleConfirm = () => {
    onConfirm?.();
  };

  // กดปุ่ม "ลบ" ที่แถว/การ์ดของรายการ → เปิด ConfirmDeleteModal พร้อมจำไว้ว่ากำลังจะลบ item ไหน
  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item });
  };

  // กดปุ่ม "ลบรายการ" ยืนยันใน ConfirmDeleteModal → ยิง API ลบจริง
  const handleDeleteConfirm = async () => {
    setIsDeleting(true); // ล็อกปุ่มไว้ระหว่างรอผล
    try {
      const result = await deleteCost(deleteModal.item.costID); // เรียก service ลบตาม costID ของรายการที่เลือกไว้
      if (result) {
        showToast(result, "success");            // backend คืนข้อความสรุปผลมา ใช้เป็นข้อความ toast ตรงๆ
        handleConfirm(); // refresh data          // บอก parent ให้ดึงข้อมูลใหม่ทั้งหน้า (รายการที่ลบไปจะหายจาก list)
        setDeleteModal({ show: false, item: null }); // ปิด modal
      } else {
        showToast("ไม่พบรายการที่ต้องการลบ", "error"); // backend ตอบมาแบบไม่มีผลลัพธ์ (falsy) ถือว่าลบไม่สำเร็จ
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("เกิดข้อผิดพลาดในการลบ", "error"); // เช่น network error, 500 จาก backend ฯลฯ
    } finally {
      setIsDeleting(false); // ปลดล็อกปุ่มไม่ว่าผลจะเป็นอย่างไร
    }
  };

  // กดปุ่ม "ยกเลิก" หรือคลิกพื้นหลัง/กด Esc ใน ConfirmDeleteModal → ปิด modal เฉยๆ ไม่ลบอะไร
  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, item: null });
  };

  // ดึงข้อมูลจาก API เมื่อ component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // เพิ่มเพื่อให้ loading ทุกครั้งที่ refreshKey เปลี่ยน
      try {
        const items = await getCostList({ IsPurchase: false }); // ขอเฉพาะรายการที่ "ยังไม่จ่าย" (IsPurchase: false)
        setData(items);
      } catch (err) {
        setData([]); // fetch พังก็เคลียร์ data ทิ้ง กันโชว์ข้อมูลเก่าค้าง
        console.error("❌ โหลดรายการค่าใช้จ่ายไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]); // เปลี่ยนจาก [] เป็น [refreshKey] — ทำให้ fetch ใหม่ทุกครั้งที่ Cost.jsx เปลี่ยนค่า refreshKey (หลังเพิ่ม/แก้/ลบรายการ)

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return <LoadingState />; // ยังไม่มีข้อมูล ไม่ต้อง render ตาราง — คืนเฉพาะ spinner แล้วจบฟังก์ชันตรงนี้เลย
  }

  // กรณีไม่มีข้อมูล
  if (!data || data.length === 0) {
    return ( // โหลดเสร็จแล้วแต่ไม่มีรายการค้างจ่ายเลย → โชว์ empty state แทนตารางเปล่า
      <div className="text-center py-1 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
        <div className="flex flex-col items-center gap-3">
          <div>
            <div className="text-base font-semibold text-base-content">ไม่มีค่าใช้จ่ายคงค้าง</div>
            <div className="text-sm text-base-content/60">ขณะนี้ไม่มีรายการที่รอชำระเงิน</div>
          </div>
        </div>
      </div>
    );
  }

  // แสดงข้อมูลแบบ Responsive
  // ต่อจากนี้คือ "มีข้อมูลแน่นอน" (ผ่าน 2 เงื่อนไข early-return ด้านบนมาแล้ว) — render ตาราง desktop + การ์ด mobile คู่ขนานกัน
  // ทั้งสองแบบวนลูปข้อมูลชุดเดียวกัน (data.map) แค่คนละ layout เท่านั้น ใช้ CSS class hidden/md:block, md:hidden สลับการแสดงตาม breakpoint
  return (
    <>
      {/* Desktop/Tablet Table View (≥768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="text-sm lg:text-base">การจัดการ</th>
              <th className="text-sm lg:text-base">วันที่</th>
              <th className="text-sm lg:text-base">หมวดหมู่</th>
              <th className="text-right text-sm lg:text-base">ราคา</th>
              <th className="text-sm lg:text-base">รายละเอียดการซื้อ</th>
              <th className="text-sm lg:text-base">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              return (
                <tr key={item.id || idx} className="hover:bg-base-200">
                  <td>
                    {/* เงื่อนไขนี้แยกรายการเป็น 2 แบบ:
                        1) costCategoryID==1 (หมวดวัตถุดิบ) และมาจากการรับของเข้าสต๊อกแล้ว (isStockIn) → ไม่ต้องจ่ายผ่าน modal นี้ ให้กดไปดูรายการที่หน้า StockIn แทน
                        2) นอกนั้น → โชว์ปุ่ม/modal "จ่ายเงิน" ปกติ */}
                    {item.costCategoryID == 1 && item.isStockIn
                      ? <button className="btn btn-sm lg:btn-sm btn-primary text-sm lg:text-sm" onClick={() => openStockIn(item.costID)}>รายการ</button>
                      : <ModalConfirmPayment onConfirm={handleConfirm} item={item} showToast={showToast} />}
                  </td>
                  <td className="text-sm lg:text-base">{item.costDate}</td>
                  <td className="text-sm lg:text-base">
                    <span className={`badge badge-sm shadow-sm whitespace-nowrap ${getCostCategoryBadgeClass(item.costCategoryID)}`}>
                      {item.costCategory.description} {/* ชื่อหมวดหมู่จริงมาจาก backend ตรงๆ ไม่ได้ hardcode */}
                    </span>
                  </td>
                  <td className="text-right font-medium text-sm lg:text-base">{formatCurrency(item.costPrice)} บาท</td>
                  <td className="text-sm lg:text-base max-w-xs truncate" title={item.costDescription}>{item.costDescription}</td>
                  <td>
                    <button
                      className="btn btn-sm lg:btn-md btn-error text-xs lg:text-sm"
                      onClick={() => handleDeleteClick(item)} // เปิด ConfirmDeleteModal พร้อม item นี้ ยังไม่ลบจริง
                      title="ลบรายการ"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<768px) — ข้อมูลชุดเดียวกับตาราง แต่จัด layout เป็นการ์ดแทนแถวตาราง */}
      <div className="md:hidden space-y-2">
        {data.map((item, idx) => {
          return (
            <div key={item.id || idx} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-primary/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Compact Header Row: วันที่ + badge หมวดหมู่ (ซ้าย), ราคา (ขวา) */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-base-content/60">📅</span>
                    <span className="text-sm font-medium">{item.costDate}</span>
                  </div>
                  <span className={`badge badge-sm shadow-sm whitespace-nowrap ${getCostCategoryBadgeClass(item.costCategoryID)}`}>
                    {item.costCategory.description}
                  </span>
                </div>
                <div className="bg-primary/10 rounded-lg px-2 py-1">
                  <span className="font-bold text-sm text-primary">{formatCurrency(item.costPrice)} บาท</span>
                </div>
              </div>

              {/* Description and Action Row: รายละเอียด (ซ้าย), ปุ่มลบ + ปุ่มจ่ายเงิน/ดูรายการ (ขวา) */}
              <div className="flex justify-between items-center gap-2">
                <div className="text-xs text-base-content/80 flex-1 truncate bg-base-200/30 rounded px-2 py-1" title={item.costDescription}>
                  💬 {item.costDescription}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDeleteClick(item)}
                  >
                    🗑️ ลบ
                  </button>
                  {/* เงื่อนไขเดียวกับฝั่ง desktop ด้านบน — ต้องคง logic ตรงกันทั้งสอง view */}
                  {item.costCategoryID == 1 && item.isStockIn
                    ? <button className="btn btn-sm btn-primary shadow-md hover:shadow-lg whitespace-nowrap transition-all duration-200" onClick={() => openStockIn(item.costID)}>
                      📦 ดูรายการ
                    </button>
                    : <ModalConfirmPayment onConfirm={handleConfirm} item={item} showToast={showToast} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* modal ยืนยันลบ ตัวเดียวใช้ร่วมกันทั้งตาราง+การ์ด ควบคุมด้วย deleteModal state ด้านบน */}
      <ConfirmDeleteModal
        show={deleteModal.show}
        item={deleteModal.item}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
