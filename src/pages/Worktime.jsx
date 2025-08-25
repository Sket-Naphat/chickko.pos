import React, { useState } from "react";

// Mockup ข้อมูลพนักงานในเดือนปัจจุบัน (สิงหาคม 2025)
const worktimeData = [
  { date: "2025-08-22", in: "08:25", out: "17:35", wage: 520, name: "สมชาย" },
  { date: "2025-08-22", in: "08:40", out: "17:20", wage: 500, name: "สมหญิง" },
  { date: "2025-08-22", in: "09:00", out: "17:00", wage: 480, name: "แวเ" },
  { date: "2025-08-21", in: "08:30", out: "17:30", wage: 520, name: "สมชาย" },
  { date: "2025-08-21", in: "08:45", out: "17:15", wage: 500, name: "สมหญิง" },
  { date: "2025-08-21", in: "09:05", out: "17:05", wage: 480, name: "แวเ" },
  { date: "2025-08-20", in: "08:35", out: "17:25", wage: 520, name: "สมชาย" },
  { date: "2025-08-20", in: "08:50", out: "17:10", wage: 500, name: "สมหญิง" },
  { date: "2025-08-20", in: "09:10", out: "17:10", wage: 480, name: "แวเ" },
];

function formatDateThai(dateStr) {
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function WorkTime() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  // สร้างรายการเดือนย้อนหลัง 12 เดือน
  const monthsList = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${d.getFullYear()} ${formatDateThai(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`).split(" ")[1]}`
    };
  });

  // กรองข้อมูลตามเดือนที่เลือก
  const filteredData = worktimeData.filter((item) =>
    item.date.startsWith(selectedMonth)
  );

  // แบ่งกลุ่มข้อมูลตามวันที่
  const groupedByDate = filteredData.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-base-200 p-2 sm:p-4">
      <div className="w-full max-w-2xl mx-auto bg-base-100 rounded-xl shadow-md p-2 sm:p-4">
        <h1 className="text-xl font-bold mb-4 text-center">Work Time Management</h1>
        {/* เลือกเดือน */}
        <div className="mb-4 flex justify-center">
          <select
            className="select select-bordered"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        {/* ประวัติการเข้าออกงานแบบ Card view */}
        <div>
          <h2 className="text-lg font-semibold mb-2">ประวัติการเข้าออกงาน</h2>
  <div className="grid gap-4 grid-cols-1">
            {Object.keys(groupedByDate).length > 0 ? (
              Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)).map((date) => (
                <div
                  key={date}
                  className="bg-white rounded-lg shadow p-2 sm:p-4 flex flex-col h-full w-full md:w-full"
                  style={{ minWidth: 0 }}
                >
                  <div className="font-bold text-base mb-2 text-black">วันที่ {formatDateThai(date)}</div>
                  <div className="divide-y">
                    {groupedByDate[date].map((item, idx) => (
                      <div
                        key={item.name + item.in + item.out + idx}
                        className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="flex-1 min-w-[80px]">
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <div className="flex-1 min-w-[80px]">เข้า: <span className="text-green-700 font-mono">{item.in}</span></div>
                        <div className="flex-1 min-w-[80px]">ออก: <span className="text-red-700 font-mono">{item.out}</span></div>
                        <div className="flex-1 min-w-[80px]">ค่าแรง: <span className="text-blue-700 font-bold">{item.wage} บาท</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">ไม่มีข้อมูล</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkTime;
