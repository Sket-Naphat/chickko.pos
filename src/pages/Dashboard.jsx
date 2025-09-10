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
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  // ✅ ดึงข้อมูลยอดขายรายวันตอนเปิดหน้า
  useEffect(() => {
    fetchDailySalesReport();
  }, []);

  const fetchDailySalesReport = async () => {
    try {
      setSalesLoading(true);
      const response = await api.get("/orders/GetDailyDineInSalesReport");
      setSalesData(response.data.data || []);
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
          salesData
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

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>

          <button
            className={`btn btn-primary ${isLoading ? "loading" : ""}`}
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

        {isLoading && (
          <div className="alert alert-info">
            <span className="loading loading-spinner loading-sm"></span>
            <span>กำลังดึงข้อมูลกรุณารอสักครู่...</span>
          </div>
        )}
        {/* ✅ กราฟยอดขายรายเดือน */}
        <div className="bg-base-100 rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            📈 กราฟยอดขายรายเดือน
          </h2>
          <div className="flex gap-4 mb-4">
            <select
              className="select select-bordered"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {/* สร้างปีจากข้อมูล salesData จริง */}
              {[...new Set(salesData.map(item => new Date(item.saleDate).getFullYear()))]
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
          {/* สร้างข้อมูลกราฟจาก salesData จริง */}
          <Bar
            data={data}
            options={options}
          />
          <div className="mt-4 text-center">
            <span className="text-lg font-semibold block sm:inline">
              ยอดขายเดือน {months[selectedMonth]} {selectedYear} :{" "}
            </span>
            <span className="text-2xl block sm:inline">
              {formatNumber(
                salesData
                  .filter(item => {
                    const date = new Date(item.saleDate);
                    return (
                      date.getMonth() === selectedMonth &&
                      date.getFullYear() === selectedYear
                    );
                  })
                  .reduce((sum, item) => sum + item.totalAmount, 0)
              )} บาท
            </span>
          </div>
        </div>

        {/* ✅ ตารางแสดงยอดขายรายวัน */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">📊 รายงานยอดขายหน้าร้านรายวัน</h2>
              <button
                className={`btn btn-sm btn-outline ${
                  salesLoading ? "loading" : ""
                }`}
                onClick={fetchDailySalesReport}
                disabled={salesLoading}
              >
                {salesLoading ? "รีเฟรช..." : "🔄 รีเฟรช"}
              </button>
            </div>

            {salesLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="ml-2">⏳ กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {salesData.length > 0 && (
                  <div className="card bg-base-200 font-bold p-4 mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span>📈 รวมบิลทั้งหมด</span>
                      <span className="badge badge-secondary">
                        {salesData
                          .filter((item) => {
                            const date = new Date(item.saleDate);
                            return (
                              date.getMonth() === selectedMonth &&
                              date.getFullYear() === selectedYear
                            );
                          })
                          .reduce((sum, item) => sum + item.orders, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ยอดขายรวม</span>
                      <span className="text-success font-bold">
                        ฿{formatNumber(
                          salesData
                            .filter((item) => {
                              const date = new Date(item.saleDate);
                              return (
                                date.getMonth() === selectedMonth &&
                                date.getFullYear() === selectedYear
                              );
                            })
                            .reduce((sum, item) => sum + item.totalAmount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ค่าเฉลี่ยต่อบิล</span>
                      <span className="text-info">
                        ฿{formatNumber(
                          (salesData
                            .filter((item) => {
                              const date = new Date(item.saleDate);
                              return (
                                date.getMonth() === selectedMonth &&
                                date.getFullYear() === selectedYear
                              );
                            })
                            .reduce((sum, item) => sum + item.totalAmount, 0)) /
                            (salesData
                              .filter((item) => {
                                const date = new Date(item.saleDate);
                                return (
                                  date.getMonth() === selectedMonth &&
                                  date.getFullYear() === selectedYear
                                );
                                })
                                .reduce((sum, item) => sum + item.orders, 0) || 1)
                            )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>จำนวนวันที่เปิดขาย</span>
                            <span className="text-info">
                            {salesData.filter((item) => {
                              const date = new Date(item.saleDate);
                              return (
                              date.getMonth() === selectedMonth &&
                              date.getFullYear() === selectedYear
                              );
                            }).length} วัน
                            </span>
                          </div>
                          </div>
                        )}
                        {salesData.length === 0 ? (
                          <div className="text-center text-base-content/60 py-8">
                          ไม่มีข้อมูลยอดขาย
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {salesData
                            .filter((item) => {
                        const date = new Date(item.saleDate);
                        return (
                          date.getMonth() === selectedMonth &&
                          date.getFullYear() === selectedYear
                        );
                      })
                      .map((item, index, arr) => (
                        <div
                          key={index}
                          className="card bg-base-100 shadow p-4 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">#{arr.length - index}</span>
                            <span className="badge badge-primary">
                              {formatDateWithDay(item.saleDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>จำนวนบิล</span>
                            <span className="badge badge-info">{item.orders}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>ยอดขายรวม</span>
                            <span className="text-success font-bold">
                              ฿{formatNumber(item.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>ค่าเฉลี่ยต่อบิล</span>
                            <span className="text-info">
                              ฿{formatNumber(item.avgPerOrder)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>

        
      </div>
    </>
  );

  // เพิ่มฟังก์ชันนี้ไว้ใน component ด้วย
  function formatDateWithDay(dateString) {
    const date = new Date(dateString);
    const days = [
      "วันอาทิตย์",
      "วันจันทร์",
      "วันอังคาร",
      "วันพุธ",
      "วันพฤหัสบดี",
      "วันศุกร์",
      "วันเสาร์",
    ];
    const dayName = days[date.getDay()];
    const formattedDate = date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return `${dayName} ที่ ${formattedDate}`;
  }
}

export default Dashboard;