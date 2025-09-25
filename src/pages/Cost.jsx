import ThemeToggle from "../components/ThemeToggle";
import ModalNewCost from "../components/cost/ModalNewCost";
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import ModalConfirmPayment from "../components/cost/ModalConfirmPayment";
import Toast from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";
/**
 * ฟังก์ชัน React Component สำหรับดึงและแสดงรายการค่าใช้จ่ายคงค้างจาก API เส้นทาง /api/GetCostList
 * - หากกำลังโหลดข้อมูลจะแสดงข้อความ "กำลังโหลดข้อมูล..."
 * - หากไม่มีข้อมูลหรือข้อมูลว่างจะแสดงข้อความ "ไม่มีค่าใช้จ่ายคงค้าง"
 * - หากมีข้อมูลจะแสดงตารางรายละเอียดค่าใช้จ่ายแต่ละรายการ
 *
 * @returns {JSX.Element} องค์ประกอบ React ที่แสดงสถานะการโหลด, ข้อมูลว่าง หรือ ตารางข้อมูลค่าใช้จ่าย
 */

// ฟังก์ชัน Component สำหรับแสดงรายการค่าใช้จ่ายคงค้าง

function GetCostNoPurchase({ refreshKey, onConfirm, showToast }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const openStockIn = (orderId) => {
    navigate(`/stockin/${orderId}`, { state: { from: '/cost' } });
  };
  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleDeleteClick = (item) => {
    setDeleteModal({ show: true, item });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete(`/cost/DeleteCost/${deleteModal.item.costID}`);
      if (response.data) {
        showToast(response.data, "success");
        handleConfirm(); // refresh data
        setDeleteModal({ show: false, item: null });
      } else {
        showToast("ไม่พบรายการที่ต้องการลบ", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("เกิดข้อผิดพลาดในการลบ", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, item: null });
  };
  // ดึงข้อมูลจาก API เมื่อ component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // เพิ่มเพื่อให้ loading ทุกครั้งที่ refreshKey เปลี่ยน
      try {
        const res = await api.post("/cost/GetAllCostList", { IsPurchase: false }); // ✅ path ตาม Controller
        const items = res.data ?? [];
        setData(items);
      } catch (err) {
        setData([]);
        console.error("❌ โหลดรายการค่าใช้จ่ายไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]); // เปลี่ยนจาก [] เป็น [refreshKey]

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
        <span className="loading loading-dots loading-md text-primary"></span>
        <span className="text-sm md:text-base text-base-content/80 font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // กรณีไม่มีข้อมูล
  if (!data || data.length === 0) {
    return (
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
              let badgeClass = "badge-accent";
              switch (item.costCategoryID) {
                case 1:
                  badgeClass = "badge-primary";
                  break;
                case 2:
                  badgeClass = "badge-error";
                  break;
                case 3:
                  badgeClass = "badge-success";
                  break;
                default:
                  badgeClass = "badge-accent";
              }
              return (
                <tr key={item.id || idx} className="hover:bg-base-200">
                  <td>
                    {item.costCategoryID == 1 && item.isStockIn
                      ? <button className="btn btn-sm lg:btn-sm btn-primary text-sm lg:text-sm" onClick={() => openStockIn(item.costID)}>รายการ</button>
                      : <ModalConfirmPayment onConfirm={handleConfirm} item={item} showToast={showToast} />}
                  </td>
                  <td className="text-sm lg:text-base">{item.costDate}</td>
                  <td>
                    <span className={`badge ${badgeClass} text-xs lg:text-sm whitespace-nowrap`}>
                      {item.costCategory.description}
                    </span>
                  </td>
                  <td className="text-right font-medium text-sm lg:text-base">{item.costPrice.toLocaleString()} บาท</td>
                  <td className="text-sm lg:text-base max-w-xs truncate" title={item.costDescription}>{item.costDescription}</td>
                  <td>
                    <button
                      className="btn btn-sm lg:btn-md btn-error text-xs lg:text-sm"
                      onClick={() => handleDeleteClick(item)}
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

      {/* Mobile Card View (<768px) */}
      <div className="md:hidden space-y-2">
        {data.map((item, idx) => {
          let badgeClass = "badge-accent";
          switch (item.costCategoryID) {
            case 1:
              badgeClass = "badge-primary";
              break;
            case 2:
              badgeClass = "badge-error";
              break;
            case 3:
              badgeClass = "badge-success";
              break;
            default:
              badgeClass = "badge-accent";
          }

          return (
            <div key={item.id || idx} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-primary/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Compact Header Row */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-base-content/60">📅</span>
                    <span className="text-sm font-medium">{item.costDate}</span>
                  </div>
                  <span className={`badge ${badgeClass} badge-sm shadow-sm`}>
                    {item.costCategory.description}
                  </span>
                </div>
                <div className="bg-primary/10 rounded-lg px-2 py-1">
                  <span className="font-bold text-sm text-primary">{item.costPrice.toLocaleString()} บาท</span>
                </div>
              </div>

              {/* Description and Action Row */}
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

      {/* Themed Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal modal-open">
          <div className="modal-box bg-gradient-to-br from-base-100 to-base-200 border-2 border-error/30 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-error/20 rounded-full">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-error">ยืนยันการลบรายการ</h3>
                <p className="text-sm text-base-content/70">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="bg-base-200/50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">วันที่:</span>
                  <span className="font-medium">{deleteModal.item?.costDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">หมวดหมู่:</span>
                  <span className="badge badge-sm">{deleteModal.item?.costCategory?.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-base-content/70">ราคา:</span>
                  <span className="font-bold text-error">{deleteModal.item?.costPrice?.toLocaleString()} บาท</span>
                </div>
                <div className="pt-2 border-t border-base-300">
                  <span className="text-sm text-base-content/70">รายละเอียด:</span>
                  <p className="text-sm mt-1 break-words">{deleteModal.item?.costDescription}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-action gap-3">
              <button
                className="btn btn-outline btn-base-content hover:bg-base-200 transition-all duration-200"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-error text-error-content shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    🗑️ ลบรายการ
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={handleDeleteCancel}></div>
        </div>
      )}
    </>
  );
}

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const getCurrentMonth = () => new Date().getMonth();
const getCurrentYear = () => new Date().getFullYear();

function GetCostIsPurchaseList({ refreshKey }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [filterMode, setFilterMode] = useState('month'); // 'month' หรือ 'year'

  // Handler functions
  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  // ฟังก์ชันสำหรับกรองข้อมูลตามเดือนหรือปี
  const getFilteredData = () => {
    if (filterMode === 'month') {
      return data.filter(item => {
        const date = new Date(item.costDate);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });
    } else {
      return data.filter(item => {
        const date = new Date(item.costDate);
        return date.getFullYear() === selectedYear;
      });
    }
  };

  // ดึงข้อมูลจาก API เมื่อ component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // เพิ่มเพื่อให้ loading ทุกครั้งที่ refreshKey เปลี่ยน
      try {
        const res = await api.post("/cost/GetAllCostList", { IsPurchase: true }); // ✅ path ตาม Controller
        const items = res.data ?? [];
        setData(items);
      } catch (err) {
        setData([]);
        console.error("โหลดรายการค่าใช้จ่ายไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]); // เปลี่ยนจาก [] เป็น [refreshKey]

  // Get filtered data
  const filteredData = getFilteredData();

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
        <span className="loading loading-dots loading-md text-primary"></span>
        <span className="text-sm md:text-base text-base-content/80 font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // กรณีไม่มีข้อมูล
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-success/20 rounded-full">
            <span className="text-4xl">✅</span>
          </div>
          <div>
            <div className="text-base font-semibold text-base-content">ไม่มีรายการที่ชำระแล้ว</div>
            <div className="text-sm text-base-content/60">ยังไม่มีประวัติการชำระเงิน</div>
          </div>
        </div>
      </div>
    );
  }

  // กรณีกรองแล้วไม่มีข้อมูล
  if (filteredData.length === 0) {
    return (
      <>
        {/* Compact Filter Controls */}
        <div className="bg-base-100 rounded-lg border border-base-300 p-3 mb-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-base-content/80 font-medium">🗓️ เดือน:</span>

            <select
              className="select select-sm select-bordered min-w-0 w-24"
              value={selectedMonth}
              onChange={handleMonthChange}
              disabled={filterMode === 'year'}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="select select-sm select-bordered min-w-0 w-20"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {[...new Set(data.map(item => new Date(item.costDate).getFullYear()))]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>

            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="checkbox"
                className="toggle toggle-xs toggle-success"
                checked={filterMode === 'year'}
                onChange={() => setFilterMode(filterMode === 'month' ? 'year' : 'month')}
              />
              <span className="text-xs">{filterMode === 'year' ? 'รายปี' : 'รายเดือน'}</span>
            </label>

            <div className="ml-auto flex items-center gap-2 text-xs text-base-content/60">
              <span className="badge badge-xs badge-outline">
                0/{data.length}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center py-8 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-warning/20 rounded-full">
              <span className="text-3xl">📅</span>
            </div>
            <div>
              <div className="text-base font-semibold text-base-content">ไม่มีรายการในช่วงเวลาที่เลือก</div>
              <div className="text-sm text-base-content/60">ลองเลือกช่วงเวลาอื่น</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // แสดงข้อมูลแบบ Responsive
  return (
    <>
      {/* Compact Filter Controls */}
      <div className="bg-base-100 rounded-lg border border-base-300 p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-base-content/80 font-medium">🗓️ เดือน:</span>

          <select
            className="select select-sm select-bordered min-w-0 w-24"
            value={selectedMonth}
            onChange={handleMonthChange}
            disabled={filterMode === 'year'}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="select select-sm select-bordered min-w-0 w-20"
            value={selectedYear}
            onChange={handleYearChange}
          >
            {[...new Set(data.map(item => new Date(item.costDate).getFullYear()))]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .sort((a, b) => b - a)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>

          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-success"
              checked={filterMode === 'year'}
              onChange={() => setFilterMode(filterMode === 'month' ? 'year' : 'month')}
            />
            <span className="text-xs">{filterMode === 'year' ? 'รายปี' : 'รายเดือน'}</span>
          </label>


        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Total Amount Card */}
        <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 shadow-sm">
          <div className="stat-figure text-primary opacity-20">
            <span className="text-2xl">💰</span>
          </div>
          <div className="stat-title text-xs text-primary/70">ค่าใช้จ่ายรวม</div>
          <div className="stat-value text-base md:text-lg font-bold text-primary">
            {filteredData.reduce((acc, item) => acc + item.costPrice, 0).toLocaleString()}
          </div>
          <div className="stat-desc text-xs text-primary/60">บาท</div>
        </div>

        {/* Total Items Card */}
        <div className="stat bg-gradient-to-br from-info/10 to-info/5 border border-info/20 rounded-xl p-3 shadow-sm">
          <div className="stat-figure text-info opacity-20">
            <span className="text-2xl">📊</span>
          </div>
          <div className="stat-title text-xs text-info/70">จำนวนรายการ</div>
          <div className="stat-value text-base md:text-lg font-bold text-info">
            {filteredData.length}
          </div>
          <div className="stat-desc text-xs text-info/60">รายการ</div>
        </div>

        {/* Category Breakdown Cards */}
        {(() => {
          const categoryStats = filteredData.reduce((acc, item) => {
            const categoryID = item.costCategoryID;
            const categoryName = item.costCategory?.description || 'อื่นๆ';

            if (!acc[categoryID]) {
              acc[categoryID] = {
                name: categoryName,
                total: 0,
                count: 0,
                color: categoryID === 1 ? 'success' : categoryID === 2 ? 'error' : categoryID === 3 ? 'warning' : 'accent'
              };
            }
            acc[categoryID].total += item.costPrice;
            acc[categoryID].count += 1;
            return acc;
          }, {});

          const sortedCategories = Object.entries(categoryStats)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 2); // Show top 2 categories

          return sortedCategories.map(([categoryID, stats]) => (
            <div key={categoryID} className={`stat bg-gradient-to-br from-${stats.color}/10 to-${stats.color}/5 border border-${stats.color}/20 rounded-xl p-3 shadow-sm`}>
              <div className={`stat-figure text-${stats.color} opacity-20`}>
                <span className="text-2xl">
                  {categoryID === '1' ? '🛒' : categoryID === '2' ? '🏠' : categoryID === '3' ? '⚡' : '📦'}
                </span>
              </div>
              <div className={`stat-title text-xs text-${stats.color}/70 truncate`} title={stats.name}>
                {stats.name}
              </div>
              <div className={`stat-value text-base md:text-lg font-bold text-${stats.color}`}>
                {stats.total.toLocaleString()}
              </div>
              <div className={`stat-desc text-xs text-${stats.color}/60`}>
                {stats.count} รายการ
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Detailed Category Breakdown */}
      {filteredData.length > 0 && (
        <div className="bg-base-100 rounded-lg border border-base-300 p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
              <span>📈</span>
              <span>สรุปตามหมวดหมู่</span>
            </h3>
            <div className="text-xs text-base-content/60">
              {filterMode === 'month'
                ? `${months[selectedMonth]} ${selectedYear}`
                : `ปี ${selectedYear}`
              }
            </div>
          </div>

          <div className="space-y-2">
            {(() => {
              const categoryStats = filteredData.reduce((acc, item) => {
                const categoryID = item.costCategoryID;
                const categoryName = item.costCategory?.description || 'อื่นๆ';

                if (!acc[categoryID]) {
                  acc[categoryID] = {
                    name: categoryName,
                    total: 0,
                    count: 0,
                    color: categoryID === 1 ? 'primary' : categoryID === 2 ? 'error' : categoryID === 3 ? 'success' : 'accent'
                  };
                }
                acc[categoryID].total += item.costPrice;
                acc[categoryID].count += 1;
                return acc;
              }, {});

              const totalAmount = filteredData.reduce((acc, item) => acc + item.costPrice, 0);

              return Object.entries(categoryStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([categoryID, stats]) => {
                  const percentage = totalAmount > 0 ? (stats.total / totalAmount * 100) : 0;

                  return (
                    <div key={categoryID} className="flex items-center justify-between p-2 bg-base-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">
                          {categoryID === '1' ? '🛒' : categoryID === '2' ? '🏠' : categoryID === '3' ? '⚡' : '📦'}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-base-content">{stats.name}</div>
                          <div className="text-xs text-base-content/60">{stats.count} รายการ</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-base-content">
                          {stats.total.toLocaleString()} บาท
                        </div>
                        <div className="text-xs text-base-content/60">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      )}

      {/* Desktop/Tablet Table View (≥768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="text-sm lg:text-base">📅 วันที่</th>
              <th className="text-sm lg:text-base">🏷️ หมวดหมู่</th>
              <th className="text-right text-sm lg:text-base">💰 ราคา</th>
              <th className="text-sm lg:text-base">📝 รายละเอียดการซื้อ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-base-200">
                <td className="text-sm lg:text-base">{item.costDate}</td>
                <td className="text-sm lg:text-base">
                  <span className="badge badge-success text-xs lg:text-sm whitespace-nowrap">
                    {item.costCategory.description}
                  </span>
                </td>
                <td className="text-right font-medium text-sm lg:text-base">{item.costPrice.toLocaleString()} บาท</td>
                <td className="text-sm lg:text-base max-w-xs truncate" title={item.costDescription}>{item.costDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<768px) */}
      <div className="md:hidden space-y-2">
        <div className="ml-auto flex items-center gap-2 text-xs text-base-success/60">
          <span className="badge badge-xs badge-outline">
            รายการ {filteredData.length}/{data.length}
          </span>
        </div>
        {filteredData.map((item, idx) => (
          <div key={item.id || idx} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-success/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
            {/* Compact Header Row */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-2 py-1">
                  <span className="text-xs text-base-content/60">📅</span>
                  <span className="text-sm font-medium">{item.costDate}</span>
                </div>
                <span className="badge badge-success badge-sm shadow-sm whitespace-nowrap">
                  {item.costCategory.description}
                </span>
              </div>
              <div className="bg-success/10 rounded-lg px-2 py-1">
                <span className="font-bold text-sm text-success">{item.costPrice.toLocaleString()} บาท</span>
              </div>
            </div>

            {/* Description Row */}
            <div className="text-xs text-base-content/80 truncate bg-base-200/30 rounded px-2 py-1" title={item.costDescription}>
              💬 {item.costDescription}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
export default function Cost() {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const hideTimer = useRef(null);

  const showToast = (message, type = "success", duration = 2000) => {
    // เคลียร์ timer เดิม (กันทับ)
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({ show: true, message, type });
    hideTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), duration);
  };

  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    // ฟังก์ชันสำหรับรีเฟรชข้อมูล
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="p-2 md:p-4 space-y-2 md:space-y-3 max-w-7xl mx-auto">
      {/* Global Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />

      {/* Header Section */}
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
            <ModalNewCost onCreated={refreshData} showToast={showToast} />
          </div>
        </div>
      </div>

      {/* Unpaid Expenses Card */}
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
          <GetCostNoPurchase refreshKey={refreshKey} onConfirm={refreshData} showToast={showToast} />
        </div>
      </div>

      {/* Paid Expenses Card */}
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
          <GetCostIsPurchaseList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
