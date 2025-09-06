// ฟังก์ชันแปลงจำนวนชั่วโมงทศนิยมเป็น ชั่วโมง นาที
function formatWorktime(val) {
  const hours = Math.floor(val);                          // ชั่วโมงเต็ม
  const minutes = Math.round((val - hours) * 60);         // ส่วนทศนิยม * 60 = นาที
  return `${hours} ชั่วโมง ${minutes} นาที`;
}

// ฟังก์ชันแปลงจำนวนเงินเป็นรูปแบบสกุลเงินบาท
function formatCurrency(val) {
  if (typeof val !== "number") return val;
  return val.toLocaleString("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 });
}

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '../lib/api';

// หน้านี้สำหรับพนักงาน (userPermissionId === 3) เท่านั้น
function StaffWorktime() {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const authData = React.useMemo(() => {
    const raw = Cookies.get("authData");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }, []);
  const EmployeeID = authData ? authData.userId : null;
  // สร้าง options เดือนตั้งแต่ ก.ย. 2025 ถึงปัจจุบัน
  const startYear = 2025, startMonth = 9;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  let monthOptions = [];
  for (let y = startYear; y <= currentYear; y++) {
    let mStart = (y === startYear) ? startMonth : 1;
    let mEnd = (y === currentYear) ? currentMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      monthOptions.push({
        value: `${y}-${String(m).padStart(2, '0')}`,
        label: `${y} - ${m}`,
        year: y,
        month: String(m).padStart(2, '0')
      });
    }
  }
  // month: string (เลขเดือน เช่น '09'), year: string
  const nowMonth = String(currentMonth).padStart(2, '0');
  const nowYear = String(currentYear);
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);

  React.useEffect(() => {
    if (!EmployeeID || !month || !year) return;
    setLoading(true);
    setError("");
    api.post('/worktime/GetWorkTimeHistoryByEmployeeID', {
      employeeID: EmployeeID,
      workMonth: month,
      workYear: year
    })
      .then(res => {
        const mapped = (res.data || []).map(item => ({
          workDate: item.workDate,
          timeClockIn: item.timeClockIn,
          timeClockOut: item.timeClockOut,
          totalWorktime: item.totalWorktime,
        }));
        setHistory(mapped.sort((a, b) => new Date(b.workDate) - new Date(a.workDate)));
      })
      .catch(err => {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
      })
      .finally(() => setLoading(false));
  }, [EmployeeID, month, year]);



  // ฟังก์ชันแปลงวันที่เป็นรูปแบบ "วันเสาร์ที่ 6 กันยายน 2025"
  function formatThaiDate(dateStr) {
    const days = [
      "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"
    ];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `วัน${dayName}ที่ ${day} ${monthName} ${year}`;
  }
  

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      <div className="w-full max-w-lg card bg-base-100 shadow-xl p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">ประวัติการเข้าออกงาน</h1>
        <section>
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 justify-center">
            <label className="font-semibold">เลือกเดือน:</label>
            <div className="dropdown w-full sm:w-auto">
              <label tabIndex={0} className="btn btn-sm btn-outline w-full sm:w-auto flex justify-between items-center">
                {(() => {
                  const months = [
                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                  ];
                  const monthLabel = months[parseInt(month, 10) - 1];
                  return `${monthLabel} ${year}`;
                })()}
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full sm:w-52 max-h-60 overflow-y-auto z-50">
                {monthOptions.map(opt => {
                  const months = [
                    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
                  ];
                  const monthLabel = months[parseInt(opt.month, 10) - 1];
                  return (
                    <li key={opt.value}>
                      <button
                        className={`w-full text-left ${month === opt.month && year === String(opt.year) ? 'bg-primary text-white' : ''}`}
                        onClick={() => {
                          setMonth(opt.month);
                          setYear(String(opt.year));
                        }}
                      >{`${monthLabel} ${opt.year}`}</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="mt-2 sm:ml-4">⏳ กำลังโหลดข้อมูล…</span>
            </div>
          ) : error ? (
            <div className="alert alert-error shadow-lg mb-4">
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">ไม่มีข้อมูล</div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="card bg-base-100 shadow-md p-3 flex flex-col gap-2">
                    <div>
                      <div className="font-bold text-base sm:text-lg text-primary mb-1">{formatThaiDate(item.workDate)}</div>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-base-content">
                        <div><span className="font-semibold">เข้า:</span> {item.timeClockIn || '-'}</div>
                        <div><span className="font-semibold">ออก:</span> {item.timeClockOut || '-'}</div>
                        <div><span className="font-semibold">รวม:</span> {item.totalWorktime ? formatWorktime(item.totalWorktime) : '-'}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
// หน้านี้สำหรับผู้จัดการ (userPermissionId !== 3) เท่านั้น
function ManagementWorktime() {
  // สร้าง options ช่วงเวลา 1-15, 16-สิ้นเดือน ตั้งแต่ ก.ย. 2025 ถึงเดือนปัจจุบัน
  const startYear = 2025, startMonth = 9;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  let periodOptions = [];
  for (let y = startYear; y <= currentYear; y++) {
    let mStart = (y === startYear) ? startMonth : 1;
    let mEnd = (y === currentYear) ? currentMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      const monthLabel = months[m - 1];
      const lastDay = new Date(y, m, 0).getDate();
      // ถ้าเป็นเดือน/ปีปัจจุบัน ให้แสดงเฉพาะช่วง 1-15 ถ้าวันที่ <= 15
      if (y === currentYear && m === currentMonth) {
        if (now.getDate() <= 15) {
          periodOptions.push({
            value: `${y}-${String(m).padStart(2, '0')}-1-15`,
            label: `1-15 ${monthLabel} ${y}`
          });
        } else {
          periodOptions.push({
            value: `${y}-${String(m).padStart(2, '0')}-1-15`,
            label: `1-15 ${monthLabel} ${y}`
          });
          periodOptions.push({
            value: `${y}-${String(m).padStart(2, '0')}-16-${lastDay}`,
            label: `16-${lastDay} ${monthLabel} ${y}`
          });
        }
      } else {
        periodOptions.push({
          value: `${y}-${String(m).padStart(2, '0')}-1-15`,
          label: `1-15 ${monthLabel} ${y}`
        });
        periodOptions.push({
          value: `${y}-${String(m).padStart(2, '0')}-16-${lastDay}`,
          label: `16-${lastDay} ${monthLabel} ${y}`
        });
      }
    }
  }
  // filterType: "halfmonth" | "daily"
  const [filterType, setFilterType] = React.useState("halfmonth");
  // สำหรับรายวัน
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // yyyy-MM-dd
  });
  // default เป็นช่วงล่าสุด
  const [period, setPeriod] = React.useState(periodOptions[periodOptions.length - 1].value);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState([]);

  // ดึงข้อมูลเมื่อ filterType หรือ period/date เปลี่ยน
  React.useEffect(() => {
    setLoading(true);
    setError("");
    if (filterType === "halfmonth") {
      if (!period) return setLoading(false);
      const [year, month, startDay, endDay] = period.split('-');
      api.post('/worktime/GetWorkTimeHistoryByPeriod', {
        workYear: year,
        workMonth: month,
        startDate: startDay,
        endDate: endDay
      })
        .then(res => {
          setData(res.data || []);
        })
        .catch(err => {
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
        })
        .finally(() => setLoading(false));
    } else if (filterType === "daily") {
      if (!selectedDate) return setLoading(false);
      const d = new Date(selectedDate);
      const year = String(d.getFullYear());
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      api.post('/worktime/GetWorkTimeHistoryByPeriod', {
        workYear: year,
        workMonth: month,
        startDate: day,
        endDate: day
      })
        .then(res => {
          setData(res.data || []);
        })
        .catch(err => {
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
        })
        .finally(() => setLoading(false));
    }
  }, [filterType, period, selectedDate]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      <div className="w-full max-w-lg card bg-base-100 shadow-xl p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-4 text-center">จัดการเวลาทำงาน (Management)</h1>
        <section>
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 justify-center">
            <label className="font-semibold">ดูข้อมูลแบบ:</label>
            <div className="flex items-center gap-2">
              <span className="">ครั้งละครึ่งเดือน</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={filterType === "daily"}
                onChange={e => setFilterType(e.target.checked ? "daily" : "halfmonth")}
              />
              <span className="">รายวัน</span>
            </div>
          </div>
          {filterType === "halfmonth" && (
            <div className="mb-4 flex flex-col sm:flex-row items-left gap-2 justify-center">
              <label className="font-semibold ">เลือกช่วงเวลา:</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="select select-bordered select-md w-full sm:w-auto"
                >
                {periodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {filterType === "daily" && (
            <div className="mb-4 flex flex-col sm:flex-row items-left gap-2 justify-center">
              <label className="font-semibold">เลือกวัน:</label>
              <div className="calendar calendar-bordered w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="input input-bordered input-sm w-full sm:w-auto"
                  // ลบ max เพื่อให้เลือกวันปัจจุบันได้
                />
              </div>
            </div>
          )}
          <div className="mb-2 text-base-content/70 text-center">
            {filterType === "halfmonth"
              ? "เลือกช่วงเวลาเพื่อดูข้อมูลการทำงานของพนักงานแต่ละช่วง"
              : "เลือกวันเพื่อดูข้อมูลการทำงานของพนักงานในวันนั้น"}
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <span className="mt-2 sm:ml-4">⏳ กำลังโหลดข้อมูล…</span>
            </div>
          ) : error ? (
            <div className="alert alert-error shadow-lg mb-4">
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">ไม่มีข้อมูล</div>
              ) : (
                data.map((item, idx) => (
                  <div key={idx} className="card bg-base-100 shadow-md p-3 flex flex-col gap-2">
                    <div>
                      <div className="font-bold text-base sm:text-lg text-primary mb-1">{item.employeeName || '-'}</div>
                      <div className="flex flex-col gap-2 text-base-content">
                        <div>
                          <span className="font-semibold">รวมเวลาทำงานทั้งหมด:</span> {item.totalWorktime ? formatWorktime(item.totalWorktime) : '-'}
                        </div>
                        <div>
                          <span className="font-semibold">ค่าตอบแทน:</span> {item.wageCost ? formatCurrency(item.wageCost) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const Worktime = () => {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = Cookies.get("authData");
    if (raw) {
      try {
        setAuthData(JSON.parse(raw));
      } catch {
        setAuthData(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center">กำลังโหลดข้อมูลผู้ใช้งาน…</div>;
  }
  if (!authData || !authData.userId) {
    window.location.href = '/';
    return null;
  }
  if (authData.userPermissionId !== 3) {
    return <ManagementWorktime />;
  }
  return <StaffWorktime />;
};

export default Worktime;