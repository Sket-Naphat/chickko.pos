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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-base-200 p-4 rounded-lg shadow">
        <h1 className="text-xl font-bold">ระบบจัดการคลัง</h1>
        <div className="flex gap-2">
          {/* <button className="btn btn-accent" onClick={refreshData}>
            รีเฟรช
          </button> */}
          {/* 👉 ปุ่มสร้างรายการเช็คสต๊อกใหม่ */}
          <button
            className="btn btn-primary"
            onClick={() => navigate("/checkstock/new")}
            title="สร้างรายการตรวจนับสต็อกใหม่"
          >
            สร้างรายการตรวจนับสต็อกใหม่
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/stockitem")}
            title="ดูรายการสินค้าในคลัง"
          >
            รายการคลัง
          </button>
        </div>
      </div>

      {/* Card: เฉพาะหัวใบสั่งซื้อ */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">หัวใบสั่งซื้อ/ขอเบิก</h2>
            <span className="badge">{orders.length} ใบ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>เลขที่ใบสั่ง</th>
                  <th>วันที่สั่งซื้อ</th>
                  <th>สถานะ</th>
                  <th className="text-right">เปิดรายการ</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading &&
                  orders.map((o) => (
                    <tr key={o.costID}>
                      <td className="font-medium text-right">{o.costID}</td>
                      <td>
                        <div className="w-max">{o.costDate}</div>
                      </td>
                      <td>
                        <div className="badge badge-outline w-max">{o.costStatus}</div>
                      </td>
                      <td className="text-right inline-flex gap-2">
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => openCheckStock(o.costID)}
                          disabled={o.costStatusID !== 1} // ปุ่มจะไม่ทำงานถ้าไม่ใช่สถานะ "รออนุมัติ"

                        >
                          แก้ไข
                        </button>
                        {userPermissionId !== 3 && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => openStockIn(o.costID)}
                            >
                              นำเข้า
                            </button>
                          </>
                        )}

                      </td>

                    </tr>
                  ))}
                {isLoading && (
                  <tr>
                    <td colSpan="4">
                      กำลังโหลด &nbsp;
                      <span className="loading loading-dots loading-sm"></span>
                    </td>
                  </tr>
                )}
                {!isLoading && orders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-base-content/60">
                      ยังไม่มีหัวใบสั่งซื้อ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card-actions justify-end">{/* reserved */}</div>
        </div>
      </div>
    </div>
  );
}
