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

    // คำนวณ Peak Hours ตามโหมด
    const getPeakHours = () => {
        if (filterMode === 'month') {
            // รวบรวม peakHours จากทุกวันในเดือน
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

            // คำนวณค่าเฉลี่ยและแยกประเภท
            const processedHours = Object.values(combinedHours)
                .map(hour => ({
                    ...hour,
                    avgPerOrder: hour.orderCount > 0 ? hour.totalSales / hour.orderCount : 0,
                    // แปลงช่วงเวลาเป็นตัวเลขเพื่อเรียงลำดับ
                    sortValue: parseInt(hour.hourRange.split(':')[0])
                }))
                .sort((a, b) => a.sortValue - b.sortValue); // เรียงตามเวลา

            return {
                hours: processedHours,
                period: `${months[selectedMonth]} ${selectedYear}`,
                totalHours: processedHours.length,
                topHour: processedHours.length > 0 ?
                    processedHours.reduce((max, hour) => hour.orderCount > max.orderCount ? hour : max) : null
            };
        } else {
            // ✅ ใช้ monthlyData สำหรับโหมดรายปี
            const yearlyHours = monthlyData
                .filter(month => month.total > 0) // กรองเฉพาะเดือนที่มีข้อมูล
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

    // กำหนดระดับความ popular ของช่วงเวลา (แบบง่าย)
    const getPopularityLevel = (orderCount, maxCount) => {
        const percentage = maxCount > 0 ? (orderCount / maxCount) * 100 : 0;
        
        if (percentage >= 70) return { color: 'error', icon: '🔥' };
        if (percentage >= 50) return { color: 'warning', icon: '⚡' };
        if (percentage >= 30) return { color: 'info', icon: '📊' };
        return { color: 'success', icon: '💚' };
    };

    // ถ้าไม่มีข้อมูล
    if (peakData.hours.length === 0) {
        return (
            <div className="bg-base-100 rounded-xl shadow p-6 text-center">
                <div className="text-4xl mb-2">⏱️</div>
                <div className="text-base-content/60">
                    ไม่มีข้อมูลช่วงเวลาขายดี ใน{peakData.period}
                </div>
            </div>
        );
    }

    const maxOrderCount = Math.max(...peakData.hours.map(h => h.orderCount));

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

                {/* รายการแบบง่าย Top 10 */}
                <div>
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
            </div>
        </div>
    );
};

export default PeakHoursAnalysis;