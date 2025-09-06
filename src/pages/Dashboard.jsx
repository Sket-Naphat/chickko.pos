import { useState, useEffect } from "react";
import { api } from "../lib/api";

function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

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
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">📅 วันที่ขาย</th>
                      <th className="text-center">🧾 จำนวนบิล</th>
                      <th className="text-right">💰 ยอดขายรวม</th>
                      <th className="text-right">📊 ค่าเฉลี่ยต่อบิล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center text-base-content/60 py-8"
                        >
                          ไม่มีข้อมูลยอดขาย
                        </td>
                      </tr>
                    ) : (
                      salesData.map((item, index) => (
                        <tr key={index} className="hover">
                          <td className="text-center font-semibold">{index + 1}</td>
                          <td className="text-left">
                            {formatDateWithDay(item.saleDate)}
                          </td>
                          <td className="text-center">
                            <div className="badge badge-primary">{item.orders}</div>
                          </td>
                          <td className="text-right font-semibold text-success">
                            ฿{formatNumber(item.totalAmount)}
                          </td>
                          <td className="text-right text-info">
                            ฿{formatNumber(item.avgPerOrder)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {salesData.length > 0 && (
                    <tfoot>
                      <tr className="bg-base-200 font-bold">
                        <td colSpan="2" className="text-center">
                          📈 รวมทั้งหมด
                        </td>
                        <td className="text-center">
                          <div className="badge badge-secondary">
                            {salesData.reduce((sum, item) => sum + item.orders, 0)}
                          </div>
                        </td>
                        <td className="text-right text-success">
                          ฿{formatNumber(
                            salesData.reduce((sum, item) => sum + item.totalAmount, 0)
                          )}
                        </td>
                        <td className="text-right text-info">
                          ฿{formatNumber(
                            salesData.reduce((sum, item) => sum + item.totalAmount, 0) /
                              salesData.reduce((sum, item) => sum + item.orders, 0) || 0
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
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