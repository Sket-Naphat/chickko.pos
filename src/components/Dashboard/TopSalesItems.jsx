import React from 'react';

const TopSalesItems = ({ 
  filterMode, 
  selectedMonth, 
  selectedYear, 
  months, 
  dailyData, 
  dineInSalesData, 
  deliverySalesData, 
  formatNumber 
}) => {
  
  // คำนวณ Top Items ตามโหมด
  const getTopItems = () => {
    if (filterMode === 'month') {
      // รวบรวม TopItems จากทุกวันในเดือน (Dine-in)
      const monthlyTopItems = dailyData
        .flatMap(day => day.topItems || [])
        .reduce((acc, item) => {
          const key = item.menuName || item.MenuName;
          if (!acc[key]) {
            acc[key] = {
              menuName: key,
              quantitySold: 0,
              totalSales: 0
            };
          }
          acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
          acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
          return acc;
        }, {});

      // รวบรวม TopItems จาก Delivery
      const monthlyDeliveryTopItems = deliverySalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        })
        .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
        .reduce((acc, item) => {
          const key = item.menuName || item.MenuName;
          if (!acc[key]) {
            acc[key] = {
              menuName: key,
              quantitySold: 0,
              totalSales: 0
            };
          }
          acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
          acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
          return acc;
        }, {});

      return {
        dineIn: Object.values(monthlyTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5),
        delivery: Object.values(monthlyDeliveryTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5),
        period: `${months[selectedMonth]} ${selectedYear}`
      };
    } else {
      // รวบรวม TopItems จากทุกเดือนในปี (Dine-in)
      const yearlyTopItems = dineInSalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getFullYear() === selectedYear;
        })
        .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
        .reduce((acc, item) => {
          const key = item.menuName || item.MenuName;
          if (!acc[key]) {
            acc[key] = {
              menuName: key,
              quantitySold: 0,
              totalSales: 0
            };
          }
          acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
          acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
          return acc;
        }, {});

      // รวบรวม TopItems จาก Delivery
      const yearlyDeliveryTopItems = deliverySalesData
        .filter(item => {
          const date = new Date(item.saleDate);
          return date.getFullYear() === selectedYear;
        })
        .flatMap(item => item.topSellingItems || item.TopSellingItems || [])
        .reduce((acc, item) => {
          const key = item.menuName || item.MenuName;
          if (!acc[key]) {
            acc[key] = {
              menuName: key,
              quantitySold: 0,
              totalSales: 0
            };
          }
          acc[key].quantitySold += (item.quantitySold || item.QuantitySold || 0);
          acc[key].totalSales += (item.totalSales || item.TotalSales || 0);
          return acc;
        }, {});

      return {
        dineIn: Object.values(yearlyTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5),
        delivery: Object.values(yearlyDeliveryTopItems).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5),
        period: `ปี ${selectedYear}`
      };
    }
  };

  const topItems = getTopItems();

  // Component สำหรับแสดงรายการ
  const ItemsList = ({ items, type, color, icon }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-${color} text-lg`}>{icon}</span>
        <span className={`font-bold text-${color}`}>
          รายการขายดี Top 5 {type}
        </span>
        <div className={`badge badge-${color} badge-sm`}>
          {items.length} รายการ
        </div>
      </div>

      {/* Grid สำหรับ Desktop */}
      <div className="hidden md:grid grid-cols-1 gap-3">
        {items.map((item, index) => (
          <div key={index} className={`flex justify-between items-center bg-${color}/5 rounded-lg p-4 shadow-sm border border-${color}/10`}>
            <div className="flex items-center gap-3">
              <span className={`badge badge-lg font-bold text-white ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-600' :
                'bg-gray-500'
              }`}>
                #{index + 1}
              </span>
              <span className="font-medium text-base">
                {item.menuName}
              </span>
            </div>
            <div className="text-right">
              <div className={`font-bold text-${color} text-lg`}>
                {item.quantitySold} ออเดอร์
              </div>
              <div className="text-sm text-base-content/60">
                {formatNumber(item.totalSales)} บาท
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List สำหรับ Mobile */}
      <div className="md:hidden space-y-2">
        {items.map((item, index) => (
          <div key={index} className={`flex justify-between items-center bg-${color}/5 rounded-lg p-3 border border-${color}/10`}>
            <div className="flex items-center gap-2">
              <span className={`badge badge-sm font-bold text-white ${
                index === 0 ? 'bg-yellow-500' :
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
              <span className={`text-sm font-bold text-${color}`}>
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
  );

  // ถ้าไม่มีข้อมูล
  if (topItems.dineIn.length === 0 && topItems.delivery.length === 0) {
    return (
      <div className="bg-base-100 rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-lg font-semibold text-base-content/70 mb-2">
          ไม่มีข้อมูลรายการขายดี
        </div>
        <div className="text-base-content/60">
          ใน{topItems.period}
        </div>
      </div>
    );
  }

  return (
    <div className="collapse bg-base-100 border border-primary/20 rounded-lg">
      <input type="checkbox" />
      <div className="collapse-title font-semibold min-h-0 p-0">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl">🏆</span>
            <span className="text-lg font-bold text-primary">
              รายการขายดี Top 5 - {topItems.period}
            </span>
          </div>
          <div className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
            คลิกเพื่อดูรายละเอียด
          </div>
        </div>
      </div>
      
      <div className="collapse-content px-4 pb-4">
        <div className="pt-0">
          <div className={`tabs ${filterMode === 'month' ? 'tabs-lift' : 'tabs-lifted'}`}>
            {/* Tab หน้าร้าน */}
            {topItems.dineIn.length > 0 && (
              <>
                <input 
                  type="radio" 
                  name={`${filterMode}_top5_tabs`} 
                  className="tab" 
                  aria-label="🏪 หน้าร้าน" 
                  defaultChecked 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <ItemsList 
                    items={topItems.dineIn}
                    type="หน้าร้าน"
                    color="info"
                    icon="🏪"
                  />
                </div>
              </>
            )}

            {/* Tab Delivery */}
            {topItems.delivery.length > 0 && (
              <>
                <input 
                  type="radio" 
                  name={`${filterMode}_top5_tabs`} 
                  className="tab" 
                  aria-label="🛵 เดลิเวอรี่" 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <ItemsList 
                    items={topItems.delivery}
                    type="เดลิเวอรี่"
                    color="accent"
                    icon="🛵"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSalesItems;