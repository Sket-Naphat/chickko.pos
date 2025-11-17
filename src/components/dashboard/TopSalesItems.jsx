import React from 'react';

const TopSalesItems = ({ 
  filterMode, 
  selectedMonth, 
  selectedYear, 
  months, 
  salesByCategory 
}) => {
  
  // ✅ คำนวณ Top Items แยกตามหมวดหมู่ (แสดงทั้งที่ขาย 0 ชิ้น)
  const getCategorySales = () => {
    if (!salesByCategory || salesByCategory.length === 0) {
      return [];
    }

    // จัดเรียงข้อมูลตาม structure ที่ได้จาก API
    return salesByCategory
      .map(category => ({
        categoryName: category.categoryName,
        items: category.menus
          // ✅ ลบ filter ออก แสดงทั้งที่ขาย 0 ชิ้น
          .map(menu => ({
            menuName: menu.menuName,
            dineInQty: menu.dineInQty || 0,
            deliveryQty: menu.deliveryQty || 0,
            quantitySold: menu.totalQty || 0,
            totalSales: 0
          }))
          .sort((a, b) => b.quantitySold - a.quantitySold), // เรียงตามจำนวนขาย (มากไปน้อย)
        totalQuantity: category.menus.reduce((sum, menu) => sum + (menu.totalQty || 0), 0),
        totalAmount: 0
      }))
      // ✅ ลบ filter category ที่ไม่มีสินค้า แสดงทุกหมวดหมู่
      .sort((a, b) => b.totalQuantity - a.totalQuantity); // เรียงตามจำนวนขายรวม
  };

  // ✅ แยกข้อมูลหน้าร้านและเดลิเวอรี่ (แสดงทั้งที่ขาย 0 ชิ้น)
  const getSeparatedItems = () => {
    if (!salesByCategory || salesByCategory.length === 0) {
      return { dineIn: [], delivery: [] };
    }

    const allMenus = salesByCategory.flatMap(category => 
      category.menus.map(menu => ({
        menuName: menu.menuName,
        categoryName: category.categoryName,
        dineInQty: menu.dineInQty || 0,
        deliveryQty: menu.deliveryQty || 0,
        totalQty: menu.totalQty || 0
      }))
    );

    // ✅ แสดงทั้งที่ขาย 0 ชิ้น
    const dineInItems = allMenus
      // ลบ filter ออก
      .sort((a, b) => b.dineInQty - a.dineInQty)
      .map(menu => ({
        menuName: menu.menuName,
        categoryName: menu.categoryName,
        quantitySold: menu.dineInQty,
        totalSales: 0
      }));

    const deliveryItems = allMenus
      // ลบ filter ออก
      .sort((a, b) => b.deliveryQty - a.deliveryQty)
      .map(menu => ({
        menuName: menu.menuName,
        categoryName: menu.categoryName,
        quantitySold: menu.deliveryQty,
        totalSales: 0
      }));

    return { dineIn: dineInItems, delivery: deliveryItems };
  };

  const categorySales = getCategorySales();
  const { dineIn, delivery } = getSeparatedItems();
  const period = filterMode === 'month' 
    ? `${months[selectedMonth]} ${selectedYear}` 
    : `ปี ${selectedYear}`;

  // ✅ Component สำหรับแสดงรายการตามหมวดหมู่
  const CategorySalesList = () => (
    <div className="space-y-4">
      {categorySales.map((category, catIndex) => (
        <div key={catIndex} className="collapse bg-base-200 rounded-lg">
          <input type="checkbox" defaultChecked={catIndex === 0} />
          <div className="collapse-title font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {catIndex === 0 ? '🥇' : catIndex === 1 ? '🥈' : catIndex === 2 ? '🥉' : '📊'}
                </span>
                <span className="font-bold">{category.categoryName}</span>
                <div className="badge badge-primary badge-sm">
                  {category.items.length} รายการ
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${category.totalQuantity > 0 ? 'text-primary' : 'text-base-content/40'}`}>
                  {category.totalQuantity} ชิ้น
                </div>
              </div>
            </div>
          </div>
          <div className="collapse-content">
            <div className="space-y-2 pt-2">
              {category.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex} 
                  className={`flex justify-between items-center bg-base-100 rounded-lg p-3 border ${
                    item.quantitySold === 0 
                      ? 'border-base-300 opacity-50' 
                      : 'border-base-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm font-bold text-white ${
                      itemIndex === 0 && item.quantitySold > 0 ? 'bg-yellow-500' :
                      itemIndex === 1 && item.quantitySold > 0 ? 'bg-gray-400' :
                      itemIndex === 2 && item.quantitySold > 0 ? 'bg-orange-600' :
                      item.quantitySold === 0 ? 'bg-base-300' :
                      'bg-gray-500'
                    }`}>
                      #{itemIndex + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${item.quantitySold === 0 ? 'text-base-content/50' : ''}`}>
                        {item.menuName}
                      </span>
                      <div className="flex gap-2 text-xs text-base-content/60">
                        {item.dineInQty > 0 && (
                          <span>🏪 {item.dineInQty}</span>
                        )}
                        {item.deliveryQty > 0 && (
                          <span>🛵 {item.deliveryQty}</span>
                        )}
                        {/* ✅ แสดง 0 ถ้าไม่มียอดขาย */}
                        {item.quantitySold === 0 && (
                          <span className="text-base-content/40">ไม่มียอดขาย</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      item.quantitySold > 0 ? 'text-primary' : 'text-base-content/40'
                    }`}>
                      {item.quantitySold} ชิ้น
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ✅ Component สำหรับแสดงรายการแยกตามช่องทาง
  const ItemsList = ({ items, type, color, icon }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-${color} text-lg`}>{icon}</span>
        <span className={`font-bold text-${color}`}>
          รายการขายดี {type}
        </span>
        <div className={`badge badge-${color} badge-sm`}>
          {items.filter(item => item.quantitySold > 0).length} / {items.length} รายการ
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-h-[600px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-3">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center bg-${color}/5 rounded-lg p-4 shadow-sm border border-${color}/10 ${
                item.quantitySold === 0 ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`badge badge-lg font-bold text-white ${
                  index === 0 && item.quantitySold > 0 ? 'bg-yellow-500' :
                  index === 1 && item.quantitySold > 0 ? 'bg-gray-400' :
                  index === 2 && item.quantitySold > 0 ? 'bg-orange-600' :
                  item.quantitySold === 0 ? 'bg-base-300' :
                  'bg-gray-500'
                }`}>
                  #{index + 1}
                </span>
                <div className="flex flex-col">
                  <span className={`font-medium text-base ${item.quantitySold === 0 ? 'text-base-content/50' : ''}`}>
                    {item.menuName}
                  </span>
                  <span className="text-xs text-base-content/60">{item.categoryName}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-${color} text-lg ${item.quantitySold === 0 ? 'opacity-50' : ''}`}>
                  {item.quantitySold} ชิ้น
                </div>
                {item.quantitySold === 0 && (
                  <span className="text-xs text-base-content/40">ไม่มียอดขาย</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden max-h-[500px] overflow-y-auto">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center bg-${color}/5 rounded-lg p-3 border border-${color}/10 ${
                item.quantitySold === 0 ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`badge badge-sm font-bold text-white ${
                  index === 0 && item.quantitySold > 0 ? 'bg-yellow-500' :
                  index === 1 && item.quantitySold > 0 ? 'bg-gray-400' :
                  index === 2 && item.quantitySold > 0 ? 'bg-orange-600' :
                  item.quantitySold === 0 ? 'bg-base-300' :
                  'bg-gray-500'
                }`}>
                  #{index + 1}
                </span>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium truncate max-w-[120px] ${item.quantitySold === 0 ? 'text-base-content/50' : ''}`}>
                    {item.menuName}
                  </span>
                  <span className="text-xs text-base-content/60">{item.categoryName}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold text-${color} ${item.quantitySold === 0 ? 'opacity-50' : ''}`}>
                  {item.quantitySold} ชิ้น
                </span>
                {item.quantitySold === 0 && (
                  <span className="text-xs text-base-content/40">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ✅ แสดงข้อมูลเสมอ ไม่เช็คว่าว่างเปล่า
  return (
    <div className="collapse bg-base-100 border border-primary/20 rounded-lg">
      <input type="checkbox" />
      <div className="collapse-title font-semibold min-h-0 p-0">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl">🏆</span>
            <span className="text-lg font-bold text-primary">
              รายการขายดี
              <br /> {period}
            </span>
          </div>
          <div className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-full">
            คลิกเพื่อดูรายละเอียด
          </div>
        </div>
      </div>
      
      <div className="collapse-content px-4 pb-4">
        <div className="pt-0">
          <div className="tabs tabs-lifted">
            
            {/* ✅ Tab แยกตามหมวดหมู่ */}
            {categorySales.length > 0 && (
              <>
                <input 
                  type="radio" 
                  name={`${filterMode}_sales_tabs`} 
                  className="tab" 
                  aria-label="📂 ตามหมวดหมู่" 
                  defaultChecked 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <CategorySalesList />
                </div>
              </>
            )}

            {/* Tab หน้าร้าน */}
            {dineIn.length > 0 && (
              <>
                <input 
                  type="radio" 
                  name={`${filterMode}_sales_tabs`} 
                  className="tab" 
                  aria-label="🏪 หน้าร้าน"
                  defaultChecked={categorySales.length === 0}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <ItemsList 
                    items={dineIn}
                    type="หน้าร้าน"
                    color="info"
                    icon="🏪"
                  />
                </div>
              </>
            )}

            {/* Tab Delivery */}
            {delivery.length > 0 && (
              <>
                <input 
                  type="radio" 
                  name={`${filterMode}_sales_tabs`} 
                  className="tab" 
                  aria-label="🛵 เดลิเวอรี่" 
                />
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <ItemsList 
                    items={delivery}
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