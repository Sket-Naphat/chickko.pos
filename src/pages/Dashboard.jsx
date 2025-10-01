import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import SummaryGraphCarousel from '../components/Dashboard/3SummaryGraph';
import DailySummary from '../components/Dashboard/DailySummary';
import MonthlySummary from '../components/Dashboard/MonthlySummary';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const getCurrentMonth = () => new Date().getMonth();
const getCurrentYear = () => new Date().getFullYear();

function Dashboard() {
  const [dineInSalesData, setDineInSalesData] = useState([]);
  const [deliverySalesData, setDeliverySalesData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [filterMode, setFilterMode] = useState('month'); // 'month' หรือ 'year'
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ✅ ดึงข้อมูลยอดขายรายวันตอนเปิดหน้า
  const fetchDailySalesReport = useCallback(async () => {
    try {
      setSalesLoading(true);

      // ✅ ดึงข้อมูลทั้งปีเท่านั้น ไม่แยกตามเดือน
      const params = {
        Year: selectedYear
      };

      const costParams = {
        IsPurchase: true,
        Year: selectedYear
      };

      const dineIn_response = await api.post("/orders/GetDailyDineInSalesReport", params);
      setDineInSalesData(dineIn_response.data.data || []);

      const delivery_response = await api.post("/orders/GetDailyDeliverySalesReport", params);
      setDeliverySalesData(delivery_response.data.data || []);

      const cost_response = await api.post("/cost/GetCostListReport", costParams);
      setCostData(cost_response.data || []);

    } catch (error) {
      console.error("Error fetching sales report:", error);
      alert(
        "เกิดข้อผิดพลาดในการดึงข้อมูลยอดขาย: " +
        (error.message || "ไม่ทราบสาเหตุ")
      );
    } finally {
      setSalesLoading(false);
    }
  }, [selectedYear]); // ✅ เหลือแค่ selectedYear ใน dependencies

  // ✅ ตอนนี้ useEffect จะไม่มี warning แล้ว
  useEffect(() => {
    fetchDailySalesReport();
  }, [fetchDailySalesReport]);

  // ✅ ฟังก์ชันจัดรูปแบบตัวเลข
  const formatNumber = (num) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value));
  };
  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  // กำหนดสีธีมจาก Tailwind CSS
  const themeColors = {
    success: 'oklch(20.8% 0.042 265.755)',
    base: 'rgba(245, 245, 245, 1)', // tailwind base-100
  };

  // กำหนด options ร่วมสำหรับกราฟทั้งหมด
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y} บาท` },
        backgroundColor: themeColors.base,
        titleColor: themeColors.success,
        bodyColor: themeColors.success,
        borderColor: themeColors.success,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: themeColors.success },
      },
      y: {
        grid: { display: false },
        beginAtZero: true,
        ticks: { color: themeColors.success },
      },
    },
  };
  // กราฟยอดขายหน้าร้าน
  const dineInData = {
    labels: months,
    datasets: [
      {
        label: "ยอดขายรายเดือน",
        data: months.map((_, monthIdx) =>
          dineInSalesData
            .filter(item => {
              const date = new Date(item.saleDate);
              return (
                date.getMonth() === monthIdx &&
                date.getFullYear() === selectedYear
              );
            })
            .reduce((sum, item) => sum + item.totalAmount, 0)
        ),
        backgroundColor: "oklch(60% 0.118 184.704)", // สีกราฟ
      },
    ],
  };

  // กราฟยอดขายเดลิเวอรี่
  const deliveryData = {
    labels: months,
    datasets: [
      {
        label: "ยอดขายเดลิเวอรี่รายเดือน",
        data: months.map((_, monthIdx) =>
          deliverySalesData
            .filter(item => {
              const date = new Date(item.saleDate);
              return (
                date.getMonth() === monthIdx &&
                date.getFullYear() === selectedYear
              );
            })
            .reduce((sum, item) => sum + item.totalAmount, 0)
        ),
        backgroundColor: "oklch(60% 0.118 265.755)", // สีกราฟเดลิเวอรี่
      },
    ],
  };
  // กราฟต้นทุน
  const costChartData = {
    labels: months,
    datasets: [
      {
        label: "ต้นทุนรายเดือน",
        data: months.map((_, monthIdx) =>
          costData
            .filter(item => {
              const date = new Date(item.costDate);
              return (
                date.getMonth() === monthIdx &&
                date.getFullYear() === selectedYear
              );
            })
            .reduce((sum, item) => sum + (item.totalAmount || 0), 0) // ✅ เปลี่ยนจาก costPrice เป็น totalAmount
        ),
        backgroundColor: "oklch(60% 0.118 30.755)",
      },
    ],
  };

  // ยอดขายหน้าร้าน
  const dineInTotal = filterMode === 'month'
    ? dineInSalesData
      .filter(item => {
        const date = new Date(item.saleDate);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      })
      .reduce((sum, item) => sum + item.totalAmount, 0)
    : dineInSalesData
      .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
      .reduce((sum, item) => sum + item.totalAmount, 0);
  // ยอดขายเดลิเวอรี่
  const deliveryTotal = filterMode === 'month'
    ? deliverySalesData
      .filter(item => {
        const date = new Date(item.saleDate);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      })
      .reduce((sum, item) => sum + item.totalAmount, 0)
    : deliverySalesData
      .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
      .reduce((sum, item) => sum + item.totalAmount, 0);
  // ยอดขายรวม
  const totalSales = dineInTotal + deliveryTotal;

  // ต้นทุน
  const costTotal = filterMode === 'month'
    ? costData
      .filter(item => {
        const date = new Date(item.costDate);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      })
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0) // ✅ เปลี่ยนจาก costPrice เป็น totalAmount
    : costData
      .filter(item => new Date(item.costDate).getFullYear() === selectedYear)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0); // ✅ เปลี่ยนจาก costPrice เป็น totalAmount

  // กำไรสุทธิ
  const netProfit = totalSales - costTotal;

  // เพิ่มฟังก์ชันสำหรับจัดรูปแบบวันที่
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `${dayNames[date.getDay()]}ที่ ${date.getDate()}`;
  };

  // เพิ่มการคำนวณข้อมูลรายวันสำหรับเดือนที่เลือก
  const getDailyData = () => {
    const dailyData = [];
    const year = selectedYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // หายอดขายหน้าร้าน
      const dineInData = dineInSalesData
        .filter(item => item.saleDate === dateStr);
      const dineInAmount = dineInData
        .reduce((sum, item) => sum + item.totalAmount, 0);

      // หายอดขายเดลิเวอรี่  
      const deliveryData = deliverySalesData
        .filter(item => item.saleDate === dateStr);
      const deliveryAmount = deliveryData
        .reduce((sum, item) => sum + item.totalAmount, 0);

      // หาต้นทุน
      const costAmount = costData
        .filter(item => item.costDate === dateStr)
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      // หา TopSellingItems จาก dineInSalesData (ใช้ข้อมูลจาก dineIn เป็นหลัก)
      const topItems = dineInData
        .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
        .sort((a, b) => (b.quantitySold || b.QuantitySold) - (a.quantitySold || a.QuantitySold));

      // รวมจำนวนออเดอร์จาก orders field
      const dineInOrders = dineInData
        .reduce((sum, item) => sum + (item.orders || 0), 0);
      const deliveryOrders = deliveryData
        .reduce((sum, item) => sum + (item.orders || 0), 0);
      const totalOrders = dineInOrders + deliveryOrders;

      const totalAmount = dineInAmount + deliveryAmount;
      const profit = totalAmount - costAmount;

      // แสดงเฉพาะวันที่มีข้อมูล
      if (totalAmount > 0 || costAmount > 0) {
        dailyData.push({
          date: dateStr,
          day: day,
          dineIn: dineInAmount,
          delivery: deliveryAmount,
          total: totalAmount,
          cost: costAmount,
          profit: profit,
          topItems: topItems,
          dineInOrders: dineInOrders,
          deliveryOrders: deliveryOrders,
          totalOrders: totalOrders
        });
      }
    }

    return dailyData.sort((a, b) => b.day - a.day); // เรียงจากวันมากไปน้อย
  };

  // เพิ่มฟังก์ชันสำหรับคำนวณข้อมูลรายเดือนสำหรับปีที่เลือก (สำหรับโหมดรายปี)
  const getMonthlyData = () => {
    const monthlyData = [];
    const year = selectedYear;

    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      // หายอดขายหน้าร้าน
      const dineInAmount = dineInSalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getMonth() === monthIdx && date.getFullYear() === year;
        })
        .reduce((sum, item) => sum + item.totalAmount, 0);

      // หายอดขายเดลิเวอรี่
      const deliveryAmount = deliverySalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getMonth() === monthIdx && date.getFullYear() === year;
        })
        .reduce((sum, item) => sum + item.totalAmount, 0);

      // หาต้นทุน
      const costAmount = costData
        .filter(item => {
          const date = new Date(item.costDate);
          return date.getMonth() === monthIdx && date.getFullYear() === year;
        })
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      // หา TopSellingItems จาก dineInSalesData ของเดือนนั้น
      const monthTopItems = dineInSalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getMonth() === monthIdx && date.getFullYear() === year;
        })
        .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
        .reduce((acc, item) => {
          const key = item.menuName || item.MenuName;
          if (!acc[key]) {
            acc[key] = {
              menuName: key,
              quantitySold: 0,
              totalSales: 0
            };
          }
          acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
          acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
          return acc;
        }, {});

      const topItems = Object.values(monthTopItems)
        .sort((a, b) => b.quantitySold - a.quantitySold);

      const totalAmount = dineInAmount + deliveryAmount;
      const profit = totalAmount - costAmount;

      // แสดงเฉพาะเดือนที่มีข้อมูล
      if (totalAmount > 0 || costAmount > 0) {
        monthlyData.push({
          month: monthIdx,
          monthName: months[monthIdx],
          dineIn: dineInAmount,
          delivery: deliveryAmount,
          total: totalAmount,
          cost: costAmount,
          profit: profit,
          topItems: topItems
        });
      }
    }

    return monthlyData.sort((a, b) => b.month - a.month); // เรียงจากเดือนมากไปน้อย
  };

  // ✅ เพิ่ม useEffect สำหรับตรวจสอบการ scroll
  useEffect(() => {
    const handleScroll = () => {
      // แสดงปุ่มเมื่อ scroll ลงมาเกิน 300px
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ ฟังก์ชันสำหรับเลื่อนขึ้นด้านบน
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="p-2 md:p-4 space-y-4 md:space-y-6">
      {/* ✅ ลบส่วน header ที่มีปุ่ม "ดึงข้อมูลจาก Firestore" */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">สรุปผลประกอบการ</h1>
      </div>

      {/* Card ฟิลเตอร์เดือน/ปี */}
      <div className="bg-base-100 rounded-xl shadow p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="form-control">
            <label className="label mb-1">
              <span className="label-text font-medium text-sm">เดือน</span>
            </label>
            <select
              className="select select-bordered w-full sm:w-auto"
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
          </div>
          <div className="form-control">
            <label className="label mb-1">
              <span className="label-text font-medium text-sm">ปี</span>
            </label>
            <select
              className="select select-bordered w-full sm:w-auto"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {/* ✅ ใช้ Array.from เพื่อสร้างช่วงปีที่ยืดหยุ่น */}
              {Array.from({ length: 7 }, (_, i) => getCurrentYear() - 5 + i)
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-control flex-row items-center gap-2 mt-2 sm:mt-0">
            <label className="flex cursor-pointer gap-2 items-center">
              <span className="label-text">รายเดือน</span>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={filterMode === 'year'}
                onChange={() => setFilterMode(filterMode === 'month' ? 'year' : 'month')}
              />
              <span className="label-text">รายปี</span>
            </label>
          </div>
        </div>
        <div className="mt-2 text-center sm:mt-0">
          <div className="badge badge-outline">
            {filterMode === 'month'
              ? `แสดงข้อมูล: ${months[selectedMonth]} ${selectedYear}`
              : `แสดงข้อมูล: ปี ${selectedYear}`}
          </div>
          <div className="mt-2 text-lg font-semibold">
          </div>
        </div>
      </div>

      {/* Card สรุปผล - ✅ รวมสถิติทั้งหมด */}
      <div className="bg-base-100 rounded-xl shadow p-4 mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">📊 สรุปผลประกอบการ</h2>
          <div className="mt-2">
            <div className="badge badge-outline">
              {filterMode === 'month'
                ? `${months[selectedMonth]} ${selectedYear}`
                : `ปี ${selectedYear}`}
            </div>
          </div>
        </div>

        {/* Main Summary Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* ยอดขายหน้าร้าน */}
          <div className="bg-gradient-to-br from-info/10 to-info/5 rounded-xl shadow-sm p-3 sm:p-4 border border-info/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-info/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-info">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-xs text-info/70">🏪</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-info/80">ยอดขายหน้าร้าน</div>
              <div className="text-sm sm:text-lg font-bold text-info">{formatNumber(dineInTotal)}</div>
            </div>
          </div>

          {/* ยอดขายเดลิเวอรี่ */}
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl shadow-sm p-3 sm:p-4 border border-accent/20">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-xs text-accent/70">🛵</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-accent/80">ยอดขายเดลิเวอรี่</div>
              <div className="text-sm sm:text-lg font-bold text-accent">{formatNumber(deliveryTotal)}</div>
            </div>
          </div>

          {/* ยอดขายรวม */}
          <div className="bg-gradient-to-br from-primary/15 to-primary/8 rounded-xl shadow-sm p-3 sm:p-4 border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/25 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-xs text-primary/70">💰</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-primary/80">ยอดขายรวม</div>
              <div className="text-lg sm:text-xl font-bold text-primary">{formatNumber(totalSales)}</div>
            </div>
          </div>

          {/* จำนวนวันที่เปิดขาย */}
          <div className="bg-gradient-to-br from-warning/15 to-warning/8 rounded-xl shadow-sm p-3 sm:p-4 border border-warning/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-warning/25 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-warning">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-xs text-warning/70">🗓️</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-warning/80">วันที่เปิดขาย</div>
              <div className="text-lg sm:text-xl font-bold text-warning">{getDailyData().filter(day => day.total > 0).length} วัน</div>
            </div>
          </div>

          {/* ต้นทุน - ✅ เปลี่ยนเป็น Collapse */}
          <div className="col-span-2 bg-gradient-to-br from-error/15 to-error/8 rounded-xl shadow-sm border border-error/30">
            <details className="collapse">
              <summary className="collapse-title cursor-pointer p-3 sm:p-4 min-h-0 hover:bg-error/5 transition-colors rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-error/25 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-error">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-xs text-error/70">💸</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm font-medium text-error/80">ต้นทุนรวม</div>
                    <div className="text-xs text-error/60 bg-error/10 px-2 py-1 rounded-full">
                      คลิกเพื่อดูรายละเอียด
                    </div>
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-error">{formatNumber(costTotal)}</div>
                  {totalSales > 0 && (
                    <div className="text-xs text-error/70">
                      {((costTotal / totalSales) * 100).toFixed(1)}% จากยอดขาย
                    </div>
                  )}
                </div>
              </summary>

              <div className="collapse-content px-3 sm:px-4 pb-3 sm:pb-4">
                {(() => {
                  // กรองข้อมูลต้นทุนตามโหมดที่เลือก
                  const currentCosts = costData.filter(item => {
                    const date = new Date(item.costDate);
                    if (filterMode === 'month') {
                      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                    } else {
                      return date.getFullYear() === selectedYear;
                    }
                  });

                  if (currentCosts.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm text-error/60">ไม่มีข้อมูลต้นทุน</div>
                      </div>
                    );
                  }

                  // คำนวณยอดรวมแต่ละประเภทต้นทุน
                  const totalRawMaterial = currentCosts.reduce((sum, cost) => sum + (cost.totalRawMaterialCost || 0), 0);
                  const totalStaff = currentCosts.reduce((sum, cost) => sum + (cost.totalStaffCost || 0), 0);
                  const totalOwner = currentCosts.reduce((sum, cost) => sum + (cost.totalOwnerCost || 0), 0);
                  const totalUtility = currentCosts.reduce((sum, cost) => sum + (cost.totalUtilityCost || 0), 0);
                  const totalOther = currentCosts.reduce((sum, cost) => sum + (cost.totalOtherCost || 0), 0);

                  // สร้างรายการประเภทต้นทุนที่มีค่า
                  const costCategories = [
                    { 
                      name: 'วัตถุดิบ', 
                      icon: '🥗', 
                      amount: totalRawMaterial,
                      textColor: 'text-red-700'
                    },
                    { 
                      name: 'ค่าแรงพนักงาน', 
                      icon: '👥', 
                      amount: totalStaff,
                      textColor: 'text-orange-700'
                    },
                    { 
                      name: 'เงินเดือนทีมบริหาร', 
                      icon: '👑', 
                      amount: totalOwner,
                      textColor: 'text-blue-700'
                    },
                    { 
                      name: 'ค่าสาธารณูปโภค', 
                      icon: '⚡', 
                      amount: totalUtility,
                      textColor: 'text-yellow-700'
                    },
                    { 
                      name: 'ค่าใช้จ่ายอื่นๆ', 
                      icon: '📦', 
                      amount: totalOther,
                      textColor: 'text-gray-700'
                    }
                  ].filter(category => category.amount > 0); // แสดงเฉพาะประเภทที่มีค่า

                  return (
                    <div className="pt-3 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-error/20">
                        <h4 className="text-sm font-semibold text-error flex items-center gap-1">
                          <span>💰</span>
                          สรุปต้นทุน
                        </h4>
                        <span className="text-xs text-error/60 bg-error/10 px-2 py-1 rounded-full">
                          {costCategories.length} ประเภท
                        </span>
                      </div>

                      {/* รายการต้นทุน */}
                      <div className="space-y-2">
                        {costCategories.map((category, index) => {
                          const percentage = totalSales > 0 ? ((category.amount / totalSales) * 100) : 0;
                          
                          return (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-base-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{category.icon}</span>
                                <div>
                                  <span className={`text-sm font-medium ${category.textColor}`}>
                                    {category.name}
                                  </span>
                                  <div className="text-xs text-base-content/60">
                                    {percentage.toFixed(1)}% ของยอดขาย
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-error">
                                  {formatNumber(category.amount)}
                                </div>
                                <div className="text-xs text-base-content/50">บาท</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </details>
          </div>

          {/* กำไรสุทธิ - แสดงเต็ม 2 columns */}
          <div className="col-span-2 bg-gradient-to-br from-success/15 to-success/8 rounded-xl shadow-sm p-3 sm:p-4 border border-success/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success/25 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 stroke-current text-success">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-success/70">💚</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-success/80">กำไรสุทธิ</div>
              <div className="text-lg sm:text-xl font-bold text-success">{formatNumber(netProfit)}</div>
              {totalSales > 0 && (
                <div className="text-xs text-success/70">
                  {((netProfit / totalSales) * 100).toFixed(1)}% จากยอดขาย
                </div>
              )}
            </div>
          </div>
        </div>

        {/* รวมสถิติรายเดือน (แสดงเฉพาะโหมดรายเดือน) */}
        {filterMode === 'month' && !salesLoading && getDailyData().length > 0 && (
          <>


            {/* Divider */}
            <div className="divider">
              <span className="text-sm font-medium text-base-content/70">⚡ สถิติด่วน</span>
            </div>

            {/* สรุปสถิติด่วน - เพิ่มข้อมูลใหม่ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-3 text-center">
                <div className="text-success font-bold text-lg">
                  {getDailyData().filter(day => day.profit > 0).length}
                </div>
                <div className="text-xs text-success/70">วันที่มีกำไร</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {getDailyData().filter(day => day.profit < 0).length}
                </div>
                <div className="text-xs text-error/70">วันที่ขาดทุน</div>
              </div>

              <div className="bg-gradient-to-r from-purple-100/80 to-purple-50 border border-purple-300 rounded-lg p-3 text-center">
                <div className="text-purple-600 font-bold text-lg">
                  {(() => {
                    const salesDays = getDailyData().filter(day => day.total > 0);
                    if (salesDays.length === 0) return 0;

                    // คำนวณจำนวนออเดอร์เฉลี่ยจาก orders field
                    const totalOrders = salesDays.reduce((sum, day) => {
                      return sum + (day.totalOrders || 0);
                    }, 0);

                    const avgOrders = totalOrders / salesDays.length;
                    return Math.round(avgOrders);
                  })()}
                </div>
                <div className="text-xs text-purple-600/70">ออเดอร์เฉลี่ย/วัน</div>
              </div>

              <div className="bg-gradient-to-r from-info/10 to-info/5 border border-info/20 rounded-lg p-3 text-center">
                <div className="text-info font-bold text-lg">
                  {(() => {
                    const totals = getDailyData().map(day => day.total);
                    const avgSales = totals.length > 0 ? totals.reduce((sum, t) => sum + t, 0) / totals.length : 0;
                    return formatNumber(avgSales);
                  })()}
                </div>
                <div className="text-xs text-info/70">ยอดขายเฉลี่ย/วัน</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {(() => {
                    const costs = getDailyData().map(day => day.cost);
                    const avgCost = costs.length > 0 ? costs.reduce((sum, c) => sum + c, 0) / costs.length : 0;
                    return formatNumber(avgCost);
                  })()}
                </div>
                <div className="text-xs text-error/70">ต้นทุนเฉลี่ย/วัน</div>
              </div>

              {/* เพิ่ม TotalOwnerCost ถ้ามี */}
              {(() => {
                const monthOwnerCost = costData
                  .filter(item => {
                    const date = new Date(item.costDate);
                    return (
                      date.getMonth() === selectedMonth &&
                      date.getFullYear() === selectedYear
                    );
                  })
                  .reduce((sum, item) => sum + (item.totalOwnerCost || 0), 0);

                return monthOwnerCost > 0 ? (
                  <div className="bg-gradient-to-r from-orange-100/80 to-orange-50 border border-orange-300 rounded-lg p-3 text-center">
                    <div className="text-orange-600 font-bold text-lg">
                      {formatNumber(monthOwnerCost)}
                    </div>
                    <div className="text-xs text-orange-600/70">เงินเดือนทีมบริหาร</div>
                  </div>
                ) : null;
              })()}

              {/* เพิ่ม TotalUtilityCost ถ้ามี */}
              {(() => {
                const monthUtilityCost = costData
                  .filter(item => {
                    const date = new Date(item.costDate);
                    return (
                      date.getMonth() === selectedMonth &&
                      date.getFullYear() === selectedYear
                    );
                  })
                  .reduce((sum, item) => sum + (item.totalUtilityCost || 0), 0);

                return monthUtilityCost > 0 ? (
                  <div className="bg-gradient-to-r from-cyan-100/80 to-cyan-50 border border-cyan-300 rounded-lg p-3 text-center">
                    <div className="text-cyan-600 font-bold text-lg">
                      {formatNumber(monthUtilityCost)}
                    </div>
                    <div className="text-xs text-cyan-600/70">ต้นทุนค่าน้ำค่าไฟ</div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Top 5 Selling Items ของเดือน - เปลี่ยนเป็น Collapse */}
            {(() => {
              // รวบรวม TopItems จากทุกวันในเดือน
              const monthlyTopItems = getDailyData()
                .flatMap(day => day.topItems || [])
                .reduce((acc, item) => {
                  const key = item.menuName || item.MenuName;
                  if (!acc[key]) {
                    acc[key] = {
                      menuName: key,
                      quantitySold: 0,
                      totalSales: 0
                    };
                  }
                  acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
                  acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
                  return acc;
                }, {});

              const sortedItems = Object.values(monthlyTopItems)
                .sort((a, b) => b.quantitySold - a.quantitySold)
                .slice(0, 5); // แสดง Top 5

              return sortedItems.length > 0 ? (
                <div className="collapse bg-base-100 border border-warning/20 rounded-lg">
                  <input type="checkbox" />
                  <div className="collapse-title font-semibold min-h-0 p-0">
                    <div className="flex justify-between items-center p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-warning text-xl">🏆</span>
                        <span className="text-lg font-bold text-warning">
                          รายการที่ขายดี Top 5 ประจำเดือน {months[selectedMonth]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="collapse-content px-4 pb-4">
                    <div className="pt-0 space-y-3">
                      {/* Grid สำหรับ Desktop */}
                      <div className="hidden md:grid grid-cols-1 gap-3">
                        {sortedItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-base-100/70 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className={`badge badge-lg font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-600' :
                                    'bg-gray-500'
                                }`}>
                                #{index + 1}
                              </span>
                              <span className="font-medium text-base">
                                {item.menuName}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold text-warning text-lg">
                                  {item.quantitySold} ออเดอร์
                                </div>
                                <div className="text-sm text-base-content/60">
                                  {formatNumber(item.totalSales)} บาท
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* List สำหรับ Mobile */}
                      <div className="md:hidden space-y-2">
                        {sortedItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-base-100/70 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <span className={`badge badge-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-600' :
                                    'bg-gray-500'
                                }`}>
                                #{index + 1}
                              </span>
                              <span className="text-sm font-medium truncate max-w-[120px]">
                                {item.menuName}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-warning">
                                {item.quantitySold} ออเดอร์
                              </span>
                              <span className="text-xs text-base-content/60">
                                {formatNumber(item.totalSales)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </>
        )}
      </div>

      {/* ✅ ลบ isLoading alert */}
      {salesLoading ? (
        <div className="bg-base-100 rounded-xl shadow p-8 flex flex-col items-center justify-center mb-6">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <span className="text-lg font-semibold text-base-content/70">กำลังโหลดข้อมูลยอดขายและต้นทุน...</span>
        </div>
      ) : null}

      {/* ✅ ใช้ SummaryGraphCarousel แทนโค้ดเดิม */}
      <SummaryGraphCarousel
        salesLoading={salesLoading}
        data={dineInData}
        deliveryData={deliveryData}
        costChartData={costChartData}
        options={options}
        dineInSalesData={dineInSalesData}
        deliverySalesData={deliverySalesData}
        costData={costData}
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        months={months}
        formatNumber={formatNumber}
      />

      {/* ✅ Card สรุปรายวัน (แสดงเฉพาะโหมดรายเดือน) */}
      {filterMode === 'month' && !salesLoading && (
        <DailySummary
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          months={months}
          getDailyData={getDailyData}
          formatDate={formatDate}
          formatNumber={formatNumber}
          costData={costData}
        />
      )}

      {/* ✅ Card สรุปรายเดือน (แสดงเฉพาะโหมดรายปี) */}
      {filterMode === 'year' && !salesLoading && (
        <MonthlySummary
          selectedYear={selectedYear}
          getMonthlyData={getMonthlyData}
          formatNumber={formatNumber}
          costData={costData}
          costTotal={costTotal}
        />
      )}

      {/* ✅ ปุ่มกลับขึ้นด้านบน */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="กลับขึ้นด้านบน"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Dashboard;