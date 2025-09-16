// src/pages/Stock.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import Cookies from "js-cookie";

export default function Stock() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
  const [userPermissionId] = useState(authData?.userPermissionId || []);

  const refreshData = () => setRefreshKey((prev) => prev + 1);

  // 👉 ถ้าหน้าถูกกลับมาพร้อม state.shouldRefresh = true ให้รีเฟรชแล้วเคลียร์ state
  useEffect(() => {
    if (location.state?.shouldRefresh) {
      refreshData();
      navigate("/stock", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setIsLoading(true);
    api.post("/cost/GetStockCostRequest", {})
      .then(res => {
        const mappedData = res.data.map(item => ({
          costID: item.costID,
          costDate: item.costDate,
          costStatus: item.costStatus.description,
          costStatusID : item.costStatusID 
        }));
        setOrders(mappedData);
      })
      .catch(error => {
        console.error("Error fetching stock data:", error);
      })
      .finally(() => setIsLoading(false));
    setIsLoading(false);
  }, [refreshKey]);

  const openCheckStock = (orderId) => {
    navigate(`/checkstock/${orderId}`);
  };
  const openStockIn = (orderId) => {
    navigate(`/stockin/${orderId}`);
  };

  return (
    <div className="p-2 md:p-4 space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-base-200 p-4 rounded-lg shadow">
        <h1 className="text-xl font-bold">ระบบจัดการคลัง</h1>
        
        {/* ✅ แก้ไขให้ปุ่มแยกซ้าย-ขวา */}
        <div className="flex justify-between items-center gap-2 w-full sm:w-auto">
          {/* ปุ่มซ้าย */}
          <button
            className="btn btn-primary text-lg"
            onClick={() => navigate("/checkstock/new")}
            title="สร้างรายการนับสต็อกใหม่"
          >
            📝 สร้างรายการนับสต็อกใหม่
          </button>
          
          {/* ปุ่มขวา */}
          <button
            className="btn btn-warning"
            onClick={() => navigate("/stockitem")}
            title="ดูรายการสินค้าในคลัง"
          >
            ⚙️ <span className="hidden md:inline">ดูรายการคลัง</span>
          </button>
        </div>
      </div>

      {/* Card: หัวใบสั่งซื้อ/ขอเบิก */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-3 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="card-title text-base md:text-lg">หัวใบสั่งซื้อ/ขอเบิก</h2>
            <span className="badge badge-primary text-xs md:text-sm">{orders.length} ใบ</span>
          </div>

          {/* Desktop Table View (≥768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-sm lg:text-base">เลขที่ใบสั่ง</th>
                  <th className="text-sm lg:text-base">วันที่สั่งซื้อ</th>
                  <th className="text-sm lg:text-base">สถานะ</th>
                  <th className="text-right text-sm lg:text-base">เปิดรายการ</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading &&
                  orders.map((o) => (
                    <tr key={o.costID} className="hover:bg-base-200">
                      <td className="font-medium text-right text-sm lg:text-base">{o.costID}</td>
                      <td className="text-sm lg:text-base">
                        <div className="w-max">{o.costDate}</div>
                      </td>
                      <td>
                        <div className="badge badge-outline text-xs lg:text-sm">{o.costStatus}</div>
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-sm lg:btn-md btn-warning text-xs lg:text-sm"
                            onClick={() => openCheckStock(o.costID)}
                            disabled={o.costStatusID !== 1}
                            title="แก้ไขรายการ"
                          >
                            แก้ไข
                          </button>
                          {userPermissionId !== 3 && (
                            <button
                              className="btn btn-sm lg:btn-md btn-primary text-xs lg:text-sm"
                              onClick={() => openStockIn(o.costID)}
                              title="นำเข้าสินค้า"
                            >
                              นำเข้า
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {isLoading && (
                  <tr>
                    <td colSpan="4" className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <span className="loading loading-dots loading-sm"></span>
                        <span className="text-sm">กำลังโหลด...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && orders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-base-content/60 py-8">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🤷‍♂️</span>
                        <span className="text-sm">ยังไม่มีหัวใบสั่งซื้อ</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px) */}
          <div className="md:hidden space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <span className="loading loading-dots loading-sm"></span>
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            )}
            
            {!isLoading && orders.length === 0 && (
              <div className="text-center text-base-content/60 py-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🤷‍♂️</span>
                  <span className="text-sm">ยังไม่มีหัวใบสั่งซื้อ</span>
                </div>
              </div>
            )}

            {!isLoading &&
              orders.map((o) => (
                <div key={o.costID} className="border border-base-300 rounded-lg p-3 bg-base-50 shadow-sm">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm text-base-content/70">เลขที่ใบสั่ง</div>
                      <div className="font-bold text-base text-primary">{o.costID}</div>
                    </div>
                    <div className="badge badge-outline text-xs">{o.costStatus}</div>
                  </div>

                  {/* Date Row */}
                  <div className="mb-3">
                    <div className="text-sm text-base-content/70">วันที่สั่งซื้อ</div>
                    <div className="text-sm font-medium">{o.costDate}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-warning flex-1 text-xs whitespace-nowrap"
                      onClick={() => openCheckStock(o.costID)}
                      disabled={o.costStatusID !== 1}
                      title="แก้ไขรายการ"
                    >
                      ✏️ แก้ไข
                    </button>
                    {userPermissionId !== 3 && (
                      <button
                        className="btn btn-sm btn-primary flex-1 text-xs whitespace-nowrap"
                        onClick={() => openStockIn(o.costID)}
                        title="นำเข้าสินค้า"
                      >
                        📦 นำเข้า
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <div className="card-actions justify-end mt-4">{/* reserved */}</div>
        </div>
      </div>
    </div>
  );
}
