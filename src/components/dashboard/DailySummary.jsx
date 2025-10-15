import React from 'react';

const DailySummary = ({
  selectedMonth,
  selectedYear,
  months,
  dailyData, // ✅ รับเป็น array โดยตรง
  formatDate,
  formatNumber,
  costData
}) => {
  return (
    <div className="bg-base-100 rounded-xl shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary">
          📊 สรุปรายวัน - {months[selectedMonth]} {selectedYear}
        </h2>
        <div className="badge badge-primary badge-outline">
          {dailyData.length} วันที่มีข้อมูล
        </div>
      </div>

      {dailyData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-base-content/60">ยังไม่มีข้อมูลในเดือนนี้</div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table table-zebra w-full">

              <thead>
                <tr className="bg-base-200">
                  <th className="text-center">📅 วันที่</th>
                  <th className="text-right">🏪 หน้าร้าน</th>
                  <th className="text-right">🛵 เดลิเวอรี่</th>
                  <th className="text-right">💰 ยอดรวม</th>
                  <th className="text-right">📦 ออเดอร์</th>
                  <th className="text-right">💸 ต้นทุน</th>
                  <th className="text-right">💚 กำไร</th>
                  <th className="text-center">📊 %กำไร</th>
                  <th className="text-right">🎯 เฉลี่ย/ออเดอร์</th>
                  <th className="text-center">⏰ ช่วงเวลาขายดี</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((dayData) => {
                  const profitPercent = dayData.total > 0 ? ((dayData.profit / dayData.total) * 100) : 0;
                  const costPercent = dayData.total > 0 ? ((dayData.cost / dayData.total) * 100) : 0;

                  return (
                    <tr key={dayData.date} className="hover:bg-base-200/50">
                      <td className="text-center font-medium">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-bold">{formatDate(dayData.date)}</div>
                          <div className="text-xs text-base-content/60">{dayData.day}</div>
                        </div>
                      </td>
                      <td className="text-right">
                        {dayData.dineIn > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-info">
                              {formatNumber(dayData.dineIn)}
                            </span>
                            <span className="text-xs text-info/60">
                              {dayData.dineInOrders} ออเดอร์
                            </span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        {dayData.delivery > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-accent">
                              {formatNumber(dayData.delivery)}
                            </span>
                            <span className="text-xs text-accent/60">
                              {dayData.deliveryOrders} ออเดอร์
                            </span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-primary">
                          {formatNumber(dayData.total)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-warning">
                          {dayData.totalOrders}
                        </span>
                      </td>
                      <td className="text-right">
                        {dayData.cost > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-error">
                              {formatNumber(dayData.cost)}
                            </span>
                            <span className="text-xs text-error/60">
                              ({costPercent.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className={`font-bold ${dayData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatNumber(dayData.profit)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className={`badge ${profitPercent >= 20 ? 'badge-success' : profitPercent >= 10 ? 'badge-warning' : 'badge-error'} badge-sm`}>
                          {profitPercent.toFixed(1)}%
                        </div>
                      </td>
                      <td className="text-right">
                        {dayData.totalOrders > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-secondary">
                              {formatNumber(dayData.totalAvgPerOrder)}
                            </span>
                            <div className="text-xs text-secondary/60">
                              ต่อออเดอร์
                            </div>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      {/* ✅ เพิ่ม td สำหรับ Peak Hours ใน Desktop Table Body */}
                      <td className="text-center">
                        {dayData.peakHours && dayData.peakHours.length > 0 ? (
                          <div className="dropdown dropdown-hover">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs text-primary hover:bg-primary/10">
                              <span className="text-xs">⏰</span>
                              <span className="font-medium">Top {dayData.peakHours.length}</span>
                            </div>
                            <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-80 p-4 shadow-lg bg-base-100 border border-primary/20">
                              <div className="card-body p-0">
                                <h4 className="font-bold text-sm text-primary mb-2 flex items-center gap-1">
                                  <span>⏰</span>
                                  ช่วงเวลาที่ขายดี - {formatDate(dayData.date)}
                                </h4>
                                <div className="space-y-2">
                                  {dayData.peakHours.map((hour, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-primary/5 rounded border border-primary/10">
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
                                        <div className="font-bold text-primary text-sm">
                                          {hour.orderCount} ออเดอร์
                                        </div>
                                        <div className="text-xs text-base-content/60">
                                          {formatNumber(hour.totalSales)} บาท
                                        </div>
                                        <div className="text-xs text-base-content/50">
                                          เฉลี่ย {formatNumber(hour.avgPerOrder)}/ออเดอร์
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Collapse Layout */}
          <div className="lg:hidden space-y-3">
            {dailyData.map((dayData) => {
              const profitPercent = dayData.total > 0 ? ((dayData.profit / dayData.total) * 100) : 0;
              const costPercent = dayData.total > 0 ? ((dayData.cost + dayData.dineInDiscount) / dayData.total) * 100 : 0;

              return (
                <details key={dayData.date} className="collapse bg-base-100 border border-base-300 rounded-lg shadow-sm">
                  {/* Summary - แสดงข้อมูลสำคัญ */}
                  <summary className="collapse-title font-medium p-4 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-bold text-base-content">
                          {formatDate(dayData.date)}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {new Date(dayData.date).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`badge ${profitPercent >= 20 ? 'badge-success' : profitPercent >= 10 ? 'badge-warning' : 'badge-error'} badge-sm font-bold`}>
                          {profitPercent.toFixed(1)}% กำไร
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {formatNumber(dayData.total)} บาท
                        </div>
                      </div>
                    </div>
                  </summary>

                  {/* Content - รายละเอียดทั้งหมด */}
                  <div className="collapse-content">
                    <div className="pt-0 pb-4">
                      {/* Sales Data Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-info/70">🏪 หน้าร้าน</span>
                            <div className="text-right">
                              <div className="font-bold text-info">
                                {dayData.dineIn > 0 ? formatNumber(dayData.dineIn) : '-'}
                              </div>
                              {dayData.dineInOrders > 0 && (
                                <div className="text-xs text-info/60">
                                  {dayData.dineInOrders} ออเดอร์
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-accent/70">🛵 เดลิเวอรี่</span>
                            <div className="text-right">
                              <div className="font-bold text-accent">
                                {dayData.delivery > 0 ? formatNumber(dayData.delivery) : '-'}
                              </div>
                              {dayData.deliveryOrders > 0 && (
                                <div className="text-xs text-accent/60">
                                  {dayData.deliveryOrders} ออเดอร์
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center bg-primary/10 rounded-lg p-2 border border-primary/20">
                          <span className="text-sm font-medium text-primary">💰 ยอดขายรวม</span>
                          <span className="font-bold text-lg text-primary">
                            {formatNumber(dayData.total)}
                          </span>
                        </div>

                        {dayData.totalOrders > 0 && (
                          <div className="flex justify-between items-center bg-warning/10 rounded-lg p-2 border border-warning/20">
                            <span className="text-sm font-medium text-warning">📦 จำนวนออเดอร์</span>
                            <span className="font-bold text-lg text-warning">
                              {dayData.totalOrders}
                            </span>
                          </div>
                        )}

                        {/* ✅ เพิ่มรายได้เฉลี่ยต่อออเดอร์ */}
                        {/* {dayData.totalOrders > 0 && (
                          <div className="flex justify-between items-center bg-secondary/10 rounded-lg p-2 border border-secondary/20">
                            <span className="text-sm font-medium text-secondary">🎯 รายได้เฉลี่ย/ออเดอร์</span>
                            <span className="font-bold text-lg text-secondary">
                              {formatNumber(dayData.totalAvgPerOrder)}
                            </span>
                          </div>
                        )} */}

                        {/* ✅ เพิ่มรายละเอียดแยกตามประเภท */}
                        {(dayData.dineInOrders > 0 || dayData.deliveryOrders > 0) && (
                          <div className="bg-base-200/50 rounded-lg p-2 border border-base-300">
                            <div className="text-xs font-medium text-base-content/70 mb-2">📊 ยอดขายเฉลี่ยต่อออเดอร์</div>
                            <div className="grid grid-cols-2 gap-2">
                              {dayData.dineInOrders > 0 && (
                                <div className="text-center bg-info/10 rounded p-2">
                                  <div className="text-xs text-info/70">🏪 หน้าร้าน</div>
                                  <div className="font-bold text-info text-sm">
                                    {formatNumber(dayData.dineInAvgPerOrder)}
                                  </div>
                                  <div className="text-xs text-info/60">ต่อออเดอร์</div>
                                </div>
                              )}
                              {dayData.deliveryOrders > 0 && (
                                <div className="text-center bg-accent/10 rounded p-2">
                                  <div className="text-xs text-accent/70">🛵 เดลิเวอรี่</div>
                                  <div className="font-bold text-accent text-sm">
                                    {formatNumber(dayData.deliveryAvgPerOrder)}
                                  </div>
                                  <div className="text-xs text-accent/60">ต่อออเดอร์</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* สรุปต้นทุนของวัน - แบบ Collapse */}
                        {dayData.cost > 0 && (() => {
                          const dayCosts = costData.filter(item => item.costDate === dayData.date);
                          return dayCosts.length > 0 ? (
                            <div className="bg-error/5 rounded-lg border border-error/20 mt-4">
                              <details className="collapse">
                                <summary className="collapse-title min-h-0 p-0 cursor-pointer hover:bg-error/10 transition-colors">
                                  <div className="flex justify-between items-center p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-error text-lg">💸</span>
                                      <span className="text-sm font-medium text-error">ต้นทุนรวม</span>
                                      <span className="text-xs text-error/60 bg-error/10 px-2 py-1 rounded-full">
                                        คลิกเพื่อดูรายละเอียด
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-error">
                                        {formatNumber(dayData.cost + dayData.dineInDiscount)}
                                      </div>
                                      <div className="text-xs text-error/70">
                                        {costPercent.toFixed(1)}% จากยอดขาย
                                      </div>
                                    </div>
                                  </div>
                                </summary>

                                <div className="collapse-content px-3 pb-3">
                                  <div className="pt-3 space-y-2">
                                    {(() => {
                                      // รวมต้นทุนแต่ละประเภทของวันนั้น
                                      const dayTotalRawMaterial = dayCosts.reduce((sum, cost) =>
                                        sum + (cost.totalRawMaterialCost || 0), 0);
                                      const dayTotalStaff = dayCosts.reduce((sum, cost) =>
                                        sum + (cost.totalStaffCost || 0), 0);
                                      const dayTotalOwner = dayCosts.reduce((sum, cost) =>
                                        sum + (cost.totalOwnerCost || 0), 0);
                                      const dayTotalUtility = dayCosts.reduce((sum, cost) =>
                                        sum + (cost.totalUtilityCost || 0), 0);
                                      const dayTotalOther = dayCosts.reduce((sum, cost) =>
                                        sum + (cost.totalOtherCost || 0), 0);
                                      const dineInDiscount = dayData.dineInDiscount || 0; // ส่วนลดหน้าร้าน

                                      // สร้างรายการประเภทต้นทุนที่มีค่า
                                      const costCategories = [
                                        {
                                          name: 'วัตถุดิบ',
                                          icon: '🥗',
                                          amount: dayTotalRawMaterial,
                                          textColor: 'text-orange-700'
                                        },
                                        {
                                          name: 'ค่าแรงพนักงาน',
                                          icon: '👥',
                                          amount: dayTotalStaff,
                                          textColor: 'text-blue-700'
                                        },
                                        {
                                          name: 'เงินเดือนทีมบริหาร',
                                          icon: '👑',
                                          amount: dayTotalOwner,
                                          textColor: 'text-purple-700'
                                        },
                                        {
                                          name: 'ค่าสาธารณูปโภค',
                                          icon: '⚡',
                                          amount: dayTotalUtility,
                                          textColor: 'text-yellow-700'
                                        },
                                        {
                                          name: 'ค่าใช้จ่ายอื่นๆ',
                                          icon: '📦',
                                          amount: dayTotalOther,
                                          textColor: 'text-gray-700'
                                        },
                                        {
                                          name: 'ส่วนลดหน้าร้าน',
                                          icon: '🏷️',
                                          amount: dineInDiscount,
                                          textColor: 'text-red-700'
                                        }
                                      ].filter(category => category.amount > 0); // แสดงเฉพาะประเภทที่มีค่า

                                      return (
                                        <>
                                          {/* Header */}
                                          <div className="flex items-center justify-between pb-2 border-b border-error/20">
                                            <h4 className="text-sm font-semibold text-error flex items-center gap-1">
                                              <span>💰</span>
                                              สรุปต้นทุน
                                            </h4>
                                            <span className="text-xs text-error/60 bg-error/10 px-2 py-1 rounded-full">
                                              {costCategories.length} ประเภท
                                            </span>
                                          </div>

                                          {/* รายการต้นทุน */}
                                          <div className="space-y-2">
                                            {costCategories.map((category, index) => {
                                              const percentage = dayData.total > 0 ? ((category.amount / dayData.total) * 100) : 0;

                                              return (
                                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-base-50 rounded-lg">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-lg">{category.icon}</span>
                                                    <div>
                                                      <span className={`text-sm font-medium ${category.textColor}`}>
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
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </details>
                            </div>
                          ) : null;
                        })()}

                        <div className={`flex justify-between items-center ${dayData.profit >= 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'} rounded-lg p-2 border`}>
                          <span className={`text-sm font-medium ${dayData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                            💚 กำไรสุทธิ
                          </span>
                          <div className="text-right">
                            <span className={`font-bold text-lg ${dayData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatNumber(dayData.profit)} บาท
                            </span>
                            {dayData.total > 0 && (
                              <div className={`text-xs ${dayData.profit >= 0 ? 'text-success/70' : 'text-error/70'}`}>
                                ({profitPercent.toFixed(1)}% ของยอดขาย)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top 5 Selling Items */}
                      {(dayData.topItems?.length > 0 || dayData.topDeliveryItems?.length > 0) && (
                        <div className="collapse bg-base-100 border-base-300 border">
                          <input type="checkbox" />
                          <div className="collapse-title font-semibold min-h-0 p-0">
                            <div className="flex justify-between items-center p-2">
                              <div className="flex items-center gap-2">
                                <span className="text-warning text-lg">🏆</span>
                                <span className="text-sm font-medium text-warning">รายการที่ขายดี Top 5</span>
                              </div>
                              <div className="text-xs text-warning/70 bg-warning/10 px-2 py-1 rounded-full">
                                คลิกเพื่อดู
                              </div>
                            </div>
                          </div>
                          <div className="collapse-content px-3 pb-3">
                            <div className="pt-3">
                              <div className="tabs tabs-lifted">
                                {/* Tab Dine-in */}
                                {dayData.topItems?.length > 0 && (
                                  <>
                                    <input
                                      type="radio"
                                      name={`daily_top5_${dayData.date}`}
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
                                            {dayData.topItems.length} รายการ
                                          </div>
                                        </div>

                                        {dayData.topItems.slice(0, 5).map((item, index) => (
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
                                                {item.menuName || item.MenuName}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-sm font-bold text-info">
                                                {item.quantitySold || item.QuantitySold} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(item.totalSales || item.TotalSales)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Tab Delivery */}
                                {dayData.topDeliveryItems?.length > 0 && (
                                  <>
                                    <input
                                      type="radio"
                                      name={`daily_top5_${dayData.date}`}
                                      className="tab"
                                      aria-label="🛵 เดลิเวอรี่"
                                    />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-accent text-lg">🛵</span>
                                          <span className="text-sm font-bold text-accent">รายการขายดี Top 5 เดลิเวอรี่</span>
                                          <div className="badge badge-accent badge-sm">
                                            {dayData.topDeliveryItems.length} รายการ
                                          </div>
                                        </div>

                                        {dayData.topDeliveryItems.slice(0, 5).map((item, index) => (
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
                                                {item.menuName || item.MenuName}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-sm font-bold text-accent">
                                                {item.quantitySold || item.QuantitySold} ออเดอร์
                                              </span>
                                              <span className="text-xs text-base-content/60">
                                                {formatNumber(item.totalSales || item.TotalSales)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* แสดง Message ถ้าไม่มีข้อมูล */}
                                {(!dayData.topItems || dayData.topItems.length === 0) &&
                                  (!dayData.topDeliveryItems || dayData.topDeliveryItems.length === 0) && (
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

                      {/* ✅ Peak Hours Section */}
                      {dayData.peakHours && dayData.peakHours.length > 0 && (
                        <div className="collapse bg-base-100 border border-warning/20 rounded-lg mt-4">
                          <input type="checkbox" />
                          <div className="collapse-title font-semibold min-h-0 p-0">
                            <div className="flex justify-between items-center p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-warning text-lg">⏱️</span>
                                <span className="text-sm font-bold text-warning">
                                  ช่วงเวลาที่ขายดี Top {dayData.peakHours.length}
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
                                <input type="radio" name={`peak_tabs_${dayData.date}`} className="tab" aria-label="📊 รวม" defaultChecked />
                                <div className="tab-content bg-base-100 border-base-300 p-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="text-warning text-sm">📊</span>
                                      <span className="font-bold text-warning text-sm">ช่วงเวลารวม</span>
                                      <div className="badge badge-warning badge-sm">
                                        {dayData.peakHours.length} ช่วง
                                      </div>
                                    </div>
                                    {dayData.peakHours.map((hour, index) => (
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
                                {dayData.dineInPeakHours && dayData.dineInPeakHours.length > 0 && (
                                  <>
                                    <input type="radio" name={`peak_tabs_${dayData.date}`} className="tab" aria-label="🏪 หน้าร้าน" />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-info text-sm">🏪</span>
                                          <span className="font-bold text-info text-sm">ช่วงเวลาหน้าร้าน</span>
                                          <div className="badge badge-info badge-sm">
                                            {dayData.dineInPeakHours.length} ช่วง
                                          </div>
                                        </div>
                                        {dayData.dineInPeakHours.map((hour, index) => (
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
                                {dayData.deliveryPeakHours && dayData.deliveryPeakHours.length > 0 && (
                                  <>
                                    <input type="radio" name={`peak_tabs_${dayData.date}`} className="tab" aria-label="🛵 เดลิเวอรี่" />
                                    <div className="tab-content bg-base-100 border-base-300 p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-accent text-sm">🛵</span>
                                          <span className="font-bold text-accent text-sm">ช่วงเวลาเดลิเวอรี่</span>
                                          <div className="badge badge-accent badge-sm">
                                            {dayData.deliveryPeakHours.length} ช่วง
                                          </div>
                                        </div>
                                        {dayData.deliveryPeakHours.map((hour, index) => (
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

export default DailySummary;