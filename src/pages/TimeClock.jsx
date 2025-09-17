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
    var currentTime =  now.toLocaleTimeString('en-GB', { hour12: false });
     return currentTime;
};

const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TimeClock = () => {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationWarning, setLocationWarning] = useState('');
    const [ClockInLocations, setClockInLocations] = useState(null);
    const [ClockOutLocations, setClockOutLocations] = useState(null);
    // ตำแหน่งร้าน Chick-Ko
    const Set_STORE_LOCATION = {
        latitude: 7.876778003774403,
        longitude: 98.3932583064554,
        radius: 1000 // รัศมี 1 กิโลเมตร
    };
    const [STORE_LOCATION, setStoreLocation] = useState(Set_STORE_LOCATION);
    // รอ cookie ก่อน แล้วค่อยเรียก API
    const [authData, setAuthData] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    useEffect(() => {
        const timer = setInterval(() => {
            const raw = Cookies.get("authData");
            if (raw) {
                try {
                    var _authData = JSON.parse(raw);
                    setAuthData(_authData);
                    if (_authData && _authData.userId) {
                        if (_authData.site == "HKT") {
                            setStoreLocation({
                                latitude: 7.876778003774403,
                                longitude: 98.3932583064554,
                                radius: 1000 // รัศมี 1 กิโลเมตร
                            });
                        } else if (_authData.site == "BKK") {
                            setStoreLocation({
                                latitude: 13.727455427137105,
                                longitude: 100.76643508631096,
                                radius: 1000 // รัศมี 1 กิโลเมตร
                            });
                        }
                    }
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
                const ClockInLocations = JSON.parse(response.data?.clockInLocation || null);
                const ClockOutLocations = JSON.parse(response.data?.clockOutLocation || null);
                setClockInTime(clockInTime || null);
                setClockOutTime(clockOutTime || null);
                if (ClockInLocations) {
                    setClockInLocations(getGoogleMapsUrl(ClockInLocations.latitude, ClockInLocations.longitude) || null);
                }
                if (ClockOutLocations) {
                    setClockOutLocations(getGoogleMapsUrl(ClockOutLocations.latitude, ClockOutLocations.longitude) || null);
                }
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

    // ฟังก์ชันขอตำแหน่งปัจจุบันที่แม่นยำที่สุด (อุ่น GPS และขอหลายครั้ง)
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            setIsGettingLocation(true);
            
            const locations = [];
            let attempts = 0;
            const maxAttempts = 5; // ขอตำแหน่ง 5 ครั้ง
            const targetAccuracy = 50; // ความแม่นยำที่ต้องการ (เมตร)

            const getLocationAttempt = () => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        attempts++;
                        const locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude,
                            altitudeAccuracy: position.coords.altitudeAccuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: new Date().toISOString(),
                            attempt: attempts
                        };

                        locations.push(locationData);
                        console.log(`GPS Attempt ${attempts}:`, {
                            lat: locationData.latitude.toFixed(6),
                            lng: locationData.longitude.toFixed(6),   
                            accuracy: Math.round(locationData.accuracy) + 'm'
                        });

                        // ถ้าได้ความแม่นยำที่ต้องการ หรือครบจำนวนครั้งแล้ว
                        if (locationData.accuracy <= targetAccuracy || attempts >= maxAttempts) {
                            // เลือกตำแหน่งที่แม่นยำที่สุด
                            const bestLocation = locations.reduce((best, current) => 
                                current.accuracy < best.accuracy ? current : best
                            );

                            console.log('Best GPS Result:', {
                                lat: bestLocation.latitude.toFixed(6),
                                lng: bestLocation.longitude.toFixed(6),
                                accuracy: Math.round(bestLocation.accuracy) + 'm',
                                totalAttempts: attempts
                            });

                            setIsGettingLocation(false);
                            resolve(bestLocation);
                        } else {
                            // รอ 1 วินาที แล้วลองใหม่
                            setTimeout(() => {
                                getLocationAttempt();
                            }, 1000);
                        }
                    },
                    (error) => {
                        attempts++;
                        console.error(`GPS Attempt ${attempts} failed:`, error.message);
                        
                        if (attempts >= maxAttempts || locations.length === 0) {
                            setIsGettingLocation(false);
                            if (locations.length > 0) {
                                // ถ้ามีตำแหน่งบางค่า ให้ใช้ค่าที่แม่นยำที่สุด
                                const bestLocation = locations.reduce((best, current) => 
                                    current.accuracy < best.accuracy ? current : best
                                );
                                resolve(bestLocation);
                            } else {
                                reject(error);
                            }
                        } else {
                            // ลองใหม่
                            setTimeout(() => {
                                getLocationAttempt();
                            }, 1000);
                        }
                    },
                    {
                        enableHighAccuracy: true,  // ขอความแม่นยำสูงสุด
                        timeout: 10000,            // รอสูงสุด 10 วินาทีต่อครั้ง
                        maximumAge: 0              // ไม่ใช้ข้อมูลเก่า ขอข้อมูลใหม่เสมอ
                    }
                );
            };

            // เริ่มขอตำแหน่งครั้งแรก
            getLocationAttempt();
        });
    };

    // ฟังก์ชันสร้าง Google Maps URL
    const getGoogleMapsUrl = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    // ฟังก์ชันคำนวณระยะทางระหว่างสองจุด (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // รัศมีโลกเป็นเมตร
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // ระยะทางเป็นเมตร
    };

    // ฟังก์ชันตรวจสอบว่าอยู่ในรัศมีร้านหรือไม่
    const checkLocationDistance = (userLocation) => {
        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            STORE_LOCATION.latitude,
            STORE_LOCATION.longitude
        );
        
        return {
            distance: Math.round(distance),
            isWithinRadius: distance <= STORE_LOCATION.radius
        };
    };

    const handleClockIn = async () => {
        try {
            const location = await getCurrentLocation();
            
            // ตรวจสอบระยะทางจากร้าน
            const locationCheck = checkLocationDistance(location);
            
            if (!locationCheck.isWithinRadius) {
                // ถ้าอยู่นอกรัศมี แสดงข้อความเตือน
                setLocationWarning(`⚠️ คุณกดจากนอกพื้นที่ร้าน (ห่าง ${(locationCheck.distance/1000).toFixed(2)} กม.)`);
                
                // ซ่อนข้อความเตือนหลัง 5 วินาที
                setTimeout(() => {
                    setLocationWarning('');
                }, 5000);
            } else {
                setLocationWarning('');
            }
            
            setClockInTime(currentTime);
            saveTimesClockIn(currentTime, location, locationCheck);


        } catch (error) {
            console.error('Error getting location:', error);
            // ถ้าไม่ได้ location ก็บันทึกเวลาไปก่อน
            setClockInTime(currentTime);
            saveTimesClockIn(currentTime, null, null);
        }
    };

    const handleClockOut = async () => {
        try {
            const location = await getCurrentLocation();
            // ตรวจสอบระยะทางจากร้าน
            const locationCheck = checkLocationDistance(location);
            
            if (!locationCheck.isWithinRadius) {
                // ถ้าอยู่นอกรัศมี แสดงข้อความเตือน
                setLocationWarning(`⚠️ คุณกดจากนอกพื้นที่ร้าน (ห่าง ${(locationCheck.distance/1000).toFixed(2)} กม.)`);
                
                // ซ่อนข้อความเตือนหลัง 5 วินาที
                setTimeout(() => {
                    setLocationWarning('');
                }, 5000);
            } else {
                setLocationWarning('');
            }
            setClockOutTime(currentTime);
            saveTimesClockOut(clockInTime, currentTime, location);

        } catch (error) {
            console.error('Error getting location:', error);
            // ถ้าไม่ได้ location ก็บันทึกเวลาไปก่อน
            setClockOutTime(currentTime);
            saveTimesClockOut(clockInTime, currentTime, null);
        }
    };
    // Save times with location
    const saveTimesClockIn = (inTime, location = null, locationCheck = null) => {
        const today = getTodayDate();
        const requestData = {
            employeeID: EmployeeID,
            timeClockIn: inTime,
            workDate: today,
            ClockInLocation: location ? JSON.stringify({
                ...location,
                distanceFromStore: locationCheck?.distance || null,
                isWithinStoreRadius: locationCheck?.isWithinRadius || false
            }) : null
        };

        api.post('/worktime/ClockIn', requestData)
            .then(response => {
                console.log('Clock In successful:', response.data);
                if (location && locationCheck) {
                    console.log('Location data:', JSON.stringify(location, null, 2));
                    console.log('Distance from store:', locationCheck.distance + 'm');
                    console.log('Within store radius:', locationCheck.isWithinRadius);
                    console.log('Google Maps URL:', getGoogleMapsUrl(location.latitude, location.longitude));

                    setClockInLocations(getGoogleMapsUrl(location.latitude, location.longitude));
                }
            })
            .catch(error => {
                console.error('Error clocking in:', error);
            });
    };
    // Save times with location
    const saveTimesClockOut = (inTime, outTime, location = null) => {
        const today = getTodayDate();
        const requestData = {
            EmployeeID: EmployeeID,
            TimeClockIn: inTime,
            TimeClockOut: outTime,
            WorkDate: today,
            ClockOutLocation: location ? JSON.stringify(location) : null
        };

        api.post('/worktime/ClockOut', requestData)
            .then(response => {
                console.log('Clock Out successful:', response.data);
                if (location) {
                    console.log('Location data:', JSON.stringify(location, null, 2));
                    console.log('Google Maps URL:', getGoogleMapsUrl(location.latitude, location.longitude));
                    setClockOutLocations(getGoogleMapsUrl(location.latitude, location.longitude));
                }
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
                            {ClockInLocations ? (
                                <button 
                                    className="btn btn-xs btn-outline btn-primary mt-2"
                                    onClick={() => window.open(ClockInLocations, '_blank')}
                                    title="ดูตำแหน่งในแผนที่"
                                >
                                    📍 ดูตำแหน่ง
                                </button>
                            ) : (
                                <span className="text-xs text-gray-500 mt-2">-</span>
                            )}
                        </div>
                        <div className="card bg-secondary/10 p-4 flex flex-col items-center">
                            <span className="text-lg font-semibold text-secondary">ออกงาน</span>
                            <span className="text-xl font-mono">{clockOutTime ? clockOutTime : '-'}</span>
                            {ClockOutLocations ? (
                                <button 
                                    className="btn btn-xs btn-outline btn-secondary mt-2"
                                    onClick={() => window.open(ClockOutLocations, '_blank')}
                                    title="ดูตำแหน่งในแผนที่"
                                >
                                    📍 ดูตำแหน่ง
                                </button>
                            ) : (
                                <span className="text-xs text-gray-500 mt-2">-</span>
                            )}
                        </div>
                    </div>
                    {/* แสดงสถานะ loading ขณะขอ location */}
                    {isGettingLocation && (
                        <div className="alert alert-info mb-4">
                            <span className="loading loading-spinner loading-sm"></span>
                            <span>🛰️ กำลังดึงข้อมูลตำแหน่ง GPS กรุณารอสักครู่...</span>
                        </div>
                    )}

                    {/* แสดงข้อความเตือนเมื่อกดนอกพื้นที่ร้าน */}
                    {locationWarning && (
                        <div className="alert alert-error mb-4">
                            <span>🚨</span>
                            <span className="font-semibold">{locationWarning}</span>
                        </div>
                    )}

                    <div className="w-full flex flex-col gap-4">
                        <button
                            onClick={handleClockIn}
                            disabled={!!clockInTime || isGettingLocation}
                            className="btn btn-primary btn-lg w-full text-xl py-6 shadow-md h-full "
                        >
                            {isGettingLocation ? (
                                <>
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    🛰️ อุ่น GPS...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons text-3xl mr-2"> login</span>
                                    กดเข้างาน
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClockOut}
                            disabled={!clockInTime || !!clockOutTime || isGettingLocation}
                            className="btn btn-secondary btn-lg w-full text-xl py-6 shadow-md h-full "
                        >
                            {isGettingLocation ? (
                                <>
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    🛰️ อุ่น GPS...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons text-3xl mr-2">logout</span>
                                    กดเลิกงาน
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeClock;