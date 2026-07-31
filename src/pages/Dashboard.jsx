import { useState, useEffect, useCallback, useMemo } from "react";
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
import SummaryGraphCarousel from '../components/dashboard/3SummaryGraph';
import DailySummary from '../components/dashboard/DailySummary';
import MonthlySummary from '../components/dashboard/MonthlySummary';
import TopSalesItems from '../components/dashboard/TopSalesItems';
import PeakHoursAnalysis from '../components/dashboard/PeakHoursAnalysis';
import {
  filterDataByDate,
  calculateTotals,
  calculateCostBreakdown,
  generateDailyData,
  generateMonthlyData,
  formatDisplayDate as formatDate
} from '../services/dashboardService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ✅ ย้าย months ออกไปนอก component
const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
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
  const [filterMode, setFilterMode] = useState('month');
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // ✅ เพิ่ม state สำหรับ getSaleOfMenu
  const [salesByCategory, setSalesByCategory] = useState([]);

  // ✅ ดึงข้อมูลยอดขายรายวันตอนเปิดหน้า
  const fetchDailySalesReport = useCallback(async () => {
    try {
      setSalesLoading(true);

      // ✅ สร้าง params แยกตามโหมด
      const params = filterMode === 'month'
        ? {
          Month: selectedMonth + 1, // API รับเดือนเริ่มต้นที่ 1
          Year: selectedYear,
          IsPurchase: true,
        }
        : {
          Year: selectedYear,
          IsPurchase: true
        };

      const _response = await api.post("/orders/GetDailyReport", params);
      setDineInSalesData(_response.data.data.dailyDineInSalesReport || []);
      setDeliverySalesData(_response.data.data.dailyDeliverySalesReport || []);
      setCostData(_response.data.data.dailyCostReport || []);
      
      // ✅ เก็บข้อมูล getSaleOfMenu
      setSalesByCategory(_response.data.data.getSaleOfMenu || []);
      
      console.log("Fetched sales by category:", JSON.stringify(_response.data.data.getSaleOfMenu, null, 2));

    } catch (error) {
      console.error("Error fetching sales report:", error);
      alert(
        "เกิดข้อผิดพลาดในการดึงข้อมูลยอดขาย: " +
        (error.message || "ไม่ทราบสาเหตุ")
      );
    } finally {
      setSalesLoading(false);
    }
  }, [selectedYear, selectedMonth, filterMode]); // ✅ เพิ่ม selectedMonth และ filterMode

  // ✅ 2. useEffect จะ auto re-run เมื่อ fetchDailySalesReport เปลี่ยน
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

  // ✅ 1. ใช้ utility แทนการ Memoize การกรองข้อมูลพื้นฐาน
  const filteredData = useMemo(() => {
    const dineInFilter = filterDataByDate(dineInSalesData, 'saleDate');
    const deliveryFilter = filterDataByDate(deliverySalesData, 'saleDate');
    const costFilter = filterDataByDate(costData, 'costDate');

    return {
      dineInMonth: dineInFilter.filterByMonth(selectedMonth, selectedYear),
      dineInYear: dineInFilter.filterByYear(selectedYear),
      deliveryMonth: deliveryFilter.filterByMonth(selectedMonth, selectedYear),
      deliveryYear: deliveryFilter.filterByYear(selectedYear),
      costMonth: costFilter.filterByMonth(selectedMonth, selectedYear),
      costYear: costFilter.filterByYear(selectedYear)
    };
  }, [dineInSalesData, deliverySalesData, costData, selectedMonth, selectedYear]);

  // ✅ 2. ใช้ utility แทนการคำนวณยอดรวม
  const totals = useMemo(() => {
    const dineInTotal = filterMode === 'month'
      ? calculateTotals(filteredData.dineInMonth)
      : calculateTotals(filteredData.dineInYear);

    const deliveryTotal = filterMode === 'month'
      ? calculateTotals(filteredData.deliveryMonth)
      : calculateTotals(filteredData.deliveryYear);

    var costTotal = filterMode === 'month'
      ? calculateTotals(filteredData.costMonth)
      : calculateTotals(filteredData.costYear);

    const discountTotal = filterMode === 'month'
      ? calculateTotals(filteredData.dineInMonth, 'totalDiscount')
      : calculateTotals(filteredData.dineInYear, 'totalDiscount');

    costTotal += discountTotal; // รวมส่วนลดเข้าไปในต้นทุน
    const totalSales = dineInTotal + deliveryTotal;
    const netProfit = totalSales - costTotal;

    return { dineInTotal, deliveryTotal, totalSales, costTotal, netProfit, discountTotal };
  }, [filteredData, filterMode]);

  // ✅ 3. ใช้ utility แทน getDailyData
  const dailyData = useMemo(() => {
    return generateDailyData(dineInSalesData, deliverySalesData, costData, selectedMonth, selectedYear);
  }, [dineInSalesData, deliverySalesData, costData, selectedMonth, selectedYear]);

  // ✅ 4. ใช้ utility แทน getMonthlyData
  const monthlyData = useMemo(() => {
    return generateMonthlyData(dineInSalesData, deliverySalesData, costData, selectedYear, months);
  }, [dineInSalesData, deliverySalesData, costData, selectedYear]);

  // ✅ 5. ใช้ utility แทนการคำนวณต้นทุนแยกประเภท
  const costBreakdown = useMemo(() => {
    const currentCosts = filterMode === 'month' ? filteredData.costMonth : filteredData.costYear;
    return calculateCostBreakdown(currentCosts);
  }, [filteredData, filterMode]);

  // ✅ 1. Memoize ข้อมูลกราฟ - แก้ไข syntax
  const chartData = useMemo(() => {
    const dineInData = {
      labels: months,
      datasets: [{
        label: "ยอดขายรายเดือน",
        data: months.map((_, monthIdx) =>
          filteredData.dineInYear
            .filter(item => new Date(item.saleDate).getMonth() === monthIdx)
            .reduce((sum, item) => sum + item.totalAmount, 0)
        ),
        backgroundColor: "oklch(60% 0.118 184.704)",
      }] // ✅ เพิ่ม closing bracket
    }; // ✅ เพิ่ม semicolon

    const deliveryData = {
      labels: months,
      datasets: [{
        label: "ยอดขายเดลิเวอรี่รายเดือน",
        data: months.map((_, monthIdx) =>
          filteredData.deliveryYear
            .filter(item => new Date(item.saleDate).getMonth() === monthIdx)
            .reduce((sum, item) => sum + item.totalAmount, 0)
        ),
        backgroundColor: "oklch(60% 0.118 265.755)",
      }] // ✅ เพิ่ม closing bracket
    }; // ✅ เพิ่ม semicolon

    const costChartData = {
      labels: months,
      datasets: [{
        label: "ต้นทุนรายเดือน",
        data: months.map((_, monthIdx) =>
          filteredData.costYear
            .filter(item => new Date(item.costDate).getMonth() === monthIdx)
            .reduce((sum, item) => sum + (item.totalAmount || 0), 0)
        ),
        backgroundColor: "oklch(60% 0.118 30.755)",
      }] // ✅ เพิ่ม closing bracket
    }; // ✅ เพิ่ม semicolon

    return { dineInData, deliveryData, costChartData };
  }, [filteredData]); // ✅ แก้ไข dependencies และปิด useMemo ให้ถูกต้อง
  // ✅ 6. Memoize Top 5 Items
  // const topItems = useMemo(() => {
  //   const monthlyTopItems = dailyData
  //     .flatMap(day => day.topItems || [])
  //     .reduce((acc, item) => {
  //       const key = item.menuName || item.MenuName;
  //       if (!acc[key]) {
  //         acc[key] = { menuName: key, quantitySold: 0, totalSales: 0 };
  //       }
  //       acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
  //       acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
  //       return acc;
  //     }, {});

  //   const monthlyDeliveryTopItems = filteredData.deliveryMonth
  //     .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
  //     .reduce((acc, item) => {
  //       const key = item.menuName || item.MenuName;
  //       if (!acc[key]) {
  //         acc[key] = { menuName: key, quantitySold: 0, totalSales: 0 };
  //       }
  //       acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
  //       acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
  //       return acc;
  //     }, {});

  //   return {
  //     dineIn: Object.values(monthlyTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5),
  //     delivery: Object.values(monthlyDeliveryTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5)
  //   };
  // }, [dailyData, filteredData.deliveryMonth]);

  // ✅ 7. Memoize สถิติด่วน
  const quickStats = useMemo(() => {
    const profitDays = dailyData.filter(day => day.profit > 0).length;
    const lossDays = dailyData.filter(day => day.profit < 0).length;
    const salesDays = dailyData.filter(day => day.total > 0);

    // ✅ คำนวณออเดอร์เฉลี่ยรวม
    const avgOrders = salesDays.length > 0
      ? Math.round(salesDays.reduce((sum, day) => sum + (day.totalOrders || 0), 0) / salesDays.length)
      : 0;

    // ✅ เพิ่มออเดอร์เฉลี่ยแยกตามประเภท
    const totalDineInOrders = dailyData.reduce((sum, day) => sum + (day.dineInOrders || 0), 0);
    const totalDeliveryOrders = dailyData.reduce((sum, day) => sum + (day.deliveryOrders || 0), 0);

    const avgDineInOrders = salesDays.length > 0
      ? Math.round(totalDineInOrders / salesDays.length)
      : 0;

    const avgDeliveryOrders = salesDays.length > 0
      ? Math.round(totalDeliveryOrders / salesDays.length)
      : 0;

    const avgSales = salesDays.length > 0
      ? salesDays.reduce((sum, day) => sum + day.total, 0) / salesDays.length
      : 0;

    const avgCost = dailyData.length > 0
      ? dailyData.reduce((sum, day) => sum + day.cost, 0) / dailyData.length
      : 0;

    // รายได้เฉลี่ยต่อออเดอร์แยกตามประเภท
    const totalDineInAmount = dailyData.reduce((sum, day) => sum + day.dineIn, 0);
    const totalDeliveryAmount = dailyData.reduce((sum, day) => sum + day.delivery, 0);

    const avgDineInPerOrder = totalDineInOrders > 0 ? totalDineInAmount / totalDineInOrders : 0;
    const avgDeliveryPerOrder = totalDeliveryOrders > 0 ? totalDeliveryAmount / totalDeliveryOrders : 0;

    return {
      profitDays,
      lossDays,
      avgOrders,             // ออเดอร์เฉลี่ยรวม
      avgDineInOrders,       // ✅ ออเดอร์เฉลี่ยหน้าร้าน (ใหม่)
      avgDeliveryOrders,     // ✅ ออเดอร์เฉลี่ยเดลิเวอรี่ (ใหม่)
      avgSales,
      avgCost,
      avgDineInPerOrder,     // รายได้เฉลี่ยต่อออเดอร์หน้าร้าน
      avgDeliveryPerOrder    // รายได้เฉลี่ยต่อออเดอร์เดลิเวอรี่
    };
  }, [dailyData]);

  // ✅ เพิ่มหลัง formatDate callback
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // ✅ เพิ่ม scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ สร้าง dailyData สำหรับทั้งปี
  const yearlyDailyData = useMemo(() => {
    if (filterMode !== 'year') return [];

    // สร้าง dailyData สำหรับทุกเดือนในปี
    const allYearData = [];

    for (let month = 0; month < 12; month++) {
      const monthDailyData = generateDailyData(
        dineInSalesData,
        deliverySalesData,
        costData,
        month,
        selectedYear
      );
      allYearData.push(...monthDailyData);
    }

    return allYearData;
  }, [dineInSalesData, deliverySalesData, costData, selectedYear, filterMode]);

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
            {/* ✅ แสดง loading indicator ขณะเปลี่ยนโหมด */}
            {salesLoading && (
              <span className="loading loading-spinner loading-xs text-success"></span>
            )}
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
              <div className="text-sm sm:text-lg font-bold text-info">{formatNumber(totals.dineInTotal)}</div>
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
              <div className="text-sm sm:text-lg font-bold text-accent">{formatNumber(totals.deliveryTotal)}</div>
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
              <div className="text-lg sm:text-xl font-bold text-primary">{formatNumber(totals.totalSales)}</div>
            </div>
          </div>

          {/* จำนวนวันที่เปิดขาย / เดือนที่เปิดขาย */}
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
              {/* ✅ เปลี่ยนตามโหมดการแสดงผล */}
              <div className="text-xs sm:text-sm font-medium text-warning/80">
                {filterMode === 'month' ? 'วันที่เปิดขาย' : 'เดือนที่เปิดขาย'}
              </div>
              <div className="text-lg sm:text-xl font-bold text-warning">
                {filterMode === 'month'
                  ? `${dailyData.filter(day => day.total > 0).length} วัน`
                  : `${monthlyData.filter(month => month.total > 0).length} เดือน`
                }
              </div>
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
                  <div className="text-sm sm:text-lg font-bold text-error">{formatNumber(totals.costTotal)}</div>
                  {totals.totalSales > 0 && (
                    <div className="text-xs text-error/70">
                      {((totals.costTotal / totals.totalSales) * 100).toFixed(1)}% จากยอดขาย
                    </div>
                  )}
                </div>
              </summary>

              <div className="collapse-content px-3 sm:px-4 pb-3 sm:pb-4">
                {(() => {
                  if (filteredData.costMonth.length === 0 && filteredData.costYear.length === 0) {
                    return (
                      <div className="text-center py-6">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm text-error/60">ไม่มีข้อมูลต้นทุน</div>
                      </div>
                    );
                  }

                  // ✅ ใช้ costBreakdown แทนการคำนวณซ้ำ
                  const costCategories = [
                    {
                      name: 'วัตถุดิบ',
                      icon: '🥗',
                      amount: costBreakdown.totalRawMaterial,
                      textColor: 'text-red-700'
                    },
                    {
                      name: 'ค่าแรงพนักงาน',
                      icon: '👥',
                      amount: costBreakdown.totalStaff,
                      textColor: 'text-orange-700'
                    },
                    {
                      name: 'เงินเดือนทีมบริหาร',
                      icon: '👑',
                      amount: costBreakdown.totalOwner,
                      textColor: 'text-blue-700'
                    },
                    {
                      name: 'ค่าสาธารณูปโภค',
                      icon: '⚡',
                      amount: costBreakdown.totalUtility,
                      textColor: 'text-yellow-700'
                    },
                    {
                      name: 'ค่าใช้จ่ายอื่นๆ',
                      icon: '📦',
                      amount: costBreakdown.totalOther,
                      textColor: 'text-gray-700'
                    },
                    {
                      name: 'ส่วนลดหน้าร้าน',
                      icon: '🏷️',
                      amount: totals.discountTotal,
                      textColor: 'text-red-700'
                    }
                  ].filter(category => category.amount > 0);

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
                          const percentage = totals.totalSales > 0 ? ((category.amount / totals.totalSales) * 100) : 0;

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
              <div className="text-lg sm:text-xl font-bold text-success">{formatNumber(totals.netProfit)}</div>
              {totals.totalSales > 0 && (
                <div className="text-xs text-success/70">
                  {((totals.netProfit / totals.totalSales) * 100).toFixed(1)}% จากยอดขาย
                </div>
              )}
            </div>
          </div>
        </div>

        {/* รวมสถิติรายเดือน (แสดงเฉพาะโหมดรายเดือน) */}
        {filterMode === 'month' && !salesLoading && dailyData.length > 0 && (
          <>

            {/* Divider */}
            <div className="divider">
              <span className="text-sm font-medium text-base-content/70">⚡ สถิติรายเดือน</span>
            </div>

            {/* สรุปสถิติด่วน */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-3 text-center">
                <div className="text-success font-bold text-lg">
                  {quickStats.profitDays}
                </div>
                <div className="text-xs text-success/70">วันที่มีกำไร</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {quickStats.lossDays}
                </div>
                <div className="text-xs text-error/70">วันที่ขาดทุน</div>
              </div>
              {/* ✅ เพิ่มออเดอร์เฉลี่ยรวม (ถ้าต้องการแสดงด้วย) */}
              <div className="bg-gradient-to-r from-gray-100/80 to-gray-50 border border-gray-300 rounded-lg p-3 text-center">
                <div className="text-gray-600 font-bold text-lg">
                  {quickStats.avgOrders}
                </div>
                <div className="text-xs text-gray-600/70">จำนวนออเดอร์เฉลี่ยต่อวัน</div>
              </div>
              {/* ✅ แทนที่ออเดอร์เฉลี่ยรวมด้วยหน้าร้าน */}
              <div className="bg-gradient-to-r from-blue-100/80 to-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                <div className="text-blue-600 font-bold text-lg">
                  {quickStats.avgDineInOrders}
                </div>
                <div className="text-xs text-blue-600/70">🏪 จำนวนออเดอร์หน้าร้าน เฉลี่ยต่อวัน</div>
              </div>

              {/* ✅ เพิ่มออเดอร์เฉลี่ยเดลิเวอรี่ */}
              <div className="bg-gradient-to-r from-teal-100/80 to-teal-50 border border-teal-300 rounded-lg p-3 text-center">
                <div className="text-teal-600 font-bold text-lg">
                  {quickStats.avgDeliveryOrders}
                </div>
                <div className="text-xs text-teal-600/70">🛵 จำนวนออเดอร์เดลิเวอรี่ เฉลี่ยต่อวัน</div>
              </div>

              <div className="bg-gradient-to-r from-info/10 to-info/5 border border-info/20 rounded-lg p-3 text-center">
                <div className="text-info font-bold text-lg">
                  {formatNumber(quickStats.avgSales)}
                </div>
                <div className="text-xs text-info/70">ยอดขายเฉลี่ยต่อวัน</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {formatNumber(quickStats.avgCost)}
                </div>
                <div className="text-xs text-error/70">ต้นทุนเฉลี่ยต่อวัน</div>
              </div>

              {/* ✅ รายได้เฉลี่ยต่อออเดอร์หน้าร้าน */}
              <div className="bg-gradient-to-r from-indigo-100/80 to-indigo-50 border border-indigo-300 rounded-lg p-3 text-center">
                <div className="text-indigo-600 font-bold text-lg">
                  {formatNumber(quickStats.avgDineInPerOrder)}
                </div>
                <div className="text-xs text-indigo-600/70">🏪 ยอดขายเฉลี่ยต่อออเดอร์ หน้าร้าน</div>
              </div>

              {/* ✅ รายได้เฉลี่ยต่อออเดอร์เดลิเวอรี่ */}
              <div className="bg-gradient-to-r from-purple-100/80 to-purple-50 border border-purple-300 rounded-lg p-3 text-center">
                <div className="text-purple-600 font-bold text-lg">
                  {formatNumber(quickStats.avgDeliveryPerOrder)}
                </div>
                <div className="text-xs text-purple-600/70">🛵 ยอดขายเฉลี่ยต่อออเดอร์ เดลิเวอรี่</div>
              </div>



              {/* เพิ่ม Cost Categories ถ้ามี */}
              {costBreakdown.totalOwner > 0 && (
                <div className="bg-gradient-to-r from-orange-100/80 to-orange-50 border border-orange-300 rounded-lg p-3 text-center">
                  <div className="text-orange-600 font-bold text-lg">
                    {formatNumber(costBreakdown.totalOwner)}
                  </div>
                  <div className="text-xs text-orange-600/70">เงินเดือนทีมบริหาร</div>
                </div>
              )}

              {costBreakdown.totalUtility > 0 && (
                <div className="bg-gradient-to-r from-cyan-100/80 to-cyan-50 border border-cyan-300 rounded-lg p-3 text-center">
                  <div className="text-cyan-600 font-bold text-lg">
                    {formatNumber(costBreakdown.totalUtility)}
                  </div>
                  <div className="text-xs text-cyan-600/70">ต้นทุนค่าน้ำค่าไฟ</div>
                </div>
              )}
            </div>

            {/* Top 5 Selling Items Component */}
            <TopSalesItems
              filterMode={filterMode}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              months={months}
              salesByCategory={salesByCategory} // ✅ ใช้เฉพาะ prop นี้
              formatNumber={formatNumber}
            />

            {/* ✅ Peak Hours Analysis สำหรับโหมดรายเดือน */}
            <div className="mt-6">
              <PeakHoursAnalysis
                filterMode={filterMode}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                months={months}
                dailyData={dailyData}
                monthlyData={monthlyData}
                formatNumber={formatNumber}
              />
            </div>
          </>
        )}

        {/* ✅ สำหรับโหมดรายปี */}
        {filterMode === 'year' && !salesLoading && (
          <>
            {/* Divider */}
            <div className="divider">
              <span className="text-sm font-medium text-base-content/70">⚡ สถิติรายปี</span>
            </div>

            {/* สรุปสถิติตามปี */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-3 text-center">
                <div className="text-success font-bold text-lg">
                  {monthlyData.filter(month => month.profit > 0).length}
                </div>
                <div className="text-xs text-success/70">เดือนที่มีกำไร</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {monthlyData.filter(month => month.profit < 0).length}
                </div>
                <div className="text-xs text-error/70">เดือนที่ขาดทุน</div>
              </div>

              <div className="bg-gradient-to-r from-info/10 to-info/5 border border-info/20 rounded-lg p-3 text-center">
                <div className="text-info font-bold text-lg">
                  {formatNumber(monthlyData.length > 0 ? totals.totalSales / monthlyData.length : 0)}
                </div>
                <div className="text-xs text-info/70">ยอดขายเฉลี่ยต่อเดือน</div>
              </div>

              <div className="bg-gradient-to-r from-error/10 to-error/5 border border-error/20 rounded-lg p-3 text-center">
                <div className="text-error font-bold text-lg">
                  {formatNumber(monthlyData.length > 0 ? totals.costTotal / monthlyData.length : 0)}
                </div>
                <div className="text-xs text-error/70">ต้นทุนเฉลี่ยต่อเดือน</div>
              </div>

              <div className="bg-gradient-to-r from-purple-100/80 to-purple-50 border border-purple-300 rounded-lg p-3 text-center">
                <div className="text-purple-600 font-bold text-lg">
                  {monthlyData.length}
                </div>
                <div className="text-xs text-purple-600/70">เดือนที่มีข้อมูล</div>
              </div>

              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-3 text-center">
                <div className="text-success font-bold text-lg">
                  {formatNumber(monthlyData.length > 0 ? totals.netProfit / monthlyData.length : 0)}
                </div>
                <div className="text-xs text-success/70">กำไรเฉลี่ยต่อเดือน</div>
              </div>

              {/* ✅ เพิ่มรายได้เฉลี่ยต่อออเดอร์หน้าร้านรายปี */}
              <div className="bg-gradient-to-r from-blue-100/80 to-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                <div className="text-blue-600 font-bold text-lg">
                  {(() => {
                    const totalDineInAmount = monthlyData.reduce((sum, month) => sum + month.dineIn, 0);
                    const totalDineInOrders = monthlyData.reduce((sum, month) => sum + (month.dineInOrders || 0), 0);
                    const avgDineInPerOrder = totalDineInOrders > 0 ? totalDineInAmount / totalDineInOrders : 0;
                    return formatNumber(avgDineInPerOrder);
                  })()}
                </div>
                <div className="text-xs text-blue-600/70">🏪 ยอดขายเฉลี่ยต่อออเดอร์ หน้าร้าน</div>
              </div>

              {/* ✅ เพิ่มรายได้เฉลี่ยต่อออเดอร์เดลิเวอรี่รายปี */}
              <div className="bg-gradient-to-r from-teal-100/80 to-teal-50 border border-teal-300 rounded-lg p-3 text-center">
                <div className="text-teal-600 font-bold text-lg">
                  {(() => {
                    const totalDeliveryAmount = monthlyData.reduce((sum, month) => sum + month.delivery, 0);
                    const totalDeliveryOrders = monthlyData.reduce((sum, month) => sum + (month.deliveryOrders || 0), 0);
                    const avgDeliveryPerOrder = totalDeliveryOrders > 0 ? totalDeliveryAmount / totalDeliveryOrders : 0;
                    return formatNumber(avgDeliveryPerOrder);
                  })()}
                </div>
                <div className="text-xs text-teal-600/70">🛵 ยอดขายเฉลี่ยต่อออเดอร์ เดลิเวอรี่</div>
              </div>


              {/* ✅ จำนวนออเดอร์เฉลี่ยต่อเดือนหน้าร้าน */}
              <div className="bg-gradient-to-r from-blue-100/80 to-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                <div className="text-blue-600 font-bold text-lg">
                  {(() => {
                    const monthsWithDineInData = monthlyData.filter(month => (month.avgDineInOrdersPerDay || 0) > 0);
                    const totalAvgDineInOrders = monthsWithDineInData.reduce((sum, month) => sum + (month.avgDineInOrdersPerDay || 0), 0);
                    const overallAvgDineInPerDay = monthsWithDineInData.length > 0 ? Math.round(totalAvgDineInOrders / monthsWithDineInData.length) : 0;
                    return formatNumber(overallAvgDineInPerDay);
                  })()}
                </div>
                <div className="text-xs text-blue-600/70">🏪 จำนวนออเดอร์เฉลี่ยต่อวันหน้าร้าน</div>
              </div>

              {/* ✅ จำนวนออเดอร์เฉลี่ยต่อเดือนเดลิเวอรี่ */}
              <div className="bg-gradient-to-r from-teal-100/80 to-teal-50 border border-teal-300 rounded-lg p-3 text-center">
                <div className="text-teal-600 font-bold text-lg">
                  {(() => {
                    const monthsWithDeliveryData = monthlyData.filter(month => (month.avgDeliveryOrdersPerDay || 0) > 0);
                    const totalAvgDeliveryOrders = monthsWithDeliveryData.reduce((sum, month) => sum + (month.avgDeliveryOrdersPerDay || 0), 0);
                    const overallAvgDeliveryPerDay = monthsWithDeliveryData.length > 0 ? Math.round(totalAvgDeliveryOrders / monthsWithDeliveryData.length) : 0;
                    return formatNumber(overallAvgDeliveryPerDay);
                  })()}
                </div>
                <div className="text-xs text-teal-600/70">🛵 จำนวนออเดอร์เฉลี่ยต่อวันเดลิเวอรี่</div>
              </div>

              {/* ✅ เพิ่มจำนวนออเดอร์เฉลี่ยต่อเดือน */}
              <div className="bg-gradient-to-r from-indigo-100/80 to-indigo-50 border border-indigo-300 rounded-lg p-3 text-center">
                <div className="text-indigo-600 font-bold text-lg">
                  {(() => {
                    const totalOrders = monthlyData.reduce((sum, month) => sum + (month.totalOrders || 0), 0);
                    const avgOrdersPerMonth = monthlyData.length > 0 ? Math.round(totalOrders / monthlyData.length) : 0;
                    return avgOrdersPerMonth;
                  })()}
                </div>
                <div className="text-xs text-indigo-600/70">จำนวนออเดอร์เฉลี่ยต่อเดือน</div>
              </div>

              {/* เพิ่ม Cost Categories ถ้ามี */}
              {/* {costBreakdown.totalOwner > 0 && (
                <div className="bg-gradient-to-r from-orange-100/80 to-orange-50 border border-orange-300 rounded-lg p-3 text-center">
                  <div className="text-orange-600 font-bold text-lg">
                    {formatNumber(costBreakdown.totalOwner)}
                  </div>
                  <div className="text-xs text-orange-600/70">เงินเดือนทีมบริหารทั้งหมด</div>
                </div>
              )} */}

              {/* {costBreakdown.totalUtility > 0 && (
                <div className="bg-gradient-to-r from-cyan-100/80 to-cyan-50 border border-cyan-300 rounded-lg p-3 text-center">
                  <div className="text-cyan-600 font-bold text-lg">
                    {formatNumber(costBreakdown.totalUtility)}
                  </div>
                  <div className="text-xs text-cyan-600/70">ต้นทุนค่าน้ำค่าไฟทั้งหมด</div>
                </div>
              )} */}
            </div>

            {/* Top 5 Selling Items ของปี - แยก Tab */}
            <TopSalesItems
              filterMode={filterMode}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              months={months}
              dailyData={yearlyDailyData} // ✅ ใช้ข้อมูลรายวันของทั้งปี
              dineInSalesData={dineInSalesData}
              deliverySalesData={deliverySalesData}
              salesByCategory={salesByCategory} // ✅ เพิ่ม prop
              formatNumber={formatNumber}
            />

            <div className="mt-6">
              <PeakHoursAnalysis
                filterMode={filterMode}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                months={months}
                dailyData={filterMode === 'year' ? yearlyDailyData : dailyData}  // ✅ ส่ง yearlyDailyData
                monthlyData={monthlyData}
                formatNumber={formatNumber}
              />
            </div>
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
      {/* ✅ แสดง SummaryGraphCarousel เฉพาะโหมดรายปี */}
      {filterMode === 'year' && !salesLoading && (
        <SummaryGraphCarousel
          salesLoading={salesLoading}
          data={chartData.dineInData}
          deliveryData={chartData.deliveryData}
          costChartData={chartData.costChartData}
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
      )}

      {/* ✅ Card สรุปรายวัน (แสดงเฉพาะโหมดรายเดือน) */}
      {filterMode === 'month' && !salesLoading && (
        <DailySummary
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          months={months}
          dailyData={dailyData} // ✅ ส่งโดยตรง ไม่ต้องเป็น function
          formatDate={formatDate}
          formatNumber={formatNumber}
          costData={costData}
        />
      )}

      {/* ✅ Card สรุปรายเดือน (แสดงเฉพาะโหมดรายปี) */}
      {filterMode === 'year' && !salesLoading && (
        <MonthlySummary
          selectedYear={selectedYear}
          monthlyData={monthlyData} // ✅ ส่งโดยตรง ไม่ต้องเป็น function
          formatNumber={formatNumber}
          costData={costData}
          costTotal={totals.costTotal}
          dailyData={yearlyDailyData} // ✅ เพิ่ม dailyData
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