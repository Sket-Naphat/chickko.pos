import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { api } from '../lib/api';

const authData = Cookies.get("authData") ? JSON.parse(Cookies.get("authData")) : null;
const EmployeeID = authData ? authData.userId : null;
const UserName = authData ? authData.name : "-";
// if (!EmployeeID) {
//     window.location.href = "/login"; // Redirect to login if no EmployeeID
// }
const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { hour12: false });
};

const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

const TimeClock = () => {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);

    // รอ cookie ก่อน แล้วค่อยเรียก API
    const [authData, setAuthData] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    useEffect(() => {
        const timer = setInterval(() => {
            const raw = Cookies.get("authData");
            if (raw) {
                try {
                    setAuthData(JSON.parse(raw));
                } catch {
                    setAuthData(null);
                }
                setLoadingAuth(false);
                clearInterval(timer);
            }
        }, 200);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!authData) return;
        const today = getTodayDate();
        api.post('/worktime/GetPeriodWorktimeByEmployeeID', {
          employeeID: authData.userId,
          workDate: today
        })
            .then(response => {
                const clockInTime = response.data?.timeClockIn || null;
                const clockOutTime = response.data?.timeClockOut || null;
                setClockInTime(clockInTime || null);
                setClockOutTime(clockOutTime || null);
            })
            .catch(error => {
                console.error('Error fetching saved times:', error);
            });
    }, [authData]);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(getCurrentTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);



    const handleClockIn = () => {
        setClockInTime(currentTime);
        saveTimesClockIn(currentTime);
    };

    const handleClockOut = () => {
        setClockOutTime(currentTime);
        saveTimesClockOut(clockInTime, currentTime);
    };
    // Save times to localStorage
    const saveTimesClockIn = (inTime) => {
        const today = getTodayDate();
        api.post('/worktime/ClockIn', { employeeID: EmployeeID, timeClockIn: inTime, workDate: today })
            .then(response => {
                console.log('Clock In successful:', response.data);
            })
            .catch(error => {
                console.error('Error clocking in:', error);
            });
    };
    // Save times to localStorage
    const saveTimesClockOut = (inTime, outTime) => {
        const today = getTodayDate();
        api.post('/worktime/ClockOut', { EmployeeID: EmployeeID, TimeClockIn: inTime, TimeClockOut: outTime, WorkDate: today })
            .then(response => {
                console.log('Clock Out successful:', response.data);
            })
            .catch(error => {
                console.error('Error clocking out:', error);
            });
    };
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <span className="text-lg mt-4">⏳ กำลังโหลดข้อมูลผู้ใช้งาน…</span>
                </div>
            </div>
        );
    }
    const UserName = authData ? authData.name : "-";
    // ฟังก์ชันแปลงวันที่เป็นภาษาไทยแบบ "วันศุกร์ ที่ 5 กันยายน 2025"
    const formatThaiDate = (dateStr) => {
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        const date = new Date(dateStr);
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `วัน${dayName} ที่ ${day} ${month} ${year}`;
    };

    return (
        <div className="pt-4 bg-base-200 flex items-center justify-center">
            <div className="card w-full max-w-md shadow-xl bg-base-100 p-8">
                <div className="flex flex-col items-center gap-4">
                    <h2 className="text-2xl font-bold text-primary mb-2">บันทึกเวลาเข้างาน</h2>
                    <button className='btn btn-sm btn-ghost absolute top-4 right-4 text-5xl' onClick={() => { window.location.href = '/worktime'; }} title="ดูประวัติเข้าออกงาน">📋</button>
                    <div className="text-lg font-semibold text-base-content mb-2">ผู้ใช้งาน: <span className="text-primary">{UserName}</span></div>
                    <div className="text-lg font-semibold text-base-content mb-2">
                        วันที่: <span className="text-primary">{formatThaiDate(getTodayDate())}</span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-primary mb-2">
                        🕰️ {currentTime}
                    </div>
                    <div className="w-full grid grid-cols-2 gap-4 mb-4">
                        <div className="card bg-primary/10 p-4 flex flex-col items-center">
                            <span className="text-lg font-semibold text-primary">เข้างาน</span>
                            <span className="text-xl font-mono">{clockInTime ? clockInTime : '-'}</span>
                        </div>
                        <div className="card bg-secondary/10 p-4 flex flex-col items-center">
                            <span className="text-lg font-semibold text-secondary">ออกงาน</span>
                            <span className="text-xl font-mono">{clockOutTime ? clockOutTime : '-'}</span>
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-4">
                        <button
                            onClick={handleClockIn}
                            disabled={!!clockInTime}
                            className="btn btn-primary btn-lg w-full text-xl py-6 shadow-md h-full "
                        >
                            <span className="material-icons text-3xl mr-2"> login</span>
                            กดเข้างาน
                        </button>
                        <button
                            onClick={handleClockOut}
                            disabled={!clockInTime || !!clockOutTime}
                            className="btn btn-secondary btn-lg w-full text-xl py-6 shadow-md h-full "
                        >
                            <span className="material-icons text-3xl mr-2">logout</span>
                            กดเลิกงาน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeClock;