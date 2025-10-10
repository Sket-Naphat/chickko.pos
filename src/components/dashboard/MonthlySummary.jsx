import React from 'react';

function MonthlySummary({
  selectedYear,
  monthlyData, // รับเป็น array โดยตรง
  formatNumber,
  costData
}) {
  return (
    <div className="bg-base-100 rounded-xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary">
          📊 สรุปรายเดือน - ปี {selectedYear}
        </h2>
        <div className="badge badge-primary badge-outline">
          {monthlyData.length} เดือนที่มีข้อมูล
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-base-content/60">ยังไม่มีข้อมูลในปีนี้</div>
        </div>
      ) : (
        <>
          {/* ✅ Desktop Table - เหมือน DailySummary */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="text-center">📅 เดือน</th>
                  <th className="text-right">🏪 หน้าร้าน</th>
                  <th className="text-right">🛵 เดลิเวอรี่</th>
                  <th className="text-right">💰 ยอดรวม</th>
                  <th className="text-right">📦 ออเดอร์</th>
                  <th className="text-right">💸 ต้นทุน</th>
                  <th className="text-right">💚 กำไร</th>
                  <th className="text-center">📊 %กำไร</th>
                  <th className="text-right">🎯 เฉลี่ย/ออเดอร์</th>
                  <th className="text-center">📈 เฉลี่ยออเดอร์/วัน</th>
                  <th className="text-center">🏆 ขายดี</th>
                  <th className="text-center">⏰ ช่วงเวลาขายดี</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((monthData) => {
                  const profitPercent = monthData.total > 0 ? ((monthData.profit / monthData.total) * 100) : 0;
                  const costPercent = monthData.total > 0 ? ((monthData.cost / monthData.total) * 100) : 0;

                  return (
                    <tr key={monthData.month} className="hover:bg-base-200/50">
                      {/* 1. 📅 เดือน */}
                      <td className="text-center font-medium">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-bold">{monthData.monthName}</div>
                          <div className="text-xs text-base-content/60">{selectedYear}</div>
                        </div>
                      </td>

                      {/* 2. 🏪 หน้าร้าน */}
                      <td className="text-right">
                        {monthData.dineIn > 0 ? (
                          <span className="font-medium text-info">
                            {formatNumber(monthData.dineIn)}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>

                      {/* 3. 🛵 เดลิเวอรี่ */}
                      <td className="text-right">
                        {monthData.delivery > 0 ? (
                          <span className="font-medium text-accent">
                            {formatNumber(monthData.delivery)}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>

                      {/* 4. 💰 ยอดรวม */}
                      <td className="text-right">
                        <span className="font-bold text-primary">
                          {formatNumber(monthData.total)}
                        </span>
                      </td>

                      {/* 5. 📦 ออเดอร์ */}
                      <td className="text-right">
                        <span className="font-bold text-warning">
                          {monthData.totalOrders || 0}
                        </span>
                      </td>

                      {/* 6. 💸 ต้นทุน */}
                      <td className="text-right">
                        {monthData.cost > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-error">
                              {formatNumber(monthData.cost)}
                            </span>
                            <span className="text-xs text-error/60">
                              ({costPercent.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>

                      {/* 7. 💚 กำไร */}
                      <td className="text-right">
                        <span className={`font-bold ${monthData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatNumber(monthData.profit)}
                        </span>
                      </td>

                      {/* 8. 📊 %กำไร */}
                      <td className="text-center">
                        <div className={`badge ${profitPercent >= 20 ? 'badge-success' : profitPercent >= 10 ? 'badge-warning' : 'badge-error'} badge-sm`}>
                          {profitPercent.toFixed(1)}%
                        </div>
                      </td>

                      {/* 9. 🎯 เฉลี่ย/ออเดอร์ */}
                      <td className="text-right">
                        <span className="font-medium text-secondary">
                          {monthData.totalAvgPerOrder ? formatNumber(monthData.totalAvgPerOrder) : '-'}
                        </span>
                      </td>

                      {/* 10. 📈 เฉลี่ยออเดอร์/วัน - เพิ่มคอลัมน์ใหม่ */}
                      <td className="text-center">
                        {(monthData.avgDineInOrdersPerDay > 0 || monthData.avgDeliveryOrdersPerDay > 0) ? (
                          <div className="dropdown dropdown-hover dropdown-left">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                              <span className="text-accent">📈</span>
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72">
                              <li>
                                <div className="text-xs font-bold text-accent mb-2">📈 เฉลี่ยออเดอร์ต่อวัน - {monthData.monthName}</div>

                                {monthData.avgDineInOrdersPerDay > 0 && (
                                  <div className="flex justify-between text-xs p-2 bg-info/10 rounded mb-1">
                                    <span className="flex items-center gap-1">
                                      <span>🏪</span>
                                      <span>หน้าร้าน</span>
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-info">{monthData.avgDineInOrdersPerDay} ออเดอร์/วัน</div>
                                      <div className="text-xs text-info/60">{monthData.dineInDaysCount} วันที่มีออเดอร์</div>
                                    </div>
                                  </div>
                                )}

                                {monthData.avgDeliveryOrdersPerDay > 0 && (
                                  <div className="flex justify-between text-xs p-2 bg-accent/10 rounded">
                                    <span className="flex items-center gap-1">
                                      <span>🛵</span>
                                      <span>เดลิเวอรี่</span>
                                    </span>
                                    <div className="text-right">
                                      <div className="font-bold text-accent">{monthData.avgDeliveryOrdersPerDay} ออเดอร์/วัน</div>
                                      <div className="text-xs text-accent/60">{monthData.deliveryDaysCount} วันที่มีออเดอร์</div>
                                    </div>
                                  </div>
                                )}
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>

                      {/* 11. 🏆 ขายดี */}
                      <td className="text-center">
                        {monthData.topItems && monthData.topItems.length > 0 ? (
                          <div className="dropdown dropdown-hover dropdown-left">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                              <span className="text-warning">🏆</span>
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80">
                              <li>
                                <div className="text-xs font-bold text-warning mb-1">🏆 รายการขายดี Top 3</div>
                                {monthData.topItems.slice(0, 3).map((item, index) => (
                                  <div key={index} className="flex justify-between text-xs p-1">
                                    <span>#{index + 1} {item.menuName}</span>
                                    <span className="font-bold">{item.quantitySold}</span>
                                  </div>
                                ))}
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>

                      {/* 12. ⏰ ช่วงเวลาขายดี */}
                      <td className="text-center">
                        {(() => {
                          // ✅ ใช้ข้อมูลจาก monthData.peakHours แทน dailyData
                          if (!monthData.peakHours || monthData.peakHours.length === 0) {
                            return <span className="text-base-content/40">-</span>;
                          }

                          const sortedPeakHours = monthData.peakHours
                            .sort((a, b) => b.orderCount - a.orderCount)
                            .slice(0, 5);

                          return (
                            <div className="dropdown dropdown-hover dropdown-left">
                              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs text-warning hover:bg-warning/10">
                                <span className="text-xs">⏰</span>
                                <span className="font-medium">Top {sortedPeakHours.length}</span>
                              </div>
                              <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-80 p-4 shadow-lg bg-base-100 border border-warning/20">
                                <div className="card-body p-0">
                                  <h4 className="font-bold text-sm text-warning mb-2 flex items-center gap-1">
                                    <span>⏰</span>
                                    ช่วงเวลาที่ขายดี - {monthData.monthName}
                                  </h4>
                                  <div className="space-y-2">
                                    {sortedPeakHours.map((hour, index) => (
                                      <div key={index} className="flex justify-between items-center p-2 bg-warning/5 rounded border border-warning/10">
                                        <div className="flex items-center gap-2">
                                          <span className={`badge badge-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                              index === 2 ? 'bg-orange-600' :
                                                'bg-gray-500'
                                            }`}>
                                            #{index + 1}
                                          </span>
                                          <span className="font-medium text-sm">
                                            {hour.hourRange}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-warning text-sm">
                                            {hour.orderCount} ออเดอร์
                                          </div>
                                          <div className="text-xs text-base-content/60">
                                            {formatNumber(hour.totalSales)} บาท
                                          </div>
                                          <div className="text-xs text-base-content/50">
                                            เฉลี่ย {formatNumber(hour.avgPerOrder || (hour.totalSales / hour.orderCount))}/ออเดอร์
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ Mobile Layout - เหมือน DailySummary แต่เป็นรายเดือน */}
          <div className="lg:hidden space-y-3">
            {monthlyData.map((monthData) => {
              const profitPercent = monthData.total > 0 ? ((monthData.profit / monthData.total) * 100) : 0;

              return (
                <details key={monthData.month} className="collapse bg-base-100 border border-base-300 rounded-lg shadow-sm">
                  {/* Summary */}
                  <summary className="collapse-title font-medium p-4 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-bold text-base-content">
                          {monthData.monthName}
                        </div>
                        <div className="text-xs text-base-content/60">
                          ปี {selectedYear}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`badge ${profitPercent >= 20 ? 'badge-success' : profitPercent >= 10 ? 'badge-warning' : 'badge-error'} badge-sm font-bold`}>
                          {profitPercent.toFixed(1)}% กำไร
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {formatNumber(monthData.total)} บาท
                        </div>
                      </div>
                    </div>
                  </summary>

                  {/* Content */}
                  <div className="collapse-content">
                    <div className="pt-0 pb-4">
                      {/* Sales Data Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-info/70">🏪 หน้าร้าน</span>
                            <div className="text-right">
                              <div className="font-bold text-info">
                                {monthData.dineIn > 0 ? formatNumber(monthData.dineIn) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-accent/70">🛵 เดลิเวอรี่</span>
                            <div className="text-right">
                              <div className="font-bold text-accent">
                                {monthData.delivery > 0 ? formatNumber(monthData.delivery) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center bg-primary/10 rounded-lg p-2 border border-primary/20">
                          <span className="text-sm font-medium text-primary">💰 ยอดขายรวม</span>
                          <span className="font-bold text-lg text-primary">
                            {formatNumber(monthData.total)}
                          </span>
                        </div>



                        {/* Cost breakdown - เหมือน DailySummary */}
                        {monthData.cost > 0 && (() => {
                          const monthCosts = costData.filter(item => {
                            const date = new Date(item.costDate);
                            return date.getMonth() === monthData.month && date.getFullYear() === selectedYear;
                          });

                          const costBreakdown = {
                            totalRawMaterial: monthCosts.reduce((sum, cost) => sum + (cost.totalRawMaterialCost || 0), 0),
                            totalStaff: monthCosts.reduce((sum, cost) => sum + (cost.totalStaffCost || 0), 0),
                            totalOwner: monthCosts.reduce((sum, cost) => sum + (cost.totalOwnerCost || 0), 0),
                            totalUtility: monthCosts.reduce((sum, cost) => sum + (cost.totalUtilityCost || 0), 0),
                            totalOther: monthCosts.reduce((sum, cost) => sum + (cost.totalOtherCost || 0), 0)
                          };

                          return (
                            <details className="collapse bg-error/10 border-error/20 border rounded-lg">
                              <summary className="collapse-title font-medium p-2 min-h-0 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-error">💸 ต้นทุนรวม</span>
                                  <span className="font-bold text-lg text-error">
                                    {formatNumber(monthData.cost)}
                                  </span>
                                </div>
                              </summary>
                              <div className="collapse-content px-2 pb-2">
                                <div className="space-y-2 pt-2">
                                  {/* ✅ Cost Categories - แก้ไข syntax */}
                                  {[
                                    { name: 'วัตถุดิบ', icon: '🥗', amount: costBreakdown.totalRawMaterial, color: 'text-red-700' },
                                    { name: 'ค่าแรงพนักงาน', icon: '👥', amount: costBreakdown.totalStaff, color: 'text-orange-700' },
                                    { name: 'เงินเดือนทีมบริหาร', icon: '👑', amount: costBreakdown.totalOwner, color: 'text-blue-700' },
                                    { name: 'ค่าสาธารณูปโภค', icon: '⚡', amount: costBreakdown.totalUtility, color: 'text-yellow-700' },
                                    { name: 'ค่าใช้จ่ายอื่นๆ', icon: '📦', amount: costBreakdown.totalOther, color: 'text-gray-700' }
                                  ]
                                    .filter(category => category.amount > 0)
                                    .map((category, index) => {
                                      const percentage = monthData.total > 0 ? ((category.amount / monthData.total) * 100) : 0;
                                      return (
                                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-base-50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-lg">{category.icon}</span>
                                            <div>
                                              <span className={`text-sm font-medium ${category.color}`}>
                                                {category.name}
                                              </span>
                                              <div className="text-xs text-base-content/60">
                                                {percentage.toFixed(1)}% ของยอดขาย
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-base font-bold text-error">
                                              {formatNumber(category.amount)}
                                            </div>
                                            <div className="text-xs text-base-content/50">บาท</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </details>
                          );
                        })()}

                        {/* Profit Summary */}
                        <div className={`flex justify-between items-center ${monthData.profit >= 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'} rounded-lg p-2 border`}>
                          <span className={`text-sm font-medium ${monthData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                            💚 กำไรสุทธิ
                          </span>
                          <div className="text-right">
                            <span className={`font-bold text-lg ${monthData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatNumber(monthData.profit)} บาท
                            </span>
                            {monthData.total > 0 && (
                              <div className={`text-xs ${monthData.profit >= 0 ? 'text-success/70' : 'text-error/70'}`}>
                                ({profitPercent.toFixed(1)}% ของยอดขาย)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* จำนวนออเดอร์ */}
                        {monthData.totalOrders > 0 && (
                          <div className="flex justify-between items-center bg-warning/10 rounded-lg p-2 border border-warning/20">
                            <span className="text-sm font-medium text-warning">📦 จำนวนออเดอร์</span>
                            <span className="font-bold text-lg text-warning">
                              {monthData.totalOrders}
                            </span>
                          </div>
                        )}

                        {/* รายละเอียดแยกตามประเภท - ส่วนเดิม */}
                        {(monthData.dineInOrders > 0 || monthData.deliveryOrders > 0) && (
                          <div className="bg-base-200/50 rounded-lg p-2 border border-base-300">
                            <div className="text-xs font-medium text-base-content/70 mb-2">📊 ยอดขายเฉลี่ยต่อออเดอร์ / จำนวนออเดอร์เฉลี่ยต่อวัน</div>
                            <div className="grid grid-cols-2 gap-2">
                              {monthData.dineInOrders > 0 && (
                                <div className="text-center bg-info/10 rounded p-2">
                                  <div className="text-xs text-info/70">🏪 หน้าร้าน</div>
                                  <div className="font-bold text-info text-sm">
                                    {formatNumber(monthData.dineInAvgPerOrder)}
                                  </div>
                                  <div className="text-xs text-info/60">ต่อออเดอร์</div>
                                  <div className="font-bold text-info text-lg">
                                    {monthData.avgDineInOrdersPerDay}
                                  </div>
                                  <div className="text-xs text-info/60">ออเดอร์ต่อวัน</div>
                                </div>
                              )}
                              {monthData.deliveryOrders > 0 && (
                                <div className="text-center bg-accent/10 rounded p-2">
                                  <div className="text-xs text-accent/70">🛵 เดลิเวอรี่</div>
                                  <div className="font-bold text-accent text-sm">
                                    {formatNumber(monthData.deliveryAvgPerOrder)}
                                  </div>
                                  <div className="text-xs text-accent/60">ต่อออเดอร์</div>
                                  <div className="font-bold text-accent text-lg">
                                    {monthData.avgDeliveryOrdersPerDay}
                                  </div>
                                  <div className="text-xs text-accent/60">ออเดอร์ต่อวัน</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Top 5 Selling Items - Tab แยกประเภทเหมือน DailySummary */}
                      {(monthData.topItems?.length > 0 || monthData.topDeliveryItems?.length > 0) && (
                        <div className="collapse bg-base-100 border-base-300 border">
                          <input type="checkbox" />
                          <div className="collapse-title font-semibold min-h-0 p-0">
                            <div className="flex justify-between items-center p-2">
                              <div className="flex items-center gap-2">
                                <span className="text-warning text-lg">🏆</span>
                                <span className="text-sm font-medium text-warning">รายการที่ขายดี Top 5</span>
                              </div>
                              <div className="text-xs text-warning/70">
                                {monthData.monthName} {selectedYear}
                              </div>
                            </div>
                          </div>
                          <div className="collapse-content px-3 pb-3">
                            <div className="pt-3">
                              <div className="tabs tabs-lifted">
                                {/* Tab Dine-in */}
                                {monthData.topItems?.length > 0 && (
                                  <>
                                    <input
                                      type="radio"
                                      name={`monthly_top5_${monthData.month}`}
                                      className="tab"
                                      aria-label="🏪 หน้าร้าน"
                                      defaultChecked
                                    />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-info text-lg">🏪</span>
                                          <span className="text-sm font-bold text-info">รายการขายดี Top 5 หน้าร้าน</span>
                                          <div className="badge badge-info badge-sm">
                                            {monthData.topItems.length} รายการ
                                          </div>
                                        </div>

                                        {monthData.topItems.slice(0, 5).map((item, index) => (
                                          <div key={index} className="flex justify-between items-center bg-info/5 rounded-lg p-3 border border-info/10">
                                            <div className="flex items-center gap-2">
                                              <span className={`badge badge-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                  index === 2 ? 'bg-orange-600' :
                                                    'bg-gray-500'
                                                }`}>
                                                #{index + 1}
                                              </span>
                                              <span className="text-sm font-medium truncate max-w-[120px]">
                                                {item.menuName}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-sm font-bold text-info">
                                                {item.quantitySold} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(item.totalSales)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Tab Delivery */}
                                {monthData.topDeliveryItems?.length > 0 && (
                                  <>
                                    <input
                                      type="radio"
                                      name={`monthly_top5_${monthData.month}`}
                                      className="tab"
                                      aria-label="🛵 เดลิเวอรี่"
                                    />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-accent text-lg">🛵</span>
                                          <span className="text-sm font-bold text-accent">รายการขายดี Top 5 เดลิเวอรี่</span>
                                          <div className="badge badge-accent badge-sm">
                                            {monthData.topDeliveryItems.length} รายการ
                                          </div>
                                        </div>

                                        {monthData.topDeliveryItems.slice(0, 5).map((item, index) => (
                                          <div key={index} className="flex justify-between items-center bg-accent/5 rounded-lg p-3 border border-accent/10">
                                            <div className="flex items-center gap-2">
                                              <span className={`badge badge-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                  index === 2 ? 'bg-orange-600' :
                                                    'bg-gray-500'
                                                }`}>
                                                #{index + 1}
                                              </span>
                                              <span className="text-sm font-medium truncate max-w-[120px]">
                                                {item.menuName}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-sm font-bold text-accent">
                                                {item.quantitySold} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(item.totalSales)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* แสดง Message ถ้าไม่มีข้อมูล */}
                                {(!monthData.topItems || monthData.topItems.length === 0) &&
                                  (!monthData.topDeliveryItems || monthData.topDeliveryItems.length === 0) && (
                                    <div className="text-center py-4">
                                      <div className="text-2xl mb-2">📊</div>
                                      <div className="text-sm text-base-content/60">ไม่มีข้อมูลรายการขายดี</div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {monthData.peakHours && monthData.peakHours.length > 0 && (
                        <div className="collapse bg-base-100 border border-warning/20 rounded-lg mt-4">
                          <input type="checkbox" />
                          <div className="collapse-title font-semibold min-h-0 p-0">
                            <div className="flex justify-between items-center p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-warning text-lg">⏱️</span>
                                <span className="text-sm font-bold text-warning">
                                  ช่วงเวลาที่ขายดี Top {monthData.peakHours.length}
                                </span>
                              </div>
                              <div className="text-xs text-warning/70 bg-warning/10 px-2 py-1 rounded-full">
                                คลิกเพื่อดู
                              </div>
                            </div>
                          </div>
                          <div className="collapse-content px-3 pb-3">
                            <div className="pt-0">
                              <div className="tabs tabs-lifted">
                                {/* Tab รวม */}
                                <input type="radio" name={`peak_tabs_${monthData.month}`} className="tab" aria-label="📊 รวม" defaultChecked />
                                <div className="tab-content bg-base-100 border-base-300 p-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="text-warning text-sm">📊</span>
                                      <span className="font-bold text-warning text-sm">ช่วงเวลารวม</span>
                                      <div className="badge badge-warning badge-sm">
                                        {monthData.peakHours.length} ช่วง
                                      </div>
                                    </div>
                                    {monthData.peakHours.map((hour, index) => (
                                      <div key={index} className="flex justify-between items-center bg-warning/5 rounded-lg p-2 border border-warning/10">
                                        <div className="flex items-center gap-2">
                                          <span className={`badge badge-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                              index === 2 ? 'bg-orange-600' :
                                                'bg-gray-500'
                                            }`}>
                                            #{index + 1}
                                          </span>
                                          <span className="text-xs font-medium">
                                            {hour.hourRange}
                                          </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs font-bold text-warning">
                                            {hour.orderCount} <span className="text-xs font-normal text-base-content/60">ออเดอร์</span>
                                          </span>
                                          <span className="text-xs text-base-content/60">
                                            ฿ {formatNumber(hour.totalSales)}
                                          </span>
                                          <span className="text-xs text-base-content/50">
                                            เฉลี่ย {formatNumber(hour.avgPerOrder)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Tab หน้าร้าน */}
                                {monthData.dineInPeakHours && monthData.dineInPeakHours.length > 0 && (
                                  <>
                                    <input type="radio" name={`peak_tabs_${monthData.month}`} className="tab" aria-label="🏪 หน้าร้าน" />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-info text-sm">🏪</span>
                                          <span className="font-bold text-info text-sm">ช่วงเวลาหน้าร้าน</span>
                                          <div className="badge badge-info badge-sm">
                                            {monthData.dineInPeakHours.length} ช่วง
                                          </div>
                                        </div>
                                        {monthData.dineInPeakHours.map((hour, index) => (
                                          <div key={index} className="flex justify-between items-center bg-info/5 rounded-lg p-2 border border-info/10">
                                            <div className="flex items-center gap-2">
                                              <span className={`badge badge-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                  index === 2 ? 'bg-orange-600' :
                                                    'bg-gray-500'
                                                }`}>
                                                #{index + 1}
                                              </span>
                                              <span className="text-xs font-medium">
                                                {hour.hourRange}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-bold text-info">
                                                {hour.orderCount} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(hour.totalSales)}
                                              </span>
                                              <span className="text-xs text-base-content/50">
                                                เฉลี่ย {formatNumber(hour.avgPerOrder)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Tab เดลิเวอรี่ */}
                                {monthData.deliveryPeakHours && monthData.deliveryPeakHours.length > 0 && (
                                  <>
                                    <input type="radio" name={`peak_tabs_${monthData.month}`} className="tab" aria-label="🛵 เดลิเวอรี่" />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-accent text-sm">🛵</span>
                                          <span className="font-bold text-accent text-sm">ช่วงเวลาเดลิเวอรี่</span>
                                          <div className="badge badge-accent badge-sm">
                                            {monthData.deliveryPeakHours.length} ช่วง
                                          </div>
                                        </div>
                                        {monthData.deliveryPeakHours.map((hour, index) => (
                                          <div key={index} className="flex justify-between items-center bg-accent/5 rounded-lg p-2 border border-accent/10">
                                            <div className="flex items-center gap-2">
                                              <span className={`badge badge-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                  index === 2 ? 'bg-orange-600' :
                                                    'bg-gray-500'
                                                }`}>
                                                #{index + 1}
                                              </span>
                                              <span className="text-xs font-medium">
                                                {hour.hourRange}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-bold text-accent">
                                                {hour.orderCount} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(hour.totalSales)}
                                              </span>
                                              <span className="text-xs text-base-content/50">
                                                เฉลี่ย {formatNumber(hour.avgPerOrder)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlySummary;