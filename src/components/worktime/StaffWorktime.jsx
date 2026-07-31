import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '../../lib/api';

// ฟังก์ชันแปลงจำนวนชั่วโมงทศนิยมเป็น ชั่วโมง นาที
function formatWorktime(val) {
  const hours = Math.floor(val);                          // ชั่วโมงเต็ม
  const minutes = Math.round((val - hours) * 60);         // ส่วนทศนิยม * 60 = นาที
  return `${hours} ชั่วโมง ${minutes} นาที`;
}

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
          clockInLocation: item.clockInLocation,
          clockOutLocation: item.clockOutLocation
        }));
        setHistory(mapped.sort((a, b) => new Date(b.workDate) - new Date(a.workDate)));
      })
      .catch(err => {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
      })
      .finally(() => setLoading(false));
  }, [EmployeeID, month, year]);

  function formatThaiDate(dateStr) {
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${day} ${monthName}`;
  }
  const getGoogleMapsUrl = (clockInLocation) => {
    if (!clockInLocation) return null;

    var location = JSON.parse(clockInLocation);
    var latitude = location.latitude;
    var longitude = location.longitude;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      {/* ✅ ปรับขนาด container ให้กระชับ */}
      <div className="w-full max-w-lg card bg-base-100 shadow-xl p-3 sm:p-6">
        <h1 className="text-xl font-bold text-primary mb-4 text-center">ประวัติการเข้าออกงาน</h1>

        {/* ✅ แสดงชื่อพนักงานแบบกระชับ */}
        <div className="bg-primary/10 p-3 rounded-lg mb-4 flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span className="font-semibold text-primary">
            {authData?.name || 'ไม่ระบุชื่อ'}
          </span>
        </div>

        <section>
          {/* ✅ เลือกเดือนแบบกระชับ */}
          <div className="mb-4 flex items-center gap-2 justify-center">
            <label className="font-semibold text-sm">เดือน:</label>
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-sm btn-outline flex items-center gap-2">
                {(() => {
                  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                  const monthLabel = months[parseInt(month, 10) - 1];
                  return `${monthLabel} ${year}`;
                })()}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto z-50">
                {monthOptions.map(opt => {
                  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                  const monthLabel = months[parseInt(opt.month, 10) - 1];
                  return (
                    <li key={opt.value}>
                      <button
                        className={`w-full text-left text-sm ${month === opt.month && year === String(opt.year) ? 'bg-primary text-white' : ''}`}
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
              <span className="mt-2 text-sm">⏳ กำลังโหลดข้อมูล…</span>
            </div>
          ) : error ? (
            <div className="alert alert-error shadow-lg mb-4">
              <span>{error}</span>
            </div>
          ) : (
            /* ✅ แสดงข้อมูลแบบกระชับ */
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">ไม่มีข้อมูล</div>
              ) : (
                history.map((item, idx) => (
                  /* ✅ Card แบบกระชับ */
                  <div key={idx} className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-primary text-sm">
                        {formatThaiDate(item.workDate)}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {item.totalWorktime ? formatWorktime(item.totalWorktime) : '-'}
                      </div>
                    </div>

                    {/* ✅ เวลาเข้า-ออกแบบ inline */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-success">เข้างาน ⬇️</span>
                        <span>{item.timeClockIn || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-error">⬆️ ออกงาน</span>
                        <span>{item.timeClockOut || '-'}</span>
                      </div>
                    </div>
                    {/* ✅ ตำแหน่งเข้า-ออกงาน */}
                    <div className="flex justify-between text-sm">
                      <div>
                        {item.clockInLocation ? (
                          <button
                            className={`btn btn-xs btn-outline mt-2 ${(() => {
                              try {
                                const clockInData = JSON.parse(item.clockInLocation);
                                return clockInData.isWithinStoreRadius === false ? 'btn-error' : 'btn-primary';
                              } catch {
                                return 'btn-primary';
                              }
                            })()
                              }`}
                            onClick={() => window.open(getGoogleMapsUrl(item.clockInLocation), '_blank')}
                            title="ดูตำแหน่งในแผนที่"
                          >
                            📍 ดูตำแหน่ง
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 mt-2">-</span>
                        )}
                      </div>
                      <div>
                        {item.clockOutLocation ? (
                          <button
                            className={`btn btn-xs btn-outline mt-2 ${(() => {
                              try {
                                const clockOutData = JSON.parse(item.clockOutLocation);
                                return clockOutData.isWithinStoreRadius === false ? 'btn-error' : 'btn-primary';
                              } catch {
                                return 'btn-primary';
                              }
                            })()
                              }`}
                            onClick={() => window.open(getGoogleMapsUrl(item.clockOutLocation), '_blank')}
                            title="ดูตำแหน่งในแผนที่"
                          >
                            📍 ดูตำแหน่ง
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 mt-2">-</span>
                        )}
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

export default StaffWorktime;