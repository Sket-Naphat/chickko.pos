import React from 'react';

const MonthlySummary = ({
  selectedYear,
  getMonthlyData,
  formatNumber,
  costData,
  costTotal
}) => {
  return (
    <div className="bg-base-100 rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary">
          📊 สรุปรายเดือน - ปี {selectedYear}
        </h2>
        <div className="badge badge-primary badge-outline">
          {getMonthlyData().length} เดือนที่มีข้อมูล
        </div>
      </div>

      {getMonthlyData().length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-base-content/60">ยังไม่มีข้อมูลในปีนี้</div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="text-center">📅 เดือน</th>
                  <th className="text-right">🏪 หน้าร้าน</th>
                  <th className="text-right">🛵 เดลิเวอรี่</th>
                  <th className="text-right">💰 ยอดรวม</th>
                  <th className="text-right">💸 ต้นทุน</th>
                  <th className="text-right">💚 กำไร</th>
                  <th className="text-center">📊 %กำไร</th>
                </tr>
              </thead>
              <tbody>
                {getMonthlyData().map((monthData) => {
                  const profitPercent = monthData.total > 0 ? ((monthData.profit / monthData.total) * 100) : 0;
                  const costPercent = monthData.total > 0 ? ((monthData.cost / monthData.total) * 100) : 0;

                  return (
                    <tr key={monthData.month} className="hover:bg-base-200/50">
                      <td className="text-center font-medium">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-bold">{monthData.monthName}</div>
                          <div className="text-xs text-base-content/60">{selectedYear}</div>
                        </div>
                      </td>
                      <td className="text-right">
                        {monthData.dineIn > 0 ? (
                          <span className="font-medium text-info">
                            {formatNumber(monthData.dineIn)}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        {monthData.delivery > 0 ? (
                          <span className="font-medium text-accent">
                            {formatNumber(monthData.delivery)}
                          </span>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-primary">
                          {formatNumber(monthData.total)}
                        </span>
                      </td>
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
                      <td className="text-right">
                        <span className={`font-bold ${monthData.profit >= 0 ? 'text-success' : 'text-error'}`}>
                          {formatNumber(monthData.profit)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className={`badge ${profitPercent >= 20 ? 'badge-success' : profitPercent >= 10 ? 'badge-warning' : 'badge-error'} badge-sm`}>
                          {profitPercent.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Collapse Layout */}
          <div className="lg:hidden space-y-3">
            {getMonthlyData().map((monthData) => {
              const profitPercent = monthData.total > 0 ? ((monthData.profit / monthData.total) * 100) : 0;
              const costPercent = monthData.total > 0 ? ((monthData.cost / monthData.total) * 100) : 0;

              return (
                <details key={monthData.month} className="collapse bg-base-100 border border-base-300 rounded-lg shadow-sm">
                  {/* Summary - แสดงข้อมูลสำคัญ */}
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

                  {/* Content - รายละเอียดทั้งหมด */}
                  <div className="collapse-content">
                    <div className="pt-0 pb-4 px-4">
                      {/* Sales Data Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-info/10 rounded-lg p-3 border border-info/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-info/70">🏪 หน้าร้าน</span>
                            <span className="font-bold text-info">
                              {monthData.dineIn > 0 ? formatNumber(monthData.dineIn) : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-accent/70">🛵 เดลิเวอรี่</span>
                            <span className="font-bold text-accent">
                              {monthData.delivery > 0 ? formatNumber(monthData.delivery) : '-'}
                            </span>
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

                        {monthData.cost > 0 && (
                          <div className="flex justify-between items-center bg-error/10 rounded-lg p-2 border border-error/20">
                            <span className="text-sm font-medium text-error">
                              💸 ต้นทุน ({costPercent.toFixed(1)}%)
                            </span>
                            <span className="font-bold text-lg text-error">
                              {formatNumber(monthData.cost)}
                            </span>
                          </div>
                        )}

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
                      </div>

                      {/* Top 5 Selling Items ของเดือน */}
                      {monthData.topItems && monthData.topItems.length > 0 && (
                        <div className="collapse bg-base-100 border-base-300 border mb-4">
                          <input type="checkbox" />
                          <div className="collapse-title font-semibold min-h-0 p-0">
                            <div className="flex justify-between items-center p-2">
                              <div className="flex items-center gap-2">
                                <span className="text-warning text-lg">🏆</span>
                                <span className="text-sm font-medium text-warning">รายการที่ขายดี Top 5</span>
                              </div>
                              <div className="text-xs text-warning/70">
                                {monthData.topItems.length} รายการ
                              </div>
                            </div>
                          </div>
                          <div className="collapse-content px-3 pb-3">
                            <div className="pt-3 space-y-2">
                              {monthData.topItems.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-base-100/50 rounded p-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`badge badge-sm ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-info' : index === 2 ? 'badge-accent' : 'badge-neutral'}`}>
                                      #{index + 1}
                                    </span>
                                    <span className="text-xs font-medium truncate max-w-[120px]">
                                      {item.menuName}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-warning">
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
                        </div>
                      )}

                      {/* สรุปต้นทุนของเดือน */}
                      {(() => {
                        const monthCosts = costData.filter(item => {
                          const date = new Date(item.costDate);
                          return date.getMonth() === monthData.month && date.getFullYear() === selectedYear;
                        });

                        return monthCosts.length > 0 ? (
                          <div className="bg-error/5 rounded-lg p-3 border border-error/20 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-error text-lg">💸</span>
                              <span className="text-sm font-semibold text-error">สรุปต้นทุนประจำเดือน</span>
                            </div>

                            {/* กลุ่มต้นทุนตามประเภท */}
                            {(() => {
                              const costsByType = monthCosts.reduce((acc, cost) => {
                                const type = cost.costType || 'อื่นๆ';
                                if (!acc[type]) {
                                  acc[type] = [];
                                }
                                acc[type].push(cost);
                                return acc;
                              }, {});

                              return Object.entries(costsByType).map(([type, costs]) => (
                                <div key={type} className="mb-3">
                                  <div className="text-xs font-semibold text-error/80 mb-2 px-2">
                                    📁 {type} ({costs.length} รายการ)
                                  </div>
                                  <div className="space-y-1">
                                    {costs.slice(0, 3).map((cost, index) => (
                                      <div key={index} className="flex justify-between items-center bg-base-100/70 rounded p-2">
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-base-content">
                                            {cost.costName || cost.description || 'รายการต้นทุน'}
                                          </div>
                                          <div className="text-xs text-base-content/60">
                                            {new Date(cost.costDate).toLocaleDateString('th-TH')}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-bold text-error">
                                            {formatNumber(cost.totalAmount || 0)}
                                          </div>
                                          {cost.quantity && (
                                            <div className="text-xs text-error/70">
                                              {cost.quantity} {cost.unit || 'หน่วย'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {costs.length > 3 && (
                                      <div className="text-xs text-base-content/60 px-2">
                                        และอีก {costs.length - 3} รายการ...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ));
                            })()}

                            {/* แสดงยอดรวมต้นทุนของเดือน */}
                            <div className="border-t border-error/20 pt-2 mt-2">
                              <div className="flex justify-between items-center bg-error/10 rounded p-2">
                                <span className="text-sm font-bold text-error">รวมต้นทุนเดือนนี้</span>
                                <span className="text-lg font-bold text-error">
                                  {formatNumber(costTotal)} บาท
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
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