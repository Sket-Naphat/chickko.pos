import ThemeToggle from "../components/ThemeToggle";
import NewCostModal from "../components/Cost/NewCostModal";
import { useState, useEffect } from "react";
import { api } from "../lib/api";

/**
 * ฟังก์ชัน React Component สำหรับดึงและแสดงรายการค่าใช้จ่ายคงค้างจาก API เส้นทาง /api/GetCostList
 * - หากกำลังโหลดข้อมูลจะแสดงข้อความ "กำลังโหลดข้อมูล..."
 * - หากไม่มีข้อมูลหรือข้อมูลว่างจะแสดงข้อความ "ไม่มีค่าใช้จ่ายคงค้าง"
 * - หากมีข้อมูลจะแสดงตารางรายละเอียดค่าใช้จ่ายแต่ละรายการ
 *
 * @returns {JSX.Element} องค์ประกอบ React ที่แสดงสถานะการโหลด, ข้อมูลว่าง หรือ ตารางข้อมูลค่าใช้จ่าย
 */

// ฟังก์ชัน Component สำหรับแสดงรายการค่าใช้จ่ายคงค้าง

function GetCostNoDischargeList() {
  // สร้าง state สำหรับข้อมูลและสถานะการโหลด
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลจาก API เมื่อ component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.post("/cost/GetAllCostList",{}); // ✅ path ตาม Controller
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
  }, []);

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
      <span>ตารางแสดงรายการค่าใช้จ่าย</span>
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
              <td>{item.costdate}</td>
              <td>{item.category}</td>
              <td>{item.costprice}</td>
              <td>{item.remark}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Cost() {
  const [setItems] = useState([]);

  const handleCreated = (data) => {
    // เดโม่: แทรกเข้า state ให้เห็นผลทันที
    setItems((prev) => [{ ...data }, ...prev]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4 px-4 py-4 md:px-8 md:py-8 lg:px-80 ">
      {/* แถบหัวเรื่อง + ปุ่มสลับธีม */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-info">
          บันทึกค่าใช้จ่าย
        </h1>

        <NewCostModal onCreated={handleCreated} />
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {GetCostNoDischargeList()}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* <div className="overflow-x-auto">{table()}</div> */}
        </div>
      </div>

      <div className="mockup-window bg-base-100 border border-base-300">
        <div className="grid place-content-center h-80">Hello!</div>
      </div>
    </div>
  );
}
