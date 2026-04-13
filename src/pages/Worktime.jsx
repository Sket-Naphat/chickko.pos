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
import StaffWorktime from '../components/workTime/StaffWorktime';
import ModalCreateWorktime from '../components/workTime/ModalCreateWorktime';
import Toast from '../components/ui/Toast';

// ✅  EmployeeDetailWorktime
function EmployeeDetailWorktime({ employee, onBack }) {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // ✅ เพิ่ม state สำหรับ edit time modal
  const [editTimeModal, setEditTimeClockInModal] = React.useState({
    isOpen: false,
    workDate: '',
    currentTimeClockIn: '',
    newTimeClockIn: '',
    employeeID: null
  });

  // ✅ เพิ่ม state สำหรับ edit time clock out modal
  const [editTimeClockOutModal, setEditTimeClockOutModal] = React.useState({
    isOpen: false,
    workDate: '',
    currentTimeClockOut: '',
    newTimeClockOut: '',
    employeeID: null
  });

  const [editLoading, setEditLoading] = React.useState(false);

  // ✅ ดึงข้อมูล authData เพื่อตรวจสอบสิทธิ์
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

  // สร้าง options เดือนเหมือน StaffWorktime
  const startYear = 2025, startMonth = 9;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthOptions = React.useMemo(() => {
    let options = [];
    for (let y = startYear; y <= currentYear; y++) {
      let mStart = (y === startYear) ? startMonth : 1;
      let mEnd = (y === currentYear) ? currentMonth : 12;
      for (let m = mStart; m <= mEnd; m++) {
        options.push({
          value: `${y}-${String(m).padStart(2, '0')}`,
          label: `${y} - ${m}`,
          year: y,
          month: String(m).padStart(2, '0')
        });
      }
    }
    return options;
  }, [currentYear, currentMonth]);

  const nowMonth = String(currentMonth).padStart(2, '0');
  const nowYear = String(currentYear);
  const [month, setMonth] = React.useState(nowMonth);
  const [year, setYear] = React.useState(nowYear);

  const employeeID = React.useMemo(() => employee?.employeeID, [employee?.employeeID]);

  React.useEffect(() => {
    if (!employeeID || !month || !year) return;

    setLoading(true);
    setError("");

    api.post('/worktime/GetWorkTimeHistoryByEmployeeID', {
      employeeID: employeeID,
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
  }, [employeeID, month, year]);

  const formatThaiDate = React.useCallback((dateStr) => {
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${day} ${monthName}`;
  }, []);

  const getGoogleMapsUrl = (clockInLocation) => {
    if (!clockInLocation) return null;

    var location = JSON.parse(clockInLocation);
    var latitude = location.latitude;
    var longitude = location.longitude;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  // ✅ ฟังก์ชันเปิด modal แก้ไขเวลาเข้างาน
  const openEditTimeClockInModal = (item) => {
    setEditTimeClockInModal({
      isOpen: true,
      workDate: item.workDate,
      currentTimeClockIn: item.timeClockIn || '',
      newTimeClockIn: item.timeClockIn || '',
      employeeID: employeeID
    });
  };

  // ✅ ฟังก์ชันปิด modal
  const closeEditTimeModal = () => {
    setEditTimeClockInModal({
      isOpen: false,
      workDate: '',
      currentTimeClockIn: '',
      newTimeClockIn: '',
      employeeID: null
    });
  };

  // ✅ ฟังก์ชันบันทึกการแก้ไขเวลา
  const saveClockInEditTime = async () => {
    if (!editTimeModal.newTimeClockIn || !editTimeModal.workDate || !editTimeModal.employeeID) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setEditLoading(true);
    try {
      await api.post('/worktime/UpdateTimeClockIn', {
        employeeID: editTimeModal.employeeID,
        workDate: editTimeModal.workDate,
        TimeClockIn: editTimeModal.newTimeClockIn,
        CreatedBy: authData?.userId
      });

      alert('✅ แก้ไขเวลาเข้างานเรียบร้อยแล้ว');
      closeEditTimeModal();

      // ✅ แทนที่ window.location.reload() ด้วยการดึงข้อมูลใหม่
      // รีเฟรชข้อมูลโดยไม่กลับหน้าหลัก
      const res = await api.post('/worktime/GetWorkTimeHistoryByEmployeeID', {
        employeeID: employeeID,
        workMonth: month,
        workYear: year
      });
      
      const mapped = (res.data || []).map(item => ({
        workDate: item.workDate,
        timeClockIn: item.timeClockIn,
        timeClockOut: item.timeClockOut,
        totalWorktime: item.totalWorktime,
        clockInLocation: item.clockInLocation,
        clockOutLocation: item.clockOutLocation
      }));
      
      setHistory(mapped.sort((a, b) => new Date(b.workDate) - new Date(a.workDate)));

    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถแก้ไขเวลาได้'));
    } finally {
      setEditLoading(false);
    }
  };

  // ✅ ฟังก์ชันเปิด modal แก้ไขเวลาออกงาน
  const openEditTimeClockOutModal = (item) => {
    setEditTimeClockOutModal({
      isOpen: true,
      workDate: item.workDate,
      currentTimeClockOut: item.timeClockOut || '',
      newTimeClockOut: item.timeClockOut || '',
      employeeID: employeeID
    });
  };

  // ✅ ฟังก์ชันปิด modal แก้ไขเวลาออกงาน
  const closeEditTimeClockOutModal = () => {
    setEditTimeClockOutModal({
      isOpen: false,
      workDate: '',
      currentTimeClockOut: '',
      newTimeClockOut: '',
      employeeID: null
    });
  };

  // ✅ ฟังก์ชันบันทึกการแก้ไขเวลาออกงาน
  const saveClockOutEditTime = async () => {
    if (!editTimeClockOutModal.newTimeClockOut || !editTimeClockOutModal.workDate || !editTimeClockOutModal.employeeID) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setEditLoading(true);
    try {
      await api.post('/worktime/UpdateTimeClockOut', {
        employeeID: editTimeClockOutModal.employeeID,
        workDate: editTimeClockOutModal.workDate,
        TimeClockOut: editTimeClockOutModal.newTimeClockOut,
        CreatedBy: authData?.userId
      });

      alert('✅ แก้ไขเวลาออกงานเรียบร้อยแล้ว');
      closeEditTimeClockOutModal();

      // ✅ แทนที่ window.location.reload() ด้วยการดึงข้อมูลใหม่
      // รีเฟรชข้อมูลโดยไม่กลับหน้าหลัก
      const res = await api.post('/worktime/GetWorkTimeHistoryByEmployeeID', {
        employeeID: employeeID,
        workMonth: month,
        workYear: year
      });
      
      const mapped = (res.data || []).map(item => ({
        workDate: item.workDate,
        timeClockIn: item.timeClockIn,
        timeClockOut: item.timeClockOut,
        totalWorktime: item.totalWorktime,
        clockInLocation: item.clockInLocation,
        clockOutLocation: item.clockOutLocation
      }));
      
      setHistory(mapped.sort((a, b) => new Date(b.workDate) - new Date(a.workDate)));

    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถแก้ไขเวลาได้'));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      {/* ✅ ปรับขนาด container ให้กระชับ */}
      <div className="w-full max-w-lg card bg-base-100 shadow-xl p-3 sm:p-6">
        {/* ✅ Header แบบกระชับ */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="btn btn-sm btn-circle btn-outline"
            title="กลับ"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-primary">
            ประวัติการเข้าออกงาน
          </h1>
        </div>

        {/* ✅ แสดงชื่อพนักงานแบบกระชับ */}
        <div className="bg-primary/10 p-3 rounded-lg mb-4 flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span className="font-semibold text-primary">
            {employee?.employeeName || 'ไม่ระบุชื่อ'}
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
            /* ✅ แสดงข้อมูลแบบกระชับเหมือน StaffWorktime */
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">ไม่มีข้อมูล</div>
              ) : (
                history.map((item, idx) => {
                  // ✅ ตรวจสอบตำแหน่งนอกพื้นที่ร้าน
                  let isOutsideStore = false;
                  let outsideMessages = [];

                  // ตรวจสอบตำแหน่งเข้างาน
                  if (item.clockInLocation) {
                    try {
                      const clockInData = JSON.parse(item.clockInLocation);
                      if (clockInData.isWithinStoreRadius === false) {
                        isOutsideStore = true;
                        outsideMessages.push('เข้างาน');
                      }
                    } catch (e) {
                      console.error('Error parsing clockInLocation:', e);
                    }
                  }

                  // ตรวจสอบตำแหน่งออกงาน
                  if (item.clockOutLocation) {
                    try {
                      const clockOutData = JSON.parse(item.clockOutLocation);
                      if (clockOutData.isWithinStoreRadius === false) {
                        isOutsideStore = true;
                        outsideMessages.push('ออกงาน');
                      }
                    } catch (e) {
                      console.error('Error parsing clockOutLocation:', e);
                    }
                  }

                  return (
                    /* ✅ Card แบบกระชับ - เปลี่ยนสีเมื่อนอกพื้นที่ */
                    <div key={idx} className={`${isOutsideStore
                      ? 'bg-error/10 border-error/30 border-2'
                      : 'bg-base-100 border-base-300 border'
                      } rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow`}>

                      {/* ✅ แสดงข้อความเตือนเมื่อนอกพื้นที่ */}
                      {isOutsideStore && (
                        <div className="bg-error/20 border border-error/40 rounded-lg p-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-error text-lg">⚠️</span>
                            <div>
                              <div className="font-semibold text-error text-sm">
                                มีการกด{outsideMessages.join(' และ ')}นอกพื้นที่ร้าน
                              </div>
                              <div className="text-xs text-error/70">
                                โปรดตรวจสอบตำแหน่งในแผนที่
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                        <div className={`font-semibold text-sm ${isOutsideStore ? 'text-error' : 'text-primary'
                          }`}>
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
                          {/* ✅ แสดงปุ่มแก้ไขเฉพาะ Admin (userPermissionId === 1) */}
                          {authData?.userPermissionId === 1 && (
                            <button
                              className="btn btn-xs btn-ghost btn-outline"
                              title='แก้ไขเวลาเข้างาน'
                              onClick={() => openEditTimeClockInModal(item)}
                            >
                              📋
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-error">ออกงาน ⬆️</span>
                          <span>{item.timeClockOut || '-'}</span>
                          {/* ✅ แสดงปุ่มแก้ไขเฉพาะ Admin (userPermissionId === 1) */}
                          {authData?.userPermissionId === 1 && (
                            <button
                              className="btn btn-xs btn-ghost btn-outline"
                              title='แก้ไขเวลาออกงาน'
                              onClick={() => openEditTimeClockOutModal(item)}
                            >
                              📋
                            </button>
                          )}
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
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      {/* ✅ Modal แก้ไขเวลาเข้างาน */}
      {editTimeModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">📋 แก้ไขเวลาเข้างาน</h3>

            {/* ✅ ข้อมูลพนักงาน */}
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <div className="font-semibold text-primary">
                👤 {employee?.employeeName || 'ไม่ระบุชื่อ'}
              </div>
              <div className="text-sm text-base-content/70">
                📅 {formatThaiDate(editTimeModal.workDate)}
              </div>
            </div>

            {/* ✅ เวลาเข้างานปัจจุบัน */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">เวลาเข้างานปัจจุบัน</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {editTimeModal.currentTimeClockIn || 'ไม่มีข้อมูล'}
                </div>
              </div>
            </div>

            {/* ✅ เวลาเข้างานใหม่ */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">⏰ เวลาเข้างานใหม่</span>
              </label>

              {/* ✅ Custom 24-hour time input */}
              <div className="flex gap-2 items-center">
                {/* ชั่วโมง */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">ชั่วโมง</label>
                  <select
                    value={editTimeModal.newTimeClockIn ? editTimeModal.newTimeClockIn.split(':')[0] : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeModal.newTimeClockIn || '00:00:00';
                      const [, minutes, seconds] = currentTime.split(':');
                      const newTime = `${e.target.value}:${minutes || '00'}:${seconds || '00'}`;
                      setEditTimeClockInModal(prev => ({
                        ...prev,
                        newTimeClockIn: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold text-base-content/50 mt-6">:</span>

                {/* นาที */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">นาที</label>
                  <select
                    value={editTimeModal.newTimeClockIn ? editTimeModal.newTimeClockIn.split(':')[1] : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeModal.newTimeClockIn || '00:00:00';
                      const [hours, , seconds] = currentTime.split(':');
                      const newTime = `${hours || '00'}:${e.target.value}:${seconds || '00'}`;
                      setEditTimeClockInModal(prev => ({
                        ...prev,
                        newTimeClockIn: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold text-base-content/50 mt-6">:</span>

                {/* วินาที */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">วินาที</label>
                  <select
                    value={editTimeModal.newTimeClockIn ? editTimeModal.newTimeClockIn.split(':')[2] || '00' : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeModal.newTimeClockIn || '00:00:00';
                      const [hours, minutes] = currentTime.split(':');
                      const newTime = `${hours || '00'}:${minutes || '00'}:${e.target.value}`;
                      setEditTimeClockInModal(prev => ({
                        ...prev,
                        newTimeClockIn: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ แสดงเวลาที่เลือก */}
              <div className="mt-3 p-2 bg-base-200 rounded-lg text-center">
                <div className="text-sm text-base-content/70">เวลาที่เลือก:</div>
                <div className="text-lg font-bold text-primary font-mono">
                  {editTimeModal.newTimeClockIn || '00:00:00'}
                </div>
              </div>
            </div>

            {/* ✅ ปุ่มการกระทำ */}
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={closeEditTimeModal}
                disabled={editLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={saveClockInEditTime}
                disabled={editLoading || !editTimeModal.newTimeClockIn}
              >
                {editLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    💾 บันทึกการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal แก้ไขเวลาออกงาน */}
      {editTimeClockOutModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">📋 แก้ไขเวลาออกงาน</h3>

            {/* ✅ ข้อมูลพนักงาน */}
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <div className="font-semibold text-primary">
                👤 {employee?.employeeName || 'ไม่ระบุชื่อ'}
              </div>
              <div className="text-sm text-base-content/70">
                📅 {formatThaiDate(editTimeClockOutModal.workDate)}
              </div>
            </div>

            {/* ✅ เวลาออกงานปัจจุบัน */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">เวลาออกงานปัจจุบัน</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {editTimeClockOutModal.currentTimeClockOut || 'ไม่มีข้อมูล'}
                </div>
              </div>
            </div>

            {/* ✅ เวลาออกงานใหม่ */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">⏰ เวลาออกงานใหม่</span>
              </label>

              {/* ✅ Custom 24-hour time input */}
              <div className="flex gap-2 items-center">
                {/* ชั่วโมง */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">ชั่วโมง</label>
                  <select
                    value={editTimeClockOutModal.newTimeClockOut ? editTimeClockOutModal.newTimeClockOut.split(':')[0] : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeClockOutModal.newTimeClockOut || '00:00:00';
                      const [, minutes, seconds] = currentTime.split(':');
                      const newTime = `${e.target.value}:${minutes || '00'}:${seconds || '00'}`;
                      setEditTimeClockOutModal(prev => ({
                        ...prev,
                        newTimeClockOut: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold text-base-content/50 mt-6">:</span>

                {/* นาที */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">นาที</label>
                  <select
                    value={editTimeClockOutModal.newTimeClockOut ? editTimeClockOutModal.newTimeClockOut.split(':')[1] : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeClockOutModal.newTimeClockOut || '00:00:00';
                      const [hours, , seconds] = currentTime.split(':');
                      const newTime = `${hours || '00'}:${e.target.value}:${seconds || '00'}`;
                      setEditTimeClockOutModal(prev => ({
                        ...prev,
                        newTimeClockOut: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-2xl font-bold text-base-content/50 mt-6">:</span>

                {/* วินาที */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-base-content/70 mb-1">วินาที</label>
                  <select
                    value={editTimeClockOutModal.newTimeClockOut ? editTimeClockOutModal.newTimeClockOut.split(':')[2] || '00' : '00'}
                    onChange={(e) => {
                      const currentTime = editTimeClockOutModal.newTimeClockOut || '00:00:00';
                      const [hours, minutes] = currentTime.split(':');
                      const newTime = `${hours || '00'}:${minutes || '00'}:${e.target.value}`;
                      setEditTimeClockOutModal(prev => ({
                        ...prev,
                        newTimeClockOut: newTime
                      }));
                    }}
                    className="select select-bordered select-sm w-20"
                    disabled={editLoading}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ แสดงเวลาที่เลือก */}
              <div className="mt-3 p-2 bg-base-200 rounded-lg text-center">
                <div className="text-sm text-base-content/70">เวลาที่เลือก:</div>
                <div className="text-lg font-bold text-primary font-mono">
                  {editTimeClockOutModal.newTimeClockOut || '00:00:00'}
                </div>
              </div>
            </div>

            {/* ✅ ปุ่มการกระทำ */}
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={closeEditTimeClockOutModal}
                disabled={editLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={saveClockOutEditTime}
                disabled={editLoading || !editTimeClockOutModal.newTimeClockOut}
              >
                {editLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    💾 บันทึกการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// หน้านี้สำหรับผู้จัดการ (userPermissionId !== 3) เท่านั้น
function ManagementWorktime() {
  // ✅ ALL HOOKS AT THE TOP
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
  const toastTimer = React.useRef(null);
  const showToast = React.useCallback((message, type = 'success', duration = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), duration);
  }, []);

  const [dateFrom, setDateFrom] = React.useState(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (currentDay <= 15) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    } else {
      return `${year}-${String(month).padStart(2, '0')}-16`;
    }
  });

  const [dateTo, setDateTo] = React.useState(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (currentDay <= 15) {
      return `${year}-${String(month).padStart(2, '0')}-15`;
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
  });

  const [filterType, setFilterType] = React.useState("period");

  const [selectedDate, setSelectedDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState([]);
  const [paidWorktimes, setPaidWorktimes] = React.useState([]);

  // ✅ MOVED THESE HOOKS TO THE TOP
  const [paymentModal, setPaymentModal] = React.useState({
    isOpen: false,
    employee: null,
    worktime: 0,
    wageCost: 0,
    dateFrom: '',
    dateTo: ''
  });
  const [paymentLoading, setPaymentLoading] = React.useState(false);

  // ✅ เพิ่ม state สำหรับ confirm modal
  const [confirmModal, setConfirmModal] = React.useState({
    isOpen: false,
    title: '',
    content: null,
    resolve: null
  });

  // ✅ useMemo and useEffect are also hooks - keep them after useState
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

  React.useEffect(() => {
    if (selectedEmployee) return;

    setLoading(true);
    setError("");

    if (filterType === "period") {
      if (!dateFrom || !dateTo) {
        setLoading(false);
        return;
      }


      const startDay = dateFrom
      const endDay = dateTo

      api.post('/worktime/GetWorkTimeHistoryByPeriod', {
        StartDate: startDay,
        EndDate: endDay
      })
        .then(res => {
          setData(res.data || []);
        })
        .catch(err => {
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
        })
        .finally(() => setLoading(false));

    } else if (filterType === "daily") {
      if (!selectedDate) {
        setLoading(false);
        return;
      }



      api.post('/worktime/GetWorkTimeHistoryByPeriod', {
        startDate: selectedDate,
        endDate: selectedDate
      })
        .then(res => {
          setData(res.data || []);
        })
        .catch(err => {
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล " + (err.message || ""));
        })
        .finally(() => setLoading(false));
    }
  }, [filterType, dateFrom, dateTo, selectedDate, selectedEmployee]);

  // ✅ Define helper functions after hooks
  // Removed duplicate openPaymentModal declaration to fix redeclaration error.

  // ✅ Helper function for Thai date formatting (short format)
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

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      employee: null,
      worktime: 0,
      wageCost: 0,
      dateFrom: '',
      dateTo: ''
    });
  };

  // ✅ ฟังก์ชันจัดการ confirm modal
  const handleConfirm = () => {
    if (confirmModal.resolve) {
      confirmModal.resolve(true);
    }
    setConfirmModal({ isOpen: false, title: '', content: null, resolve: null });
  };

  const handleCancel = () => {
    if (confirmModal.resolve) {
      confirmModal.resolve(false);
    }
    setConfirmModal({ isOpen: false, title: '', content: null, resolve: null });
  };

  // ✅ ปรับปรุง confirmPayment ให้มี popup confirm
  const confirmPayment = async () => {
    if (!paymentModal.employee) return;

    // ✅ แสดง confirm dialog ก่อน
    const confirmed = await new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: '💳 ยืนยันการจ่ายเงิน',
        content: (
          <div>
            <div className="font-bold mb-3 text-center">
              ยืนยันการจ่ายเงินให้กับ
            </div>
            <div className="bg-primary/10 p-3 rounded-lg mb-4">
              <div className="font-bold text-primary text-lg text-center">
                👤 {paymentModal.employee.employeeName}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>วันที่ทำงาน:</span>
                <div className="font-semibold text-right max-w-xs">
                  {(() => {
                    const unpaidWorkDates = paidWorktimes
                      .filter(item =>
                        item.employeeID === paymentModal.employee.employeeID &&
                        !item.isPurchase &&
                        item.totalWorktime > 0
                      )
                      .map(item => formatThaiDate(item.workDate))
                      .join(', ');
                    return unpaidWorkDates || 'ไม่ระบุ';
                  })()}
                </div>
              </div>
              <div className="flex justify-between">
                <span>จำนวนชั่วโมง:</span>
                <span className="font-semibold text-primary">{formatWorktime(paymentModal.worktime)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>ค่าตอบแทน:</span>
                <span className="font-bold text-success text-lg">{formatCurrency(paymentModal.wageCost)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-warning/10 rounded-lg text-center">
              <div className="text-warning font-semibold">⚠️ กรุณาตรวจสอบข้อมูลให้ถูกต้อง</div>
              <div className="text-sm text-base-content/70">การจ่ายเงินนี้จะไม่สามารถยกเลิกได้</div>
            </div>
          </div>
        ),
        resolve: resolve
      });
    });

    if (!confirmed) return;

    setPaymentLoading(true);
    try {
      // ตรวจสอบว่ามีการคำนวณ worktime และ wageCost หรือไม่
      if (paymentModal.worktime <= 0 || paymentModal.wageCost <= 0) {
        alert('ไม่สามารถจ่ายเงินได้: จำนวนชั่วโมงทำงานหรือค่าจ้างเป็นศูนย์');
        setPaymentLoading(false);
        return;
      }

      // ✅ สร้างรายการวันที่ที่ยังไม่จ่ายเงิน
      const unpaidWorkItems = paidWorktimes
        .filter(item =>
          item.employeeID === paymentModal.employee.employeeID &&
          !item.isPurchase &&
          item.totalWorktime > 0
        );

      // ✅ สร้าง array ของข้อมูลแต่ละวัน
      const workDateItems = unpaidWorkItems.map(item => ({
        EmployeeID: item.employeeID,
        WorkDate: item.workDate,
        TotalWorktime: item.totalWorktime,
        WageCost: item.wageCost, // ค่าจ้างต่อวัน
        PurchaseDate: new Date().toISOString().slice(0, 10),
        IsPurchase: true,
        Remark: (() => {
          // ✅ สร้าง Remark สำหรับกรณีจ่ายหลายวันในครั้งเดียว
          const purchaseDate = new Date().toISOString().slice(0, 10);
          const totalAmount = formatCurrency(paymentModal.wageCost);

          if (unpaidWorkItems.length === 1) {
            // จ่ายวันเดียว
            return `ค่าจ้างพนักงาน ${paymentModal.employee.employeeName} วัน ${formatThaiDate(item.workDate)} (${formatWorktime(item.totalWorktime)}) | จ่ายเมื่อ วัน ${formatThaiDate(purchaseDate)}`;
          } else {
            // จ่ายหลายวันในครั้งเดียว
            return `ค่าจ้างพนักงาน ${paymentModal.employee.employeeName} วัน ${formatThaiDate(item.workDate)} (${formatWorktime(item.totalWorktime)}) | จ่ายเมื่อ วัน ${formatThaiDate(purchaseDate)} | รวมอยู่ในยอด ${unpaidWorkItems.length} วัน รวม ${totalAmount} บาท`;
          }
        })(),
        CreatedBy: authData ? authData.userId : null
      }));

      // ✅ ส่งข้อมูลเป็น array ของแต่ละวัน
      await api.post('/cost/UpdateWageCost', workDateItems);
      // alert(JSON.stringify(data));
      // ✅ แสดง success message
      alert('✅ จ่ายเงินเรียบร้อยแล้ว!');
      closePaymentModal();
      window.location.reload();

    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถจ่ายเงินได้'));
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ ปรับปรุง openPaymentModal ให้ดึงข้อมูลจาก API
  const openPaymentModal = async (employee) => {
    // เปิด modal ก่อนโดยใช้ข้อมูลเดิม
    setPaymentModal({
      isOpen: true,
      employee: employee,
      worktime: employee.totalWorktime || 0,
      wageCost: employee.wageCost || 0,
      dateFrom: filterType === "daily" ? selectedDate : dateFrom,
      dateTo: filterType === "daily" ? selectedDate : dateTo
    });

    // ✅ เริ่ม loading และดึงข้อมูลใหม่จาก API
    setPaymentLoading(true);

    try {
      // // ✅ ใช้วันที่ที่ถูกต้องตาม filterType
      // const fromDate = new Date(filterType === "daily" ? selectedDate : dateFrom);
      // const toDate = new Date(filterType === "daily" ? selectedDate : dateTo);

      // const workYear = String(fromDate.getFullYear());
      // const workMonth = String(fromDate.getMonth() + 1);
      // const startDay = String(fromDate.getDate());
      // const endDay = String(toDate.getDate());

      // ✅ ใช้วันที่ที่ถูกต้องตาม filterType
      const fromDate = filterType === "daily" ? selectedDate : dateFrom;
      const toDate = filterType === "daily" ? selectedDate : dateTo;
      const response = await api.post('/worktime/GetWorkTimeCostByEmployeeIDandPeriod', {
        EmployeeID: employee.employeeID,
        StartDate: fromDate,
        EndDate: toDate
      });

      const employeeData = response.data;

      // ตรวจสอบว่า response เป็น array หรือ object
      let totalWorktime = 0;
      let wageCost = 0;

      if (Array.isArray(employeeData) && employeeData.length > 0) {
        // ถ้าเป็น array ให้รวมค่าทั้งหมด
        totalWorktime = employeeData.reduce((sum, item) => sum + (item.totalWorktime || 0), 0);
        wageCost = employeeData.reduce((sum, item) => sum + (item.wageCost || 0), 0);
      } else if (employeeData && typeof employeeData === 'object') {
        // ถ้าเป็น object เดียว
        totalWorktime = employeeData.totalWorktime || 0;
        wageCost = employeeData.wageCost || 0;
      }
      setPaidWorktimes(employeeData.worktimes || []);
      // ✅ อัพเดทข้อมูลใหม่ใน modal
      setPaymentModal(prev => ({
        ...prev,
        worktime: totalWorktime,
        wageCost: wageCost
      }));

    } catch (err) {
      console.error('Error loading payment data:', err);
      // ถ้าเกิดข้อผิดพลาด ให้แสดง error และใช้ข้อมูลเดิม
      alert('ไม่สามารถโหลดข้อมูลล่าสุดได้ กรุณาตรวจสอบอีกครั้ง');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ ปรับปรุง recalculatePaymentData ให้ส่ง parameter ตรงกับ Backend
  const recalculatePaymentData = async (employeeID, dateFrom, dateTo) => {
    try {
      setPaymentLoading(true);

      // แปลงวันที่เป็นรูปแบบที่ API ต้องการ
      // const fromDate = new Date(dateFrom);
      // const toDate = new Date(dateTo);

      // const workYear = String(fromDate.getFullYear());
      // const workMonth = String(fromDate.getMonth() + 1);
      // const startDay = String(fromDate.getDate());
      // const endDay = String(toDate.getDate());

      const response = await api.post('/worktime/GetWorkTimeCostByEmployeeIDandPeriod', {
        EmployeeID: employeeID,
        // WorkYear: workYear,
        // WorkMonth: workMonth,
        StartDate: dateFrom,
        EndDate: dateTo
      });

      const employeeData = response.data;

      // ตรวจสอบว่า response เป็น array หรือ object
      let totalWorktime = 0;
      let wageCost = 0;

      if (Array.isArray(employeeData) && employeeData.length > 0) {
        // ถ้าเป็น array ให้รวมค่าทั้งหมด
        totalWorktime = employeeData.reduce((sum, item) => sum + (item.totalWorktime || 0), 0);
        wageCost = employeeData.reduce((sum, item) => sum + (item.wageCost || 0), 0);
      } else if (employeeData && typeof employeeData === 'object') {
        // ถ้าเป็น object เดียว
        totalWorktime = employeeData.totalWorktime || 0;
        wageCost = employeeData.wageCost || 0;
      }

      // ✅ อัพเดทข้อมูลรายการที่จ่ายเงินแล้วด้วย
      setPaidWorktimes(employeeData.worktimes || []);

      // อัพเดทข้อมูลใน modal
      setPaymentModal(prev => ({
        ...prev,
        worktime: totalWorktime,
        wageCost: wageCost
      }));

    } catch (err) {
      console.error('Error recalculating payment data:', err);
      // ถ้าเกิดข้อผิดพลาด ให้รีเซ็ตเป็น 0
      setPaymentModal(prev => ({
        ...prev,
        worktime: 0,
        wageCost: 0
      }));
      // ✅ รีเซ็ต paidWorktimes ด้วย
      setPaidWorktimes([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ ฟังก์ชันแสดงรายการที่จ่ายเงินแล้ว
  const renderPaidWorktimesList = () => {
    // กรองข้อมูลที่มีการจ่ายเงินแล้ว
    const filteredPaidWorktimes = paidWorktimes.filter(item =>
      item.employeeID === paymentModal.employee?.employeeID
    );

    if (filteredPaidWorktimes.length === 0) {
      return (
        <div className="text-center text-base-content/60 py-2">
          <span className="text-2xl">💼</span>
          <p className="text-sm">ยังไม่มีการจ่ายเงินในช่วงนี้</p>
        </div>
      );
    }

    return filteredPaidWorktimes.map((item, index) => (
      <div key={index} className="bg-base-100 p-2 rounded border border-base-300">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* ✅ แสดงสถานะตาม isPurchase */}
            {item.isPurchase ? (
              <div className="font-semibold text-sm text-success">
                ✅ จ่ายแล้ว
              </div>
            ) : (
              <div className="font-semibold text-sm text-warning">
                ⏳ ยังไม่จ่าย
              </div>
            )}
            <div className="text-xs text-base-content/70 mb-1">
              📅 วัน: {formatThaiDate(item.workDate) || 'ไม่ระบุ'}
            </div>
            {/* ย้าย wageCost มาไว้ด้านซ้ายล่างวันที่ */}
            <div className={`font-bold text-sm ${item.isPurchase ? 'text-success' : 'text-warning'}`}>
              💰 {formatCurrency(item.wageCost || 0)}
            </div>
            {/* แสดงวันที่จ่ายเงินหากจ่ายแล้ว */}
            {item.isPurchase && item.purchaseDate && (
              <div className="text-xs text-success/70 mt-1">
                💳 จ่ายเมื่อ: {new Date(item.purchaseDate).toLocaleDateString('th-TH')}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            {/* แสดงเวลาเข้า-ออกงานแทน */}
            <div className="text-xs text-base-content/70 mb-1">
              ⏱️ เวลาทำงาน: {formatWorktime(item.totalWorktime || 0)}
            </div>
            <div className="text-xs text-success">
              ⬇️ {item.timeClockIn || '-'}
            </div>
            <div className="text-xs text-error">
              ⬆️ {item.timeClockOut || '-'}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  // ✅ ฟังก์ชันจัดการเมื่อเปลี่ยนวันที่ใน modal
  const handleSelectDateChange = (newSelectDate) => {
    setPaymentModal(prev => ({ ...prev, dateFrom: newSelectDate, dateTo: newSelectDate }));

    // คำนวณใหม่ถ้ามีข้อมูลครบ
    if (newSelectDate && paymentModal.employee?.employeeID) {
      recalculatePaymentData(paymentModal.employee.employeeID, newSelectDate, newSelectDate);
    }
  };

  // ✅ ฟังก์ชันจัดการเมื่อเปลี่ยนวันที่ใน modal
  const handleDateFromChange = (newDateFrom) => {
    setPaymentModal(prev => ({ ...prev, dateFrom: newDateFrom }));

    // คำนวณใหม่ถ้ามีข้อมูลครบ
    if (newDateFrom && paymentModal.dateTo && paymentModal.employee?.employeeID) {
      recalculatePaymentData(paymentModal.employee.employeeID, newDateFrom, paymentModal.dateTo);
    }
  };

  const handleDateToChange = (newDateTo) => {
    setPaymentModal(prev => ({ ...prev, dateTo: newDateTo }));

    // คำนวณใหม่ถ้ามีข้อมูลครบ
    if (paymentModal.dateFrom && newDateTo && paymentModal.employee?.employeeID) {
      recalculatePaymentData(paymentModal.employee.employeeID, paymentModal.dateFrom, newDateTo);
    }
  };
  const unpaidDaysInfo = React.useMemo(() => {
    if (!paymentModal.employee?.employeeID) {
      return { count: 0, days: [] };
    }

    const unpaidDays = paidWorktimes.filter(item =>
      item.employeeID === paymentModal.employee.employeeID &&
      !item.isPurchase &&
      item.totalWorktime > 0
    );

    return {
      count: unpaidDays.length,
      days: unpaidDays
    };
  }, [paidWorktimes, paymentModal.employee?.employeeID]);


  // ✅ NOW the conditional return comes AFTER all hooks
  if (selectedEmployee) {
    return (
      <EmployeeDetailWorktime
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} position="bottom-center" />
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl card bg-base-100 shadow-xl p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">เวลาทำงานของทุกคน</h1>
          {authData?.userPermissionId === 1 && (
            <ModalCreateWorktime
              onCreated={() => window.location.reload()}
              showToast={showToast}
            />
          )}
        </div>

        <section>
          {/* ✅ สลับระหว่าง ช่วงเวลา กับ รายวัน */}
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 justify-center">
            <label className="font-semibold">ดูข้อมูลแบบ:</label>
            <div className="flex items-center gap-2">
              <span className="">ช่วงเวลา</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={filterType === "daily"}
                onChange={e => setFilterType(e.target.checked ? "daily" : "period")}
              />
              <span className="">รายวัน</span>
            </div>
          </div>

          {/* ✅ แสดง date range picker เมื่อเลือกช่วงเวลา */}
          {filterType === "period" && (
            <div className="mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <label className="font-semibold">จากวันที่:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="input input-bordered input-sm w-full sm:w-auto"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <label className="font-semibold">ถึงวันที่:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  min={dateFrom} // ป้องกันเลือกวันที่น้อยกว่า dateFrom
                  className="input input-bordered input-sm w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          {/* ✅ แสดง single date picker เมื่อเลือกรายวัน */}
          {filterType === "daily" && (
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 justify-center">
              <label className="font-semibold">เลือกวัน:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="input input-bordered input-sm w-full sm:w-auto"
              />
            </div>
          )}

          {/* ✅ คำอธิบาย */}
          <div className="mb-2 text-base-content/70 text-center text-sm">
            {filterType === "period"
              ? "เลือกช่วงวันที่เพื่อดูข้อมูลการทำงานของพนักงานในช่วงนั้น"
              : "เลือกวันเพื่อดูข้อมูลการทำงานของพนักงานในวันนั้น"}
          </div>

          {/* ✅ ต้นทุนรวม - แสดงเฉพาะ Admin */}
          {authData?.userPermissionId === 1 && (
            <WageCostSummary
              filterType={filterType}
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedDate={selectedDate}
              data={data}
              formatCurrency={formatCurrency}
            />
          )}

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
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {data.length === 0 ? (
                <div className="text-center py-8 text-base-content/60 md:col-span-2 lg:col-span-3">ไม่มีข้อมูล</div>
              ) : (
                data.map((item, idx) => (
                  <div key={idx} className="card bg-gradient-to-r from-base-100 to-base-200 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 p-4">
                    <div>
                      {/* ✅ ทำให้ชื่อพนักงานคลิกได้ */}
                      <div
                        className="font-bold text-lg md:text-xl text-primary mb-3 cursor-pointer hover:underline hover:text-primary-focus transition-colors flex items-center gap-2"
                        onClick={() => setSelectedEmployee({
                          employeeID: item.employeeID,
                          employeeName: item.employeeName
                        })}
                        title="คลิกเพื่อดูประวัติรายละเอียด"
                      >
                        <span className="text-2xl">👤</span>
                        <span>{item.employeeName || '-'}</span>
                      </div>

                      {/* ✅ ปรับ layout ข้อมูล */}
                      <div className="space-y-3">
                        <div className="bg-base-100 p-3 rounded-lg shadow-sm"
                          onClick={() => setSelectedEmployee({
                            employeeID: item.employeeID,
                            employeeName: item.employeeName
                          })}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⏱️</span>
                            <span className="font-semibold text-base-content/80">เวลาทำงาน</span>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {item.totalWorktime ? formatWorktime(item.totalWorktime) : '-'}
                          </div>
                        </div>
                        {authData?.userPermissionId === 1 && (
                          <div className="bg-base-100 p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">💰</span>
                              <span className="font-semibold text-base-content/80">ค่าตอบแทน / ค่าตอบแทนคงค้าง</span>
                            </div>

                            {/* ✅ ปุ่มจ่ายเงิน - แสดงเฉพาะ Admin ชิดขวา */}
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-success">
                                {item.wageCost ? formatCurrency(item.wageCost) : '-'}
                              </div>
                              /
                              <div className="text-lg font-bold text-warning">
                                {item.wageCost ? formatCurrency(item.wageCostNoPurchase) : '-'}
                              </div>

                              {/* ✅ ปุ่มจ่ายเงิน - แสดงเฉพาะ Admin ชิดขวา */}

                              <button
                                className="btn btn-md btn-success"
                                onClick={() => openPaymentModal(item)}
                                disabled={!item.wageCost || item.wageCost <= 0}
                              >
                                💳 จ่าย
                              </button>

                            </div>
                          </div>
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

      {/* ✅ Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">{confirmModal.title}</h3>
            {confirmModal.content}
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={handleCancel}
              >
                ❌ ยกเลิก
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirm}
              >
                ✅ ยืนยันจ่ายเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Payment Modal - แสดงเฉพาะเมื่อ Confirm Modal ปิด */}
      {paymentModal.isOpen && !confirmModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">💳 จ่ายเงินค่าตอบแทน</h3>

            {/* ✅ ข้อมูลพนักงาน */}
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <div className="font-semibold text-primary">
                👤 {paymentModal.employee?.employeeName || '-'}
              </div>
            </div>

            {/* ✅ ช่วงเวลา พร้อมการคำนวณอัตโนมัติ */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  {filterType === "daily" ? "วันที่" : "ช่วงเวลา"}
                </span>
              </label>
              {filterType === "daily" ? (
                // แสดงแค่วันที่เดียวเมื่อเป็นโหมดรายวัน
                <input
                  type="date"
                  value={paymentModal.dateFrom}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    handleSelectDateChange(selectedDate);
                  }}
                  className="input input-bordered input-sm"
                  disabled={paymentLoading}
                />
              ) : (
                // แสดงช่วงวันที่เมื่อเป็นโหมดช่วงเวลา
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={paymentModal.dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="input input-bordered input-sm flex-1"
                    disabled={paymentLoading}
                  />
                  <span className="self-center">ถึง</span>
                  <input
                    type="date"
                    value={paymentModal.dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    min={paymentModal.dateFrom} // ป้องกันเลือกวันที่น้อยกว่า dateFrom
                    className="input input-bordered input-sm flex-1"
                    disabled={paymentLoading}
                  />
                </div>
              )}
              {/* ✅ แสดงสถานะการคำนวณ */}
              {paymentLoading && (
                <div className="label">
                  <span className="label-text-alt text-info flex items-center gap-1"></span>
                  <span className="loading loading-spinner loading-xs">
                    กำลังคำนวณใหม่...
                  </span>
                </div>
              )}
            </div>

            {/* ✅ ชั่วโมงทำงาน - อัพเดทอัตโนมัติ */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">⏱️ ชั่วโมงทำงาน และ วันที่ทำงาน</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="text-lg font-bold text-primary flex justify-between items-center">
                  {paymentLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="loading loading-spinner loading-sm"></span>
                      คำนวณใหม่...
                    </span>
                  ) : (
                    <>
                      <span>{formatWorktime(paymentModal.worktime)}</span>
                      <span className="text-sm">จาก {unpaidDaysInfo.count} วัน (ที่ยังไม่จ่าย)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ ค่าตอบแทน - อัพเดทอัตโนมัติ */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">💰 ค่าตอบแทนคงค้าง</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentModal.wageCost}
                onChange={(e) => setPaymentModal(prev => ({ ...prev, wageCost: parseFloat(e.target.value) || 0 }))}
                className="input input-bordered"
                placeholder="กรอกจำนวนเงิน"
                disabled={paymentLoading}
              />
              <div className="label">
                <span className="label-text-alt text-success font-semibold">
                  {paymentLoading ? 'คำนวณใหม่...' : formatCurrency(paymentModal.wageCost)}
                </span>
              </div>
            </div>



            {/* ✅ ปุ่มการกระทำ */}
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={closePaymentModal}
                disabled={paymentLoading}
              >
                ❌ ยกเลิก
              </button>
              <button
                className="btn btn-success"
                onClick={confirmPayment}
                disabled={paymentLoading || !paymentModal.wageCost || paymentModal.wageCost <= 0}
              >
                {paymentLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังจ่าย...
                  </>
                ) : (
                  <>
                    💳 ยืนยันจ่ายเงิน
                  </>
                )}
              </button>
            </div>
            <hr className="my-4" />
            {/* แสดงวันที่จ่ายเงินแล้ว */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">📅 รายการที่จ่ายเงินแล้ว</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {paymentLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    กำลังตรวจสอบรายการจ่ายเงิน...
                  </span>
                ) : (
                  <div className="space-y-2">
                    {/* ✅ แสดงรายการที่จ่ายเงินแล้ว */}
                    {renderPaidWorktimesList()}

                    {/* ✅ สรุปรวมที่จ่ายแล้ว */}
                    {(() => {
                      // ใช้ paidWorktimes ที่มาจาก API แทน data จากหน้าหลัก
                      const paidItems = paidWorktimes.filter(item =>
                        item.employeeID === paymentModal.employee?.employeeID &&
                        item.isPurchase === true
                      );

                      if (paidItems.length === 0) return null;

                      const totalPaidAmount = paidItems.reduce((sum, item) => sum + (item.wageCost || 0), 0);
                      const totalPaidHours = paidItems.reduce((sum, item) => sum + (item.totalWorktime || 0), 0);

                      return (
                        <div className="mt-3 pt-3 border-t border-base-300">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-sm text-info">
                                📊 รวมที่จ่ายแล้ว
                              </div>
                              <div className="text-xs text-base-content/70">
                                {paidItems.length} รายการ
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-info text-sm">
                                {formatCurrency(totalPaidAmount)}
                              </div>
                              <div className="text-xs text-base-content/60">
                                {formatWorktime(totalPaidHours)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ WageCostSummary Component แบบ Minimal
function WageCostSummary({ filterType, dateFrom, dateTo,  data, formatCurrency }) {
  // ✅ คำนวณข้อมูลล่วงหน้า
  const totalCost = data.reduce((sum, item) => sum + (item.wageCost || 0), 0);
  const totalUnpaidCost = data.reduce((sum, item) => sum + (item.wageCostNoPurchase || 0), 0);
  const totalPaidCost = totalCost - totalUnpaidCost;
  const totalEmployees = data.filter(item => item.totalWorktime > 0).length;

  return (
    <div className="mb-4 bg-info/5 rounded-lg border border-info/10 p-3">
      {/* ✅ Header แบบกระชับ */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💸</span>
          <span className="font-bold text-primary text-sm">ต้นทุนค่าแรง</span>
        </div>
        <div className="text-xs text-primary/60 bg-primary/10 px-2 py-1 rounded-full">
          {filterType === "period"
            ? `${(() => {
                const start = new Date(dateFrom);
                const end = new Date(dateTo);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return `${days} วัน`;
              })()} | ${totalEmployees} คน`
            : `1 วัน | ${totalEmployees} คน`
          }
        </div>
      </div>

      {/* ✅ สถิติแบบ Horizontal */}
      <div className="flex items-center justify-between text-sm">
        {/* ยอดรวม */}
        <div className="text-center">
          <div className="text-xs text-primary/70">รวม</div>
          <div className="font-bold text-primary">
            {totalCost > 0 ? formatCurrency(totalCost).replace('฿', '฿') : '฿0'}
          </div>
        </div>

        {/* ยังไม่จ่าย */}
        <div className="text-center">
          <div className="text-xs text-warning/70">ยังไม่จ่าย</div>
          <div className="font-bold text-warning">
            {totalUnpaidCost > 0 ? formatCurrency(totalUnpaidCost).replace('฿', '฿') : '฿0'}
          </div>
        </div>

        {/* จ่ายแล้ว */}
        <div className="text-center">
          <div className="text-xs text-success/70">จ่ายแล้ว</div>
          <div className="font-bold text-success">
            {totalPaidCost > 0 ? formatCurrency(totalPaidCost).replace('฿', '฿') : '฿0'}
          </div>
        </div>

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