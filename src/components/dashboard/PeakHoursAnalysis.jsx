import React from 'react';

const PeakHoursAnalysis = ({
    filterMode,
    selectedMonth,
    selectedYear,
    months,
    dailyData,
    monthlyData,
    formatNumber
}) => {

    // ✅ คำนวณสถิติตามวันในสัปดาห์ (แก้ไขการคำนวณค่าเฉลี่ย)
    const getDayOfWeekStats = () => {
        const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const dayStats = {};
        
        // ✅ เริ่มต้น dayStats สำหรับทุกวัน
        for (let i = 0; i < 7; i++) {
            dayStats[i] = {
                dayName: dayNames[i],
                dayOfWeek: i,
                orderCount: 0,
                totalSales: 0,
                dayCount: 0
            };
        }
        
        // ✅ ใช้ dailyData เหมือนกันทั้ง 2 โหมด (แต่ส่งมาคนละตัว)
        dailyData.forEach(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay(); // 0-6 (อาทิตย์-เสาร์)
            
            dayStats[dayOfWeek].orderCount += (day.dineInOrders || 0) + (day.deliveryOrders || 0);
            dayStats[dayOfWeek].totalSales += day.total || 0;
            dayStats[dayOfWeek].dayCount += 1;
        });

        // ✅ map ก่อน แล้วค่อย filter
        return Object.values(dayStats)
            .map(day => ({
                ...day,
                // ✅ คำนวณค่าเฉลี่ยก่อน filter
                avgOrdersPerDay: day.dayCount > 0 ? day.orderCount / day.dayCount : 0,
                avgSalesPerDay: day.dayCount > 0 ? day.totalSales / day.dayCount : 0
            }))
            .filter(day => day.dayCount > 0) // ✅ filter ออกหลัง map
            .sort((a, b) => b.avgOrdersPerDay - a.avgOrdersPerDay); // เรียงตามค่าเฉลี่ย
    };

    // คำนวณ Peak Hours ตามโหมด
    const getPeakHours = () => {
        if (filterMode === 'month') {
            const combinedHours = dailyData
                .flatMap(day => [
                    ...(day.dineInPeakHours || []),
                    ...(day.deliveryPeakHours || [])
                ])
                .reduce((acc, hour) => {
                    const key = hour.hourRange || hour.HourRange;
                    if (!key) return acc;

                    if (!acc[key]) {
                        acc[key] = {
                            hourRange: key,
                            orderCount: 0,
                            totalSales: 0,
                            avgPerOrder: 0
                        };
                    }

                    acc[key].orderCount += (hour.orderCount || hour.OrderCount || 0);
                    acc[key].totalSales += (hour.totalSales || hour.TotalSales || 0);

                    return acc;
                }, {});

            const processedHours = Object.values(combinedHours)
                .map(hour => ({
                    ...hour,
                    avgPerOrder: hour.orderCount > 0 ? hour.totalSales / hour.orderCount : 0,
                    sortValue: parseInt(hour.hourRange.split(':')[0])
                }))
                .sort((a, b) => a.sortValue - b.sortValue);

            return {
                hours: processedHours,
                period: `${months[selectedMonth]} ${selectedYear}`,
                totalHours: processedHours.length,
                topHour: processedHours.length > 0 ?
                    processedHours.reduce((max, hour) => hour.orderCount > max.orderCount ? hour : max) : null
            };
        } else {
            const yearlyHours = monthlyData
                .filter(month => month.total > 0)
                .flatMap(month => [
                    ...(month.peakHours || []),
                    ...(month.dineInPeakHours || []),
                    ...(month.deliveryPeakHours || [])
                ])
                .reduce((acc, hour) => {
                    const key = hour.hourRange || hour.HourRange;
                    if (!key) return acc;

                    if (!acc[key]) {
                        acc[key] = {
                            hourRange: key,
                            orderCount: 0,
                            totalSales: 0,
                            avgPerOrder: 0,
                            sortValue: parseInt(key.split(':')[0])
                        };
                    }

                    acc[key].orderCount += (hour.orderCount || hour.OrderCount || 0);
                    acc[key].totalSales += (hour.totalSales || hour.TotalSales || 0);
                    return acc;
                }, {});

            const processedHours = Object.values(yearlyHours)
                .map(hour => ({
                    ...hour,
                    avgPerOrder: hour.orderCount > 0 ? hour.totalSales / hour.orderCount : 0
                }))
                .sort((a, b) => a.sortValue - b.sortValue);

            return {
                hours: processedHours,
                period: `ปี ${selectedYear}`,
                totalHours: processedHours.length,
                topHour: processedHours.length > 0 ?
                    processedHours.reduce((max, hour) => hour.orderCount > max.orderCount ? hour : max) : null
            };
        }
    };

    const peakData = getPeakHours();
    const dayOfWeekStats = getDayOfWeekStats();

    // กำหนดระดับความ popular
    const getPopularityLevel = (orderCount, maxCount) => {
        const percentage = maxCount > 0 ? (orderCount / maxCount) * 100 : 0;
        
        if (percentage >= 70) return { color: 'error', icon: '🔥' };
        if (percentage >= 50) return { color: 'warning', icon: '⚡' };
        if (percentage >= 30) return { color: 'info', icon: '📊' };
        return { color: 'success', icon: '💚' };
    };

    // ✅ สีประจำวัน
    const getDayColor = (dayOfWeek) => {
        const colors = [
            { bg: 'bg-red-500', text: 'text-red-500' },        // อาทิตย์ - แดง
            { bg: 'bg-yellow-500', text: 'text-yellow-500' },  // จันทร์ - เหลือง
            { bg: 'bg-pink-500', text: 'text-pink-500' },      // อังคาร - ชมพู
            { bg: 'bg-green-500', text: 'text-green-500' },    // พุธ - เขียว
            { bg: 'bg-orange-500', text: 'text-orange-500' },  // พฤหัสบดี - ส้ม
            { bg: 'bg-blue-500', text: 'text-blue-500' },      // ศุกร์ - ฟ้า
            { bg: 'bg-purple-500', text: 'text-purple-500' }   // เสาร์ - ม่วง
        ];
        return colors[dayOfWeek];
    };

    if (peakData.hours.length === 0 && dayOfWeekStats.length === 0) {
        return (
            <div className="bg-base-100 rounded-xl shadow p-6 text-center">
                <div className="text-4xl mb-2">⏱️</div>
                <div className="text-base-content/60">
                    ไม่มีข้อมูลช่วงเวลาขายดี ใน{peakData.period}
                </div>
            </div>
        );
    }

    const maxOrderCount = peakData.hours.length > 0 ? Math.max(...peakData.hours.map(h => h.orderCount)) : 0;
    const maxDayOrderCount = dayOfWeekStats.length > 0 ? Math.max(...dayOfWeekStats.map(d => d.orderCount)) : 0;

    return (
        <div className="collapse bg-base-100 border border-primary/20 rounded-lg">
            <input type="checkbox" />
            <div className="collapse-title font-semibold min-h-0 p-0">
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-primary text-xl">⏱️</span>
                        <span className="text-lg font-bold text-primary">
                            ช่วงเวลาขายดี <br /> {peakData.period}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {peakData.topHour && (
                            <div className="text-xs text-error bg-error/10 px-2 py-1 rounded-full">
                                🔥 Peak: {peakData.topHour.hourRange}
                            </div>
                        )}
                        <div className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
                            {peakData.totalHours} ช่วงเวลา
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="collapse-content px-4 pb-4">
                <div className="pt-0">
                    {/* ✅ Tabs สำหรับแยกประเภท */}
                    <div className="tabs tabs-lifted">
                        
                        {/* Tab ช่วงเวลา */}
                        <input 
                            type="radio" 
                            name={`${filterMode}_peak_tabs`}
                            className="tab" 
                            aria-label="⏰ ช่วงเวลา" 
                            defaultChecked 
                        />
                        <div className="tab-content bg-base-100 border-base-300 p-6">
                            {/* Desktop */}
                            <div className="hidden md:block">
                                <table className="table table-xs w-full">
                                    <thead>
                                        <tr>
                                            <th>เวลา</th>
                                            <th className="text-right">ออเดอร์</th>
                                            <th className="text-right">ยอดขาย</th>
                                            <th className="text-right">เฉลี่ย</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {peakData.hours
                                            .sort((a, b) => b.orderCount - a.orderCount)
                                            .slice(0, 10)
                                            .map((hour, index) => {
                                                const popularity = getPopularityLevel(hour.orderCount, maxOrderCount);
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td>
                                                            <span className="mr-1">{popularity.icon}</span>
                                                            {hour.hourRange}
                                                        </td>
                                                        <td className={`text-right font-medium text-${popularity.color}`}>
                                                            {hour.orderCount}
                                                        </td>
                                                        <td className="text-right text-sm">
                                                            {formatNumber(hour.totalSales)}
                                                        </td>
                                                        <td className="text-right text-sm">
                                                            {formatNumber(hour.avgPerOrder)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile */}
                            <div className="md:hidden space-y-1">
                                {peakData.hours
                                    .sort((a, b) => b.orderCount - a.orderCount)
                                    .slice(0, 8)
                                    .map((hour, index) => {
                                        const popularity = getPopularityLevel(hour.orderCount, maxOrderCount);
                                        
                                        return (
                                            <div key={index} className="flex justify-between items-center p-2 bg-base-200/30 rounded text-sm">
                                                <div>
                                                    <span className="mr-1">{popularity.icon}</span>
                                                    <span className="font-medium">{hour.hourRange}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold text-${popularity.color}`}>
                                                        {hour.orderCount} <span className="text-xs font-normal text-base-content/60">ออเดอร์</span>
                                                    </div>
                                                    <div className="text-xs text-base-content/60">
                                                        ฿ {formatNumber(hour.totalSales)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* ✅ Tab วันในสัปดาห์ */}
                        <input 
                            type="radio" 
                            name={`${filterMode}_peak_tabs`}
                            className="tab" 
                            aria-label="📅 ตามวัน" 
                        />
                        <div className="tab-content bg-base-100 border-base-300 p-6">
                            {dayOfWeekStats.length > 0 ? (
                                <>
                                    {/* Desktop */}
                                    <div className="hidden md:block">
                                        <table className="table table-xs w-full">
                                            <thead>
                                                <tr>
                                                    <th>วัน</th>
                                                    <th className="text-right">ออเดอร์</th>
                                                    <th className="text-right">ยอดขาย</th>
                                                    <th className="text-right">เฉลี่ย/วัน</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dayOfWeekStats.map((day, index) => {
                                                    const popularity = getPopularityLevel(day.orderCount, maxDayOrderCount);
                                                    const dayColor = getDayColor(day.dayOfWeek);
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`inline-block w-3 h-3 rounded-full ${dayColor.bg}`}></span>
                                                                    <span className="font-medium">{day.dayName}</span>
                                                                    <span className="text-xs text-base-content/50">
                                                                        ({day.dayCount} วัน)
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className={`text-right font-medium text-${popularity.color}`}>
                                                                {day.orderCount}
                                                            </td>
                                                            <td className="text-right text-sm">
                                                                {formatNumber(day.totalSales)}
                                                            </td>
                                                            <td className="text-right text-sm">
                                                                {formatNumber(day.avgOrdersPerDay)} ออเดอร์
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile */}
                                    <div className="md:hidden space-y-1">
                                        {dayOfWeekStats.map((day, index) => {
                                            const popularity = getPopularityLevel(day.orderCount, maxDayOrderCount);
                                            const dayColor = getDayColor(day.dayOfWeek);
                                            
                                            return (
                                                <div key={index} className="flex justify-between items-center p-2 bg-base-200/30 rounded text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dayColor.bg}`}></span>
                                                        <span className="font-medium">{day.dayName}</span>
                                                        <span className="text-xs text-base-content/50">
                                                            ({day.dayCount})
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold text-${popularity.color}`}>
                                                            {day.orderCount} <span className="text-xs font-normal text-base-content/60">ออเดอร์</span>
                                                        </div>
                                                        <div className="text-xs text-base-content/60">
                                                            เฉลี่ย {Math.round(day.avgOrdersPerDay)}/วัน
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-base-content/60 py-8">
                                    ไม่มีข้อมูลตามวัน
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeakHoursAnalysis;