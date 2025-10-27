import ThemeToggle from "../components/ThemeToggle";
import ModalNewCost from "../components/cost/ModalNewCost";
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import ModalConfirmPayment from "../components/cost/ModalConfirmPayment";
import Toast from "../components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "../services/costService";

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
              // No need for badgeClass, use inline logic below
              return (
                <tr key={item.id || idx} className="hover:bg-base-200">
                  <td>
                    {item.costCategoryID == 1 && item.isStockIn
                      ? <button className="btn btn-sm lg:btn-sm btn-primary text-sm lg:text-sm" onClick={() => openStockIn(item.costID)}>รายการ</button>
                      : <ModalConfirmPayment onConfirm={handleConfirm} item={item} showToast={showToast} />}
                  </td>
                  <td className="text-sm lg:text-base">{item.costDate}</td>
                  <td className="text-sm lg:text-base">
                    <span className={`badge badge-sm shadow-sm whitespace-nowrap ${item.costCategoryID === 1 ? 'badge-primary' :      // ค่าวัตถุดิบรายวัน
                      item.costCategoryID === 2 ? 'badge-secondary' :    // ค่าน้ำค่าไฟ
                        item.costCategoryID === 3 ? 'badge-accent' :       // ค่าน้ำค่าไฟ
                          item.costCategoryID === 4 ? 'badge-warning' :         // ค่าวัตถุดิบเก็บตุน
                            item.costCategoryID === 5 ? 'badge-info' :      // ค่าแรงทีมบริหาร
                              item.costCategoryID === 6 ? 'badge-error' :        // แกรปหักเพิ่มเติม
                                'badge-neutral'                                     // default
                      }`}>
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
          return (
            <div key={item.id || idx} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-primary/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Compact Header Row */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-base-content/60">📅</span>
                    <span className="text-sm font-medium">{item.costDate}</span>
                  </div>
                  <span className={`badge badge-sm shadow-sm whitespace-nowrap ${item.costCategoryID === 1 ? 'badge-primary' :      // วัตถุดิบ - สีน้ำเงิน
                    item.costCategoryID === 2 ? 'badge-secondary' :    // ค่าแรงงาน - สีเทา
                      item.costCategoryID === 3 ? 'badge-accent' :       // ค่าสาธารณูปโภค - สีม่วง
                        item.costCategoryID === 4 ? 'badge-info' :         // วัสดุสิ้นเปลือง - สีฟ้า
                          item.costCategoryID === 5 ? 'badge-warning' :      // ค่าเช่าร้าน - สีเหลือง
                            item.costCategoryID === 6 ? 'badge-error' :        // อื่นๆ (grab) - สีแดง
                              'badge-neutral'                                     // default
                    }`}>
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
  // ✅ เพิ่ม state สำหรับ sorting
  const [sortBy, setSortBy] = useState('costDate'); // 'costDate' หรือ 'lastModified'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' หรือ 'desc'
  // ✅ เพิ่ม state สำหรับ category filter
  const [selectedCategory, setSelectedCategory] = useState(''); // category filter

  // Handler functions
  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  // ✅ เพิ่ม handler สำหรับ category filter
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // ✅ ฟังก์ชัน toggle sort
  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // ✅ ฟังก์ชันสำหรับ filter และ sort ข้อมูล
  const getFilteredAndSortedData = (data) => {
    // Filter by category first
    let filtered = data;
    if (selectedCategory && selectedCategory !== '') {
      filtered = data.filter(item => String(item.costCategoryID) === String(selectedCategory));
    }

    // Then sort the filtered data
    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'costDate') {
        aValue = new Date(a.costDate);
        bValue = new Date(b.costDate);
      } else { // lastModified
        const aUpdateDate = a.updateDate || a.createDate;
        const bUpdateDate = b.updateDate || b.createDate;
        aValue = aUpdateDate ? new Date(aUpdateDate) : new Date(0);
        bValue = bUpdateDate ? new Date(bUpdateDate) : new Date(0);
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  };

  // ✅ ฟังก์ชันสำหรับดึง unique categories จากข้อมูล
  const getUniqueCategories = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    const categoryMap = new Map();
    data.forEach(item => {
      if (item?.costCategory && item?.costCategoryID) {
        categoryMap.set(item.costCategoryID, {
          costCategoryID: item.costCategoryID,
          description: item.costCategory.description
        });
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.costCategoryID - b.costCategoryID);
  };

  // ✅ ฟังก์ชันแก้ไข - ใช้ formatDisplayDate แทน formatDateTime
  const getFormattedUpdateInfo = (item) => {
    const updateDate = item.updateDate || item.createDate;
    const updateTime = item.updateTime || item.createTime;

    if (!updateDate) return { date: '-', time: '', isUpdated: false };

    // ✅ ใช้ formatDisplayDate จาก service
    const formattedDate = formatDisplayDate(updateDate);

    const formattedTime = updateTime ?
      new Date(`1970-01-01T${updateTime}`).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      }) : '';

    const isUpdated = item.updateDate && item.updateDate !== item.createDate;

    return { date: formattedDate, time: formattedTime, isUpdated };
  };

  // ✅ เพิ่มฟังก์ชัน handleConfirm สำหรับ refresh ข้อมูล
  const handleConfirm = () => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let res;

        if (filterMode === 'month') {
          res = await api.post("/cost/GetAllCostList", {
            IsPurchase: true,
            Month: selectedMonth + 1,
            Year: selectedYear
          });
        } else {
          res = await api.post("/cost/GetAllCostList", {
            IsPurchase: true,
            Year: selectedYear
          });
        }

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
  };

  // ✅ เพิ่มฟังก์ชัน showToast
  const showToast = (message, type = "success") => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // ดึงข้อมูลจาก API เมื่อ component mount หรือเมื่อ filter เปลี่ยน
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let res;

        if (filterMode === 'month') {
          res = await api.post("/cost/GetAllCostList", {
            IsPurchase: true,
            Month: selectedMonth + 1,
            Year: selectedYear
          });
        } else {
          res = await api.post("/cost/GetAllCostList", {
            IsPurchase: true,
            Year: selectedYear
          });
        }

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
  }, [refreshKey, selectedMonth, selectedYear, filterMode]);

  // ✅ ใช้ getFilteredAndSortedData แทน getSortedData
  const filteredData = getFilteredAndSortedData(data);
  // ✅ ดึง unique categories จากข้อมูลต้นฉบับ
  const availableCategories = getUniqueCategories(data);

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
        <span className="loading loading-dots loading-md text-primary"></span>
        <span className="text-sm md:text-base text-base-content/80 font-medium">กำลังโหลดข้อมูล...</span>
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
              {Array.from({ length: 7 }, (_, i) => getCurrentYear() - 5 + i)
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
                0 รายการ
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
              <div className="text-base font-semibold text-base-content">
                {selectedCategory ? 'ไม่มีรายการในหมวดหมู่ที่เลือก' : 'ไม่มีรายการในช่วงเวลาที่เลือก'}
              </div>
              <div className="text-sm text-base-content/60">
                {selectedCategory ? 'ลองเลือกหมวดหมู่อื่นหรือช่วงเวลาอื่น' : 'ลองเลือกช่วงเวลาอื่น'}
              </div>
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
            {Array.from({ length: 7 }, (_, i) => getCurrentYear() - 5 + i)
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

      {/* Summary Cards - ✅ แสดงข้อมูลที่กรองแล้ว */}
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

        {/* Category Breakdown Cards - ✅ ใช้ข้อมูลที่กรองแล้ว */}
        {(() => {
          const categoryStats = filteredData.reduce((acc, item) => {
            const categoryID = item.costCategoryID;
            const categoryName = item.costCategory?.description || 'อื่นๆ';

            if (!acc[categoryID]) {
              acc[categoryID] = {
                name: categoryName,
                total: 0,
                count: 0
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
            <div key={categoryID} className="stat bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-3 shadow-sm">
              <div className="stat-figure text-accent opacity-20">
                <span className="text-2xl">
                  {categoryID === '1' ? '🛒' : categoryID === '2' ? '🏠' : categoryID === '3' ? '⚡' : '📦'}
                </span>
              </div>
              <div className="stat-title text-xs text-accent/70 truncate" title={stats.name}>
                {stats.name}
              </div>
              <div className="stat-value text-base md:text-lg font-bold text-accent">
                {stats.total.toLocaleString()}
              </div>
              <div className="stat-desc text-xs text-accent/60">
                {stats.count} รายการ
              </div>
            </div>
          ));
        })()}
      </div>

      {/* สรุปตามหมวดหมู่ - ✅ ใช้ข้อมูลที่กรองแล้ว */}
      {filteredData.length > 0 && (
        <div className="bg-base-100 rounded-lg border border-base-300 p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
              <span>📈</span>
              <span>สรุปตามหมวดหมู่</span>
              {selectedCategory && (
                <span className="badge badge-sm badge-primary">
                  {availableCategories.find(cat => cat.costCategoryID === parseInt(selectedCategory))?.description}
                </span>
              )}
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
                    count: 0
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

      {/* ✅ Desktop Sort Controls - เพิ่ม Category Dropdown */}
      <div className="hidden md:flex items-center justify-between bg-base-200/50 rounded-lg p-3 border border-base-300 mb-3">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <span className="badge badge-sm badge-outline">
            {filteredData.length} รายการ
          </span>
        </div>

        {/* ✅ เพิ่ม Category Filter Dropdown ระหว่าง รายการ และ เรียงตาม */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/60 font-medium">หมวดหมู่:</span>
          <select
            className="select select-sm select-bordered"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">ทั้งหมด</option>
            {availableCategories.map((category) => (
              <option key={category.costCategoryID} value={category.costCategoryID}>
                {category.description}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/60 font-medium">เรียงตาม:</span>
          <div className="join">
            <button
              className={`btn btn-sm join-item ${
                sortBy === 'costDate'
                  ? 'btn-primary'
                  : 'btn-outline btn-primary'
              }`}
              onClick={() => toggleSort('costDate')}
            >
              📅 วันที่ค่าใช้จ่าย
              {sortBy === 'costDate' && (
                <span className="ml-1">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
            <button
              className={`btn btn-sm join-item ${
                sortBy === 'lastModified'
                  ? 'btn-secondary'
                  : 'btn-outline btn-secondary'
              }`}
              onClick={() => toggleSort('lastModified')}
            >
              ✏️ วันเวลาแก้ไข
              {sortBy === 'lastModified' && (
                <span className="ml-1">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Table View (≥768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th className="text-sm lg:text-base">📅 วันที่</th>
              <th className="text-sm lg:text-base">🏷️ หมวดหมู่</th>
              <th className="text-right text-sm lg:text-base">💰 ราคา</th>
              <th className="text-sm lg:text-base">📝 รายละเอียดการซื้อ</th>
              <th className="text-sm lg:text-base">⏰ วันเวลาแก้ไข</th>
              <th className="text-sm lg:text-base">✏️ แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => {
              const { date: lastModifiedDate, time: lastModifiedTime, isUpdated } = getFormattedUpdateInfo(item);

              return (
                <tr key={`desktop-${item.costID || item.id || idx}`} className="hover:bg-base-200">
                  <td className="text-sm lg:text-base">{formatDisplayDate(item.costDate)}</td>
                  <td className="text-sm lg:text-base">
                    <span className={`badge badge-sm shadow-sm whitespace-nowrap ${
                      item.costCategoryID === 1 ? 'badge-primary' :
                      item.costCategoryID === 2 ? 'badge-secondary' :
                      item.costCategoryID === 3 ? 'badge-accent' :
                      item.costCategoryID === 4 ? 'badge-info' :
                      item.costCategoryID === 5 ? 'badge-warning' :
                      item.costCategoryID === 6 ? 'badge-error' :
                      'badge-neutral'
                    }`}>
                      {item.costCategory.description}
                    </span>
                  </td>
                  <td className="text-right font-medium text-sm lg:text-base">{item.costPrice.toLocaleString()} บาท</td>
                  <td className="text-sm lg:text-base max-w-xs truncate" title={item.costDescription}>{item.costDescription}</td>
                  <td className="text-sm lg:text-base">
                    {lastModifiedDate !== '-' ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          {isUpdated && <span className="text-xs text-warning">✏️</span>}
                          <span className="text-xs font-medium">{lastModifiedDate}</span>
                        </div>
                        {lastModifiedTime && (
                          <span className="text-xs text-base-content/60">{lastModifiedTime}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-base-content/40">-</span>
                    )}
                  </td>
                  <td>
                    <ModalConfirmPayment
                      key={`modal-${item.costID || item.id || idx}-${selectedCategory}-${refreshKey}`}
                      onConfirm={handleConfirm}
                      item={item}
                      showToast={showToast}
                      buttonText="แก้ไข"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (<768px) */}
      <div className="md:hidden space-y-2">
        {/* ✅ Mobile Header with Category and Sort Controls - ปรับปรุงให้ไม่ล้น */}
        <div className="bg-base-200/50 rounded-lg p-2 border border-base-300 space-y-2">
          {/* Row 1: จำนวนรายการ และ หมวดหมู่ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <span className="badge badge-xs badge-outline">
                {filteredData.length} รายการ
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-base-content/60 whitespace-nowrap">หมวดหมู่:</span>
              <select
                className="select select-xs select-bordered min-w-0 max-w-24"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">ทั้งหมด</option>
                {availableCategories.map((category) => (
                  <option key={category.costCategoryID} value={category.costCategoryID}>
                    {category.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: เรียงตาม */}
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-base-content/60 whitespace-nowrap">เรียงตาม:</span>
            <div className="join">
              <button
                className={`btn btn-xs join-item ${
                  sortBy === 'costDate'
                    ? 'btn-primary'
                    : 'btn-outline btn-primary'
                }`}
                onClick={() => toggleSort('costDate')}
              >
                📅 วันที่
                {sortBy === 'costDate' && (
                  <span className="ml-1">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
              <button
                className={`btn btn-xs join-item ${
                  sortBy === 'lastModified'
                    ? 'btn-secondary'
                    : 'btn-outline btn-secondary'
                }`}
                onClick={() => toggleSort('lastModified')}
              >
                ✏️ แก้ไข
                {sortBy === 'lastModified' && (
                  <span className="ml-1">
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {filteredData.map((item, idx) => {
          const { date: lastModifiedDate, time: lastModifiedTime, isUpdated } = getFormattedUpdateInfo(item);

          return (
            <div key={`mobile-${item.costID || item.id || idx}`} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-success/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Compact Header Row */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-base-200/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-base-content/60">📅</span>
                    <span className="text-sm font-medium">{formatDisplayDate(item.costDate)}</span>
                  </div>
                  <span className={`badge badge-sm shadow-sm whitespace-nowrap ${
                    item.costCategoryID === 1 ? 'badge-primary' :
                    item.costCategoryID === 2 ? 'badge-secondary' :
                    item.costCategoryID === 3 ? 'badge-accent' :
                    item.costCategoryID === 4 ? 'badge-info' :
                    item.costCategoryID === 5 ? 'badge-warning' :
                    item.costCategoryID === 6 ? 'badge-error' :
                    'badge-neutral'
                  }`}>
                    {item.costCategory.description}
                  </span>
                </div>
                <div className="bg-success/10 rounded-lg px-2 py-1">
                  <span className="font-bold text-sm text-success">{item.costPrice.toLocaleString()} บาท</span>
                </div>
              </div>

              {/* Description Row */}
              <div className="text-xs text-base-content/80 bg-base-200/30 rounded px-2 py-1 break-words mb-2" title={item.costDescription}>
                💬 {item.costDescription}
              </div>

              {/* Last Modified Row */}
              {lastModifiedDate !== '-' && (
                <div className={`flex items-center justify-between rounded px-2 py-1 mb-2 ${
                  sortBy === 'lastModified'
                    ? 'bg-secondary/10 border border-secondary/20'
                    : 'bg-base-100/50'
                }`}>
                  <div className="flex items-center gap-1 text-xs text-base-content/60">
                    {isUpdated ? (
                      <>
                        <span>✏️</span>
                        <span>แก้ไขล่าสุด:</span>
                      </>
                    ) : (
                      <>
                        <span>📝</span>
                        <span>สร้างเมื่อ:</span>
                      </>
                    )}
                    <span>{lastModifiedDate} {lastModifiedTime}</span>
                  </div>
                  <div className="text-right">
                    <ModalConfirmPayment
                      key={`mobile-modal-${item.costID || item.id || idx}-${selectedCategory}-${refreshKey}`}
                      onConfirm={handleConfirm}
                      item={item}
                      showToast={showToast}
                      buttonText="แก้ไข"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
