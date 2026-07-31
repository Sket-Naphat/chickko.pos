import { useState, useEffect, useMemo } from "react";
import ModalConfirmPayment from "./ModalConfirmPayment";     // ใช้ในโหมด "แก้ไข" ต่อรายการที่จ่ายแล้ว (buttonText="แก้ไข")
import LoadingState from "../common/LoadingState";
import { getCostList } from "../../services/costService";    // ดึงรายการจาก backend ผ่าน service layer เท่านั้น
import { formatDisplayDateLong, formatDisplayTime } from "../../lib/dateUtils"; // format วันที่/เวลาแบบไทย
import { formatCurrency } from "../../lib/formatUtils";       // format ราคาให้มี comma คั่นหลักพัน
import { getCostCategoryBadgeClass } from "./utils/costBadge"; // แปลง costCategoryID → สี badge

// รายชื่อเดือนภาษาไทย ใช้เติม <option> ของ dropdown เลือกเดือน — index ตรงกับ Date.getMonth() (0 = มกราคม)
const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const getCurrentMonth = () => new Date().getMonth();   // ใช้ตั้งค่าเริ่มต้นของตัวกรองเดือนเป็นเดือนปัจจุบัน
const getCurrentYear = () => new Date().getFullYear();  // ใช้ตั้งค่าเริ่มต้นของตัวกรองปีเป็นปีปัจจุบัน

// ไอคอนสรุปตามหมวดหมู่ (ใช้เฉพาะในการ์ดสรุป/รายการสรุปของไฟล์นี้)
// categoryID ที่รับเข้ามาเป็น string เสมอ (มาจาก Object.entries ของ categoryStats ซึ่ง key เป็น string โดยธรรมชาติของ JS object)
const getCategoryEmoji = (categoryID) =>
  categoryID === '1' ? '🛒' : categoryID === '2' ? '🏠' : categoryID === '3' ? '⚡' : '📦'; // หมวดอื่นนอกจาก 1-3 ใช้ไอคอนกล่องพัสดุแทน

/**
 * แสดงรายการค่าใช้จ่ายที่ชำระเงินแล้ว พร้อมตัวกรองเดือน/ปี, สรุปยอดตามหมวดหมู่ และการเรียงลำดับ
 *
 * Props:
 * - refreshKey: จาก Cost.jsx เปลี่ยนค่าทุกครั้งที่ต้อง fetch ใหม่ (เช่น เพิ่งเพิ่ม/ลบรายการจากฝั่งอื่น)
 * - showToast: ฟังก์ชันโชว์ toast กลาง ส่งต่อให้ ModalConfirmPayment ใช้ตอนแก้ไข/ลบรายการ
 */
export default function PaidCostList({ refreshKey, showToast }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);                          // ข้อมูลดิบทั้งหมดที่ backend ส่งมา (ตาม filter เดือน/ปีที่เลือกไว้)
  const [loading, setLoading] = useState(true);                  // true ระหว่างรอ fetch
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth()); // เดือนที่เลือกกรอง (ใช้เมื่อ filterMode === 'month')
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());   // ปีที่เลือกกรอง (ใช้เสมอไม่ว่า filterMode ไหน)
  const [filterMode, setFilterMode] = useState('month'); // 'month' หรือ 'year' — สลับว่าจะกรองแบบรายเดือนหรือทั้งปี
  // ✅ เพิ่ม state สำหรับ sorting
  const [sortBy, setSortBy] = useState('costDate'); // 'costDate' หรือ 'lastModified' — คอลัมน์ที่ใช้เรียงลำดับ
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' หรือ 'desc' — ทิศทางการเรียง
  // ✅ เพิ่ม state สำหรับ category filter
  const [selectedCategory, setSelectedCategory] = useState(''); // category filter — '' หมายถึงไม่กรอง (โชว์ทุกหมวด)

  // Handler functions
  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value)); // value จาก <select> เป็น string เสมอ ต้องแปลงเป็นตัวเลขก่อนเก็บ state
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  // ✅ เพิ่ม handler สำหรับ category filter
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value); // เก็บเป็น string ตรงๆ (costCategoryID ที่เลือก หรือ '' ถ้าเลือก "ทั้งหมด")
  };

  // ✅ ฟังก์ชัน toggle sort
  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      // กดปุ่มคอลัมน์เดิมซ้ำ → แค่สลับทิศทางการเรียง (desc ↔ asc)
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // เปลี่ยนไปเรียงคอลัมน์ใหม่ → ตั้งเป็น desc เป็นค่าเริ่มต้นเสมอ
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // ✅ ฟังก์ชันสำหรับ filter และ sort ข้อมูล
  // รับ data ดิบ → กรองตามหมวดหมู่ที่เลือก (ถ้ามี) → เรียงลำดับตาม sortBy/sortOrder แล้วคืน array ใหม่ (ไม่แก้ array เดิม)
  const getFilteredAndSortedData = (data) => {
    // Filter by category first
    let filtered = data;
    if (selectedCategory && selectedCategory !== '') {
      filtered = data.filter(item => String(item.costCategoryID) === String(selectedCategory)); // แปลงเป็น string ทั้งคู่กันพลาดเรื่อง type ไม่ตรงกัน
    }

    // Then sort the filtered data
    return [...filtered].sort((a, b) => { // spread ก่อน sort กัน mutate array ที่ filter ได้มา (แม้จะเป็น array ใหม่แล้วก็ตาม เป็นนิสัยที่ปลอดภัย)
      let aValue, bValue;

      if (sortBy === 'costDate') {
        aValue = new Date(a.costDate); // แปลงเป็น Date object เพื่อเทียบค่าได้ตรงๆ ด้วยการลบกัน
        bValue = new Date(b.costDate);
      } else { // lastModified
        // ถ้าไม่เคยแก้ไข (ไม่มี updateDate) ให้ใช้วันที่สร้างแทน
        const aUpdateDate = a.updateDate || a.createDate;
        const bUpdateDate = b.updateDate || b.createDate;
        aValue = aUpdateDate ? new Date(aUpdateDate) : new Date(0); // ไม่มีวันที่เลย → ใช้ epoch (เก่าสุด) กันพัง
        bValue = bUpdateDate ? new Date(bUpdateDate) : new Date(0);
      }

      if (sortOrder === 'desc') {
        return bValue - aValue; // Date ลบกันได้ผลเป็นตัวเลข (ms) ใช้เป็นผลลัพธ์ของ .sort() ได้ตรงๆ
      } else {
        return aValue - bValue;
      }
    });
  };

  // ✅ ฟังก์ชันสำหรับดึง unique categories จากข้อมูล
  // ไล่ดูข้อมูลทั้งหมด (ไม่ใช่แค่ที่กรองแล้ว) เก็บหมวดหมู่ที่ปรากฏจริงแบบไม่ซ้ำ ไว้เติม dropdown "หมวดหมู่"
  const getUniqueCategories = (data) => {
    if (!data || !Array.isArray(data)) return []; // กันกรณี data ยังไม่มา/ไม่ใช่ array

    const categoryMap = new Map(); // ใช้ Map เพื่อ dedupe ตาม costCategoryID (key) อัตโนมัติ
    data.forEach(item => {
      if (item?.costCategory && item?.costCategoryID) {
        categoryMap.set(item.costCategoryID, {
          costCategoryID: item.costCategoryID,
          description: item.costCategory.description
        }); // set ซ้ำ key เดิมจะทับค่าเก่า ผลคือเหลือ 1 รายการต่อหมวดหมู่
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.costCategoryID - b.costCategoryID); // แปลงกลับเป็น array แล้วเรียงตาม ID น้อย→มาก
  };

  // แปลงข้อมูล "วันเวลาที่แก้ไขล่าสุด" ของรายการหนึ่งให้พร้อมแสดงผล (ใช้ทั้งตาราง desktop และการ์ด mobile)
  const getFormattedUpdateInfo = (item) => {
    const updateDate = item.updateDate || item.createDate; // ถ้าไม่เคยแก้ไข ใช้วันที่สร้างแทน
    const updateTime = item.updateTime || item.createTime;

    if (!updateDate) return { date: '-', time: '', isUpdated: false }; // ไม่มีข้อมูลวันที่เลย → โชว์ขีดกลาง

    const formattedDate = formatDisplayDateLong(updateDate); // แปลงเป็น "วันเสาร์ ที่ 01 ตุลาคม" ผ่าน lib กลาง

    const formattedTime = updateTime ?
      new Date(`1970-01-01T${updateTime}`).toLocaleTimeString('th-TH', { // ใช้วันที่ปลอมๆ (1970-01-01) แค่ต้องการแปลง "เวลา" อย่างเดียวผ่าน Date API
        hour: '2-digit',
        minute: '2-digit'
      }) : '';

    const isUpdated = item.updateDate && item.updateDate !== item.createDate; // true เฉพาะถ้าเคยถูกแก้ไขจริง (updateDate มีค่าและต่างจาก createDate)

    return { date: formattedDate, time: formattedTime, isUpdated };
  };

  // ฟังก์ชันกลางที่ยิง API จริง — ใช้ทั้งตอน mount/filter เปลี่ยน (ผ่าน useEffect) และตอนกด "บันทึก"/"ลบ" ใน ModalConfirmPayment (ผ่าน handleConfirm)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 👉 ส่ง field ให้ครบตาม type ฝั่ง backend (int?/bool?/DateOnly?) แทนการละ field ที่ไม่ใช้
      const items = await getCostList({
        CostCategoryID: null,   // ไม่กรองหมวดหมู่ที่ backend (กรองฝั่ง frontend เองใน getFilteredAndSortedData แทน)
        CostStatusID: null,
        EndDate: null,
        IsActive: true,
        IsPurchase: true,       // ขอเฉพาะรายการที่ "จ่ายแล้ว" เท่านั้น (ตรงข้ามกับ UnpaidCostList ที่ส่ง false)
        IsStockIn: null,
        Month: filterMode === 'month' ? selectedMonth + 1 : null, // backend นับเดือน 1-12, selectedMonth เป็น 0-11 (จาก Date.getMonth()) จึง +1
        Year: selectedYear
      });
      setData(items);
    } catch (err) {
      setData([]); // fetch พังก็เคลียร์ data ทิ้ง กันโชว์ข้อมูลเก่าค้าง
      console.error("โหลดรายการค่าใช้จ่ายไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ เพิ่มฟังก์ชัน handleConfirm สำหรับ refresh ข้อมูล
  // ส่งเข้า ModalConfirmPayment เป็น prop onConfirm — เรียกเมื่อแก้ไข/ลบรายการสำเร็จ เพื่อดึงข้อมูลใหม่มาแสดง (ไม่ต้องรีเฟรชทั้งหน้า)
  const handleConfirm = () => {
    fetchData();
  };

  // ดึงข้อมูลจาก API เมื่อ component mount หรือเมื่อ filter เปลี่ยน
  useEffect(() => {
    fetchData(); // fetch ใหม่ทุกครั้งที่ dependency ด้านล่างเปลี่ยนค่า (mount ครั้งแรก, เปลี่ยนเดือน/ปี/โหมดกรอง, หรือ refreshKey จาก parent เปลี่ยน)
    // หมายเหตุ: ตั้งใจไม่ใส่ fetchData ใน dependency array เพราะมันถูกสร้างใหม่ทุก render (ไม่ได้ห่อ useCallback)
    // ถ้าใส่ไปจะทำให้ effect รันทุก render โดยไม่จำเป็น — ค่าที่ fetchData ใช้จริง (filterMode/selectedMonth/selectedYear) อยู่ใน deps แล้วครบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, selectedMonth, selectedYear, filterMode]);

  // ✅ ใช้ getFilteredAndSortedData แทน getSortedData
  const filteredData = getFilteredAndSortedData(data); // คำนวณใหม่ทุก render จาก data + selectedCategory/sortBy/sortOrder ปัจจุบัน (เบา ไม่ต้อง useMemo)
  // ✅ ดึง unique categories จากข้อมูลต้นฉบับ
  const availableCategories = getUniqueCategories(data); // ใช้ data ดิบ (ไม่ใช่ filteredData) เพื่อให้ dropdown หมวดหมู่โชว์ตัวเลือกครบ ไม่หายไปตามการกรอง

  // ✅ สรุปยอดตามหมวดหมู่ — คำนวณครั้งเดียว ใช้ทั้งการ์ดสรุป top-2 และรายการสรุปเต็ม (เดิมคำนวณซ้ำ 2 รอบ)
  // useMemo กันคำนวณซ้ำถ้า filteredData reference เดิม (แม้ component จะ re-render จากเหตุผลอื่น เช่น sortBy เปลี่ยนแต่ category คงเดิม ก็ยังคำนวณใหม่เพราะ filteredData เป็น object ใหม่ทุก render อยู่ดี — ประโยชน์หลักคือลดจำนวนจุดคำนวณจาก 2 เหลือ 1)
  const categoryStats = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      const categoryID = item.costCategoryID;
      const categoryName = item.costCategory?.description || 'อื่นๆ';

      if (!acc[categoryID]) {
        acc[categoryID] = {
          name: categoryName,
          total: 0,
          count: 0
        }; // เจอหมวดหมู่นี้ครั้งแรก → สร้าง record เริ่มต้น
      }
      acc[categoryID].total += item.costPrice; // สะสมยอดรวม
      acc[categoryID].count += 1;              // นับจำนวนรายการ
      return acc;
    }, {}); // ผลลัพธ์เป็น object รูปแบบ { [categoryID]: { name, total, count } }
  }, [filteredData]); // คำนวณใหม่เฉพาะตอน filteredData เปลี่ยน (ก็คือทุก render อยู่ดีเพราะ getFilteredAndSortedData คืน array ใหม่เสมอ)

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return <LoadingState />; // ยังไม่มีข้อมูล ไม่ render ส่วนอื่นเลย จบฟังก์ชันตรงนี้
  }

  // กรณีกรองแล้วไม่มีข้อมูล
  // หมายเหตุ: บล็อกนี้กับบล็อก return หลักด้านล่าง มี "Filter Controls" (dropdown เดือน/ปี) ซ้ำกันโดยตั้งใจ
  // เพราะแม้ผลกรองจะว่างเปล่า ผู้ใช้ก็ยังต้องเปลี่ยนตัวกรองเพื่อลองช่วงเวลา/หมวดหมู่อื่นได้ต่อ
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
              disabled={filterMode === 'year'} // โหมดรายปี ไม่ต้องเลือกเดือน จึงปิดไว้
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
              {/* สร้างตัวเลือกปีย้อนหลัง 5 ปีถึงอนาคต 1 ปี (รวม 7 ปี) เรียงมากไปน้อย */}
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
                onChange={() => setFilterMode(filterMode === 'month' ? 'year' : 'month')} // toggle สลับโหมดกรอง
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
                {/* ข้อความต่างกันตามว่าผู้ใช้กำลังกรองหมวดหมู่อยู่ด้วยหรือไม่ ช่วยแนะนำว่าจะลองล้างตัวกรองไหน */}
                {selectedCategory ? 'ไม่มีรายการในหมวดหมู่อื่นหรือช่วงเวลาอื่น' : 'ไม่มีรายการในช่วงเวลาอื่น'}
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
  // ต่อจากนี้คือ "มีข้อมูลแน่นอน" (ผ่าน loading และ empty state มาแล้ว)
  return (
    <>
      {/* Compact Filter Controls (เหมือนกับ empty state ด้านบนทุกอย่าง) */}
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
        {/* Total Amount Card: รวมราคาทุกรายการที่กรองแล้ว */}
        <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 shadow-sm">
          <div className="stat-figure text-primary opacity-20">
            <span className="text-2xl">💰</span>
          </div>
          <div className="stat-title text-xs text-primary/70">ค่าใช้จ่ายรวม</div>
          <div className="stat-value text-base md:text-lg font-bold text-primary">
            {formatCurrency(filteredData.reduce((acc, item) => acc + item.costPrice, 0))}
          </div>
          <div className="stat-desc text-xs text-primary/60">บาท</div>
        </div>

        {/* Total Items Card: จำนวนรายการที่กรองแล้ว */}
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

        {/* Category Breakdown Cards - ✅ ใช้ข้อมูลที่กรองแล้ว (top 2 จาก categoryStats) */}
        {/* เอา categoryStats (object) มาแปลงเป็น [id, stats] คู่ๆ, เรียงตามยอดรวมมาก→น้อย, ตัดเหลือ 2 อันดับแรก */}
        {Object.entries(categoryStats)
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, 2)
          .map(([categoryID, stats]) => (
            <div key={categoryID} className="stat bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-3 shadow-sm">
              <div className="stat-figure text-accent opacity-20">
                <span className="text-2xl">{getCategoryEmoji(categoryID)}</span>
              </div>
              <div className="stat-title text-xs text-accent/70 truncate" title={stats.name}>
                {stats.name}
              </div>
              <div className="stat-value text-base md:text-lg font-bold text-accent">
                {formatCurrency(stats.total)}
              </div>
              <div className="stat-desc text-xs text-accent/60">
                {stats.count} รายการ
              </div>
            </div>
          ))}
      </div>

      {/* สรุปตามหมวดหมู่ - ✅ ใช้ข้อมูลที่กรองแล้ว (รายการสรุปเต็ม ต่างจากการ์ดด้านบนตรงที่โชว์ครบทุกหมวด ไม่ตัดแค่ top 2) */}
      {filteredData.length > 0 && (
        <div className="bg-base-100 rounded-lg border border-base-300 p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
              <span>📈</span>
              <span>สรุปตามหมวดหมู่</span>
              {selectedCategory && (
                // กำลังกรองหมวดหมู่เดียวอยู่ → โชว์ badge บอกชื่อหมวดที่กรอง (หา description จาก availableCategories ด้วย ID)
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
              // IIFE (immediately-invoked function) เพราะต้องคำนวณ totalAmount ก่อนแล้วค่อย map — ใช้ arrow function ธรรมดาไม่ได้ใน JSX โดยตรงถ้าต้องมี statement ก่อน return
              const totalAmount = filteredData.reduce((acc, item) => acc + item.costPrice, 0); // ผลรวมทั้งหมด ใช้เป็นตัวหารคำนวณ % ของแต่ละหมวด

              return Object.entries(categoryStats)
                .sort(([, a], [, b]) => b.total - a.total) // เรียงมาก→น้อยเหมือนการ์ดสรุปด้านบน แต่ครั้งนี้ไม่ตัด slice
                .map(([categoryID, stats]) => {
                  const percentage = totalAmount > 0 ? (stats.total / totalAmount * 100) : 0; // กันหารด้วย 0 ถ้า totalAmount เป็น 0

                  return (
                    <div key={categoryID} className="flex items-center justify-between p-2 bg-base-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">{getCategoryEmoji(categoryID)}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-base-content">{stats.name}</div>
                          <div className="text-xs text-base-content/60">{stats.count} รายการ</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-base-content">
                          {formatCurrency(stats.total)} บาท
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

      {/* ✅ Desktop Sort Controls - เพิ่ม Category Dropdown (ซ่อนบนมือถือ ใช้ hidden md:flex) */}
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
            {/* ปุ่มเรียงตามวันที่ค่าใช้จ่าย — ไฮไลต์ (btn-primary) เมื่อ sortBy ตรงกับปุ่มนี้ พร้อมลูกศรบอกทิศทาง */}
            <button
              className={`btn btn-sm join-item ${sortBy === 'costDate'
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
            {/* ปุ่มเรียงตามวันเวลาแก้ไขล่าสุด — logic เดียวกับปุ่มด้านบน แค่คนละคอลัมน์ */}
            <button
              className={`btn btn-sm join-item ${sortBy === 'lastModified'
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
              <th className="text-sm lg:text-base">💰 วิธีการชำระเงิน</th>
              <th className="text-sm lg:text-base">⏰ วันเวลาแก้ไข</th>
              <th className="text-sm lg:text-base">✏️ แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => {
              const { date: lastModifiedDate, time: lastModifiedTime, isUpdated } = getFormattedUpdateInfo(item); // คำนวณข้อมูลวันแก้ไขต่อแถว

              return (
                <tr key={`desktop-${item.costID || item.id || idx}`} className="hover:bg-base-200">
                  <td className="text-sm lg:text-base">{formatDisplayDateLong(item.costDate) + " , " + formatDisplayTime(item.costTime) + " น."}</td>
                  <td className="text-sm lg:text-base">
                    <span className={`badge badge-sm shadow-sm whitespace-nowrap ${getCostCategoryBadgeClass(item.costCategoryID)}`}>
                      {item.costCategory.description}
                    </span>
                  </td>
                  <td className="text-right font-medium text-sm lg:text-base">{formatCurrency(item.costPrice)} บาท</td>
                  <td className="text-sm lg:text-base max-w-xs truncate" title={item.costDescription}>{item.costDescription}</td>
                  <td className="text-sm lg:text-base max-w-xs truncate">{item.costPurchaseType.description}</td>
                  <td className="text-sm lg:text-base">
                    {lastModifiedDate !== '-' ? (
                      // มีข้อมูลวันแก้ไข → โชว์วันที่ (พร้อมไอคอนดินสอถ้าเคยแก้จริง) + เวลาถ้ามี
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
                      // ไม่มีข้อมูลวันแก้ไขเลย (getFormattedUpdateInfo คืน '-') → โชว์ขีดกลางจางๆ
                      <span className="text-base-content/40">-</span>
                    )}
                  </td>
                  <td>
                    {/* ปุ่ม/modal "แก้ไข" ต่อรายการ — key ใส่ selectedCategory/refreshKey ด้วยเพื่อบังคับให้ modal สร้าง instance ใหม่ (reset state ภายใน) เมื่อตัวกรอง/ข้อมูลเปลี่ยน ไม่งั้น React จะ reuse component เดิมแล้ว state ค้าง */}
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

      {/* Mobile Card View (<768px) — ข้อมูลชุดเดียวกับตาราง desktop แค่คนละ layout */}
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

          {/* Row 2: เรียงตาม (ปุ่มเล็กกว่าเวอร์ชัน desktop แต่ logic การ toggle เหมือนกัน) */}
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-base-content/60 whitespace-nowrap">เรียงตาม:</span>
            <div className="join">
              <button
                className={`btn btn-xs join-item ${sortBy === 'costDate'
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
                className={`btn btn-xs join-item ${sortBy === 'lastModified'
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
          const { date: lastModifiedDate, time: lastModifiedTime, isUpdated } = getFormattedUpdateInfo(item); // เหมือนฝั่ง desktop ทุกอย่าง

          return (
            <div key={`mobile-${item.costID || item.id || idx}`} className="bg-gradient-to-r from-base-100 to-base-50 border-2 border-base-300 hover:border-success/30 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
              {/* Compact Header */}
              <div className="flex gap-2 mb-2">
                {/* Left: วันที่ + หมวดหมู่+วิธีชำระ */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 bg-base-200/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-base-content/60">📅</span>
                    <span className="text-sm font-medium">{formatDisplayDateLong(item.costDate) + " , " + formatDisplayTime(item.costTime) + " น."}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-base-content/70 bg-base-200/50 rounded-lg px-2 py-1">
                      <span>{item.costPurchaseTypeID == 1 ? '💳' : '💵'}</span> {/* costPurchaseTypeID 1 = บัตร/โอน (ไอคอนบัตร), อื่นๆ = เงินสด */}
                      <span className="font-medium">{item.costPurchaseType?.description}</span>
                    </div>
                    <span className={`badge badge-sm shadow-sm whitespace-nowrap ${getCostCategoryBadgeClass(item.costCategoryID)}`}>
                      {item.costCategory.description}
                    </span>
                  </div>
                </div>
                {/* Right: ราคา span 2 rows */}
                <div className="flex items-center justify-center bg-success/10 border border-success/20 rounded-xl px-3">
                  <span className="font-bold text-base text-success whitespace-nowrap">{formatCurrency(item.costPrice)} ฿</span>
                </div>
              </div>

              {/* Payment + Description Row */}
              <div className="space-y-1 mb-2">
                <div className="flex items-start gap-1.5 bg-base-200/30 rounded-lg px-2 py-1">
                  <span className="text-sm shrink-0">💬</span>
                  <span className="text-xs text-base-content/75 break-words" title={item.costDescription}>{item.costDescription}</span>
                </div>
              </div>

              {/* Last Modified Row: โชว์เฉพาะถ้ามีข้อมูลวันแก้ไข (lastModifiedDate ไม่ใช่ '-') พร้อมปุ่มแก้ไขอยู่ในแถวเดียวกัน */}
              {lastModifiedDate !== '-' && (
                <div className={`flex items-center justify-between rounded px-2 py-1 mb-2 ${sortBy === 'lastModified'
                  ? 'bg-secondary/10 border border-secondary/20' // ถ้ากำลังเรียงตามคอลัมน์นี้อยู่ ไฮไลต์พื้นหลังให้เด่นขึ้น
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
