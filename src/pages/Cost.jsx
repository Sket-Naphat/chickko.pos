import ThemeToggle from "../components/ThemeToggle";
import ModalNewCost from "../components/Cost/ModalNewCost";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import ModalConfirmPayment from "../components/Cost/ModalConfirmPayment";

/**
 * ฟังก์ชัน React Component สำหรับดึงและแสดงรายการค่าใช้จ่ายคงค้างจาก API เส้นทาง /api/GetCostList
 * - หากกำลังโหลดข้อมูลจะแสดงข้อความ "กำลังโหลดข้อมูล..."
 * - หากไม่มีข้อมูลหรือข้อมูลว่างจะแสดงข้อความ "ไม่มีค่าใช้จ่ายคงค้าง"
 * - หากมีข้อมูลจะแสดงตารางรายละเอียดค่าใช้จ่ายแต่ละรายการ
 *
 * @returns {JSX.Element} องค์ประกอบ React ที่แสดงสถานะการโหลด, ข้อมูลว่าง หรือ ตารางข้อมูลค่าใช้จ่าย
 */

// ฟังก์ชัน Component สำหรับแสดงรายการค่าใช้จ่ายคงค้าง

function GetCostNoPurchase({ refreshKey }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleConfirm = () => {
    setRefreshKey((prev) => prev + 1);
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
        console.error("โหลดรายการค่าใช้จ่ายไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]); // เปลี่ยนจาก [] เป็น [refreshKey]

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return <div className="p-4">กำลังโหลดข้อมูล...</div>;
  }

  // กรณีไม่มีข้อมูล
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        ไม่มีค่าใช้จ่ายคงค้าง
      </div>
    );
  }

  // แสดงตารางข้อมูล
  return (
    <div className="overflow-x-auto">

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th>วันที่</th>
            <th>หมวดหมู่</th>
            <th>ราคา</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id || idx}>
              <td><ModalConfirmPayment onConfirm={handleConfirm} item={item} /></td>
              <td>{idx + 1}</td>
              <td>{item.costDate}</td>
              <td>{item.costCategory.description}</td>
              <td>{item.costPrice}</td>
              <td>{item.costDescription}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GetCostIsPurchaseList({ refreshKey }) {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // แสดงข้อความขณะกำลังโหลด
  if (loading) {
    return <div className="p-4">กำลังโหลดข้อมูล...</div>;
  }

  // กรณีไม่มีข้อมูล
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        ไม่มีค่าใช้จ่ายคงค้าง
      </div>
    );
  }

  // แสดงตารางข้อมูล
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>วันที่</th>
            <th>หมวดหมู่</th>
            <th>ราคา</th>
            <th>หมายเหตุ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id || idx}>
              <td>{idx + 1}</td>
              <td>{item.costDate}</td>
              <td>{item.costCategory.description}</td>
              <td>{item.costPrice}</td>
              <td>{item.costDescription}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Cost() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    // เมื่อมีการสร้างรายการใหม่ ให้ดึงข้อมูลใหม่
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4 px-4 py-4 md:px-8 md:py-8 lg:px-80 ">
      {/* แถบหัวเรื่อง + ปุ่มสลับธีม */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-info">
          บันทึกค่าใช้จ่าย
        </h1>
        <ModalNewCost onCreated={handleCreated} />
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="badge badge-outline badge-error">รายการค่าใช้จ่ายที่ยังไม่ชำระเงิน</div>
          <GetCostNoPurchase refreshKey={refreshKey} /> {/* เปลี่ยนจาก key เป็น prop */}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="badge badge-outline badge-success">รายการค่าใช้จ่ายที่ชำระเงินแล้ว</div>
          <GetCostIsPurchaseList refreshKey={refreshKey} /> {/* เปลี่ยนจาก key เป็น prop */}
        </div>
      </div>
    </div>
  );
}
