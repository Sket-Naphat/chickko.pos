import { useState, useEffect } from "react";
import { api } from "../lib/api";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

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
  const [isLoading, setIsLoading] = useState(false);
  const [dineInSalesData, setDineInSalesData] = useState([]);
  const [deliverySalesData, setDeliverySalesData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [filterMode, setFilterMode] = useState('month'); // 'month' หรือ 'year'

  // ✅ ดึงข้อมูลยอดขายรายวันตอนเปิดหน้า
  useEffect(() => {
    fetchDailySalesReport();
  }, []);

  const fetchDailySalesReport = async () => {
    try {
      setSalesLoading(true);
      // ดึงข้อมูลยอดขายรายวันหน้าร้าน
      const dineIn_response = await api.get("/orders/GetDailyDineInSalesReport");
      setDineInSalesData(dineIn_response.data.data || []);
      const delivery_response = await api.get("/orders/GetDailyDeliverySalesReport");
      setDeliverySalesData(delivery_response.data.data || []);
      const cost_response = await api.post("/cost/GetAllCostList", { IsPurchase: true });
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
  };

  const handleCopyOrderFromFirestore = async () => {
    try {
      setIsLoading(true);
      console.log("Copying order from Firestore...");

      const response = await api.post(
        "/orders/CopyOrderFromFirestore",
        {},
        { timeout: 1800000 }
      );

      console.log("Order copied successfully:", response.data);
      alert(response.data.message + " Order copied successfully");

      // ✅ รีเฟรชข้อมูลยอดขายหลังจากดึงข้อมูลเสร็จ
      await fetchDailySalesReport();
    } catch (error) {
      console.error("Error copying order:", error);
      alert(
        "เกิดข้อผิดพลาดในการดึงข้อมูล: " +
        (error.message || "ไม่ทราบสาเหตุ")
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  const themeColors = {
    success: 'oklch(20.8% 0.042 265.755)',
    base: 'rgba(245, 245, 245, 1)', // tailwind base-100
  };

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

  const data = {
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
            .reduce((sum, item) => sum + (item.costPrice || 0), 0)
        ),
        backgroundColor: "oklch(60% 0.118 30.755)", // สีกราฟต้นทุน
      },
    ],
  };

  // คำนวณสรุปผลประกอบการ
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

  const totalSales = dineInTotal + deliveryTotal;

  const costTotal = filterMode === 'month'
    ? costData
        .filter(item => {
          const date = new Date(item.costDate);
          return (
            date.getMonth() === selectedMonth &&
            date.getFullYear() === selectedYear
          );
        })
        .reduce((sum, item) => sum + (item.costPrice || 0), 0)
    : costData
        .filter(item => new Date(item.costDate).getFullYear() === selectedYear)
        .reduce((sum, item) => sum + (item.costPrice || 0), 0);

  const netProfit = totalSales - costTotal;

  return (
    <>
      <div className="px-2 py-4 sm:px-6 sm:py-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 ">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">สรุปผลประกอบการ</h1>
          <button
            className={`btn btn-primary ${isLoading ? "loading" : ""} `}
            onClick={handleCopyOrderFromFirestore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                กำลังดึงข้อมูล...
              </>
            ) : (
              "ดึงข้อมูลจาก Firestore"
            )}
          </button>
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
                {[...new Set(dineInSalesData.map(item => new Date(item.saleDate).getFullYear()))]
                  .concat(...deliverySalesData.map(item => new Date(item.saleDate).getFullYear()))
                  .concat(...costData.map(item => new Date(item.costDate).getFullYear()))
                  .filter((v, i, arr) => arr.indexOf(v) === i)
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

        {/* Card สรุปผล */}
        <div className="stats shadow mb-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-stretch">
          <div className="stat flex-1 min-w-[220px]">
            <div className="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="stat-title">ยอดขายหน้าร้าน</div>
            <div className="stat-value text-info">{formatNumber(dineInTotal)}</div>
            <div className="stat-desc">{filterMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`}</div>
          </div>
          <div className="stat flex-1 min-w-[220px]">
            <div className="stat-figure text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div className="stat-title">ยอดขายเดลิเวอรี่</div>
            <div className="stat-value text-accent">{formatNumber(deliveryTotal)}</div>
            <div className="stat-desc">{filterMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`}</div>
          </div>
          <div className="stat flex-1 min-w-[220px] bg-info/10">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">ยอดขายรวม</div>
            <div className="stat-value text-primary">{formatNumber(totalSales)}</div>
            <div className="stat-desc">{filterMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`}</div>
          </div>
          <div className="stat flex-1 min-w-[220px] bg-error/10">
            <div className="stat-figure text-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className="stat-title">ต้นทุน</div>
            <div className="stat-value text-error">{formatNumber(costTotal)}</div>
            <div className="stat-desc">
              {filterMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`}
              {totalSales > 0 && (
                <div className="text-error font-semibold">
                  ({((costTotal / totalSales) * 100).toFixed(1)}% จากยอดขาย)
                </div>
              )}
            </div>
          </div>
          <div className="stat flex-1 min-w-[220px] bg-success/10">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-8 w-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="stat-title">คงเหลือสุทธิ</div>
            <div className="stat-value text-success">{formatNumber(netProfit)}</div>
            <div className="stat-desc">
              {filterMode === 'month' ? `${months[selectedMonth]} ${selectedYear}` : `ปี ${selectedYear}`}
              {totalSales > 0 && (
                <div className="text-success font-semibold">
                  ({((netProfit / totalSales) * 100).toFixed(1)}% จากยอดขาย)
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="alert alert-info">
            <span className="loading loading-spinner loading-sm"></span>
            <span>กำลังดึงข้อมูลกรุณารอสักครู่...</span>
          </div>
        )}
        {salesLoading ? (
          <div className="bg-base-100 rounded-xl shadow p-8 flex flex-col items-center justify-center mb-6">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <span className="text-lg font-semibold text-base-content/70">กำลังโหลดข้อมูลยอดขายและต้นทุน...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* ✅ กราฟยอดขายรายเดือน */}
            <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-primary">
                📈 กราฟยอดขายหน้าร้านรายเดือน
              </h2>
              <div className="">
                <Bar
                  data={data}
                  options={options}
                />
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold block sm:inline">
                  {filterMode === 'month'
                    ? `ยอดขายเดือน ${months[selectedMonth]} ${selectedYear} : `
                    : `ยอดขายปี ${selectedYear} : `}
                </span>
                <span className="text-2xl block sm:inline text-success">
                  {filterMode === 'month'
                    ? formatNumber(
                      dineInSalesData
                        .filter(item => {
                          const date = new Date(item.saleDate);
                          return (
                            date.getMonth() === selectedMonth &&
                            date.getFullYear() === selectedYear
                          );
                        })
                        .reduce((sum, item) => sum + item.totalAmount, 0)
                    )
                    : formatNumber(
                      dineInSalesData
                        .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                        .reduce((sum, item) => sum + item.totalAmount, 0)
                    )}
                  บาท
                </span>
              </div>
            </div>

            {/* ✅ กราฟยอดขายเดลิเวอรี่รายเดือน */}
            <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-accent">
                🛵 กราฟยอดขายเดลิเวอรี่รายเดือน
              </h2>
              <div className="">
                <Bar
                  data={deliveryData}
                  options={options}
                />
              </div>
              <div className=" text-center">
                <span className="text-lg font-semibold block sm:inline">
                  {filterMode === 'month'
                    ? `ยอดขายเดลิเวอรี่เดือน ${months[selectedMonth]} ${selectedYear} : `
                    : `ยอดขายเดลิเวอรี่ปี ${selectedYear} : `}
                </span>
                <span className="text-2xl block sm:inline text-accent">
                  {filterMode === 'month'
                    ? formatNumber(
                      deliverySalesData
                        .filter(item => {
                          const date = new Date(item.saleDate);
                          return (
                            date.getMonth() === selectedMonth &&
                            date.getFullYear() === selectedYear
                          );
                        })
                        .reduce((sum, item) => sum + item.totalAmount, 0)
                    )
                    : formatNumber(
                      deliverySalesData
                        .filter(item => new Date(item.saleDate).getFullYear() === selectedYear)
                        .reduce((sum, item) => sum + item.totalAmount, 0)
                    )}
                  บาท
                </span>
              </div>
            </div>

            {/* ✅ กราฟต้นทุนรายเดือน */}
            <div className="bg-base-100 rounded-xl shadow p-4 flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-warning">
                💸 กราฟต้นทุนรายเดือน
              </h2>
              <div className="">
                <Bar
                  data={costChartData}
                  options={options}
                />
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold block sm:inline">
                  {filterMode === 'month'
                    ? `ต้นทุนเดือน ${months[selectedMonth]} ${selectedYear} : `
                    : `ต้นทุนปี ${selectedYear} : `}
                </span>
                <span className="text-2xl block sm:inline text-warning">
                  {filterMode === 'month'
                    ? formatNumber(
                      costData
                        .filter(item => {
                          const date = new Date(item.costDate);
                          return (
                            date.getMonth() === selectedMonth &&
                            date.getFullYear() === selectedYear
                          );
                        })
                        .reduce((sum, item) => sum + (item.costPrice || 0), 0)
                    )
                    : formatNumber(
                      costData
                        .filter(item => new Date(item.costDate).getFullYear() === selectedYear)
                        .reduce((sum, item) => sum + (item.costPrice || 0), 0)
                    )}
                  บาท
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

}

export default Dashboard;