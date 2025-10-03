// ✅ 1. แก้ไข Utility สำหรับการกรองข้อมูลตามวันที่
export const filterDataByDate = (data, dateField) => ({
  filterByMonth: (month, year) => data.filter(item => {
    const date = new Date(item[dateField]);
    return date.getMonth() === month && date.getFullYear() === year;
  }),
  
  filterByYear: (year) => data.filter(item => 
    new Date(item[dateField]).getFullYear() === year
  ),
  
  filterByDate: (dateString) => data.filter(item => 
    item[dateField] === dateString
  ),  // ✅ เปลี่ยนชื่อจาก filterByDateString เป็น filterByDate
  
  filterByDateString: (dateString) => data.filter(item => 
    item[dateField] === dateString
  )  // ✅ เก็บไว้เผื่อใช้ที่อื่น
});

// ✅ 2. Utility สำหรับการคำนวณยอดรวม
export const calculateTotals = (data, amountField = 'totalAmount') => {
  return data.reduce((sum, item) => sum + (item[amountField] || 0), 0);
};

// ✅ 3. Utility สำหรับการจัดการ TopSellingItems
export const processTopSellingItems = (salesData, limit = 5) => {
  const aggregatedItems = salesData
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

  return Object.values(aggregatedItems)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);
};

// ✅ 4. Utility สำหรับการคำนวณต้นทุนแยกประเภท
export const calculateCostBreakdown = (costData) => ({
  totalRawMaterial: calculateTotals(costData, 'totalRawMaterialCost'),
  totalStaff: calculateTotals(costData, 'totalStaffCost'),
  totalOwner: calculateTotals(costData, 'totalOwnerCost'),
  totalUtility: calculateTotals(costData, 'totalUtilityCost'),
  totalOther: calculateTotals(costData, 'totalOtherCost')
});

// ✅ 5. Utility สำหรับสร้างข้อมูลรายวัน
export const generateDailyData = (dineInData, deliveryData, costData, selectedMonth, selectedYear) => {
  const data = [];
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  // สร้าง filter functions
  const dineInFilter = filterDataByDate(dineInData, 'saleDate');
  const deliveryFilter = filterDataByDate(deliveryData, 'saleDate');
  const costFilter = filterDataByDate(costData, 'costDate');

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // ✅ แก้ไขจาก filterByDate เป็น filterByDateString
    const dayDineInData = dineInFilter.filterByDateString(date);
    const dayDeliveryData = deliveryFilter.filterByDateString(date);
    const dayCost = costFilter.filterByDateString(date);

    const dineInAmount = calculateTotals(dayDineInData);
    const deliveryAmount = calculateTotals(dayDeliveryData);
    const costAmount = calculateTotals(dayCost);

    // ✅ คำนวณ avgPerOrder
    const dineInOrders = dayDineInData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const deliveryOrders = dayDeliveryData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalOrders = dineInOrders + deliveryOrders;

    const dineInAvgPerOrder = dineInOrders > 0 ? dineInAmount / dineInOrders : 0;
    const deliveryAvgPerOrder = deliveryOrders > 0 ? deliveryAmount / deliveryOrders : 0;
    const totalAvgPerOrder = totalOrders > 0 ? (dineInAmount + deliveryAmount) / totalOrders : 0;

    // ✅ Process Peak Hours รวมทั้งหน้าร้านและเดลิเวอรี่
    const allDayData = [...dayDineInData, ...dayDeliveryData];
    const dayPeakHours = processPeakHours(allDayData);
    const dineInPeakHours = processPeakHours(dayDineInData);
    const deliveryPeakHours = processPeakHours(dayDeliveryData);

    // รวม Top Items
    const topItems = processTopSellingItems(dayDineInData, 5);
    const topDeliveryItems = processTopSellingItems(dayDeliveryData, 5);

    const totalAmount = dineInAmount + deliveryAmount;
    const profit = totalAmount - costAmount;

    if (totalAmount > 0 || costAmount > 0) {
      data.push({
        date,
        day: new Date(date).toLocaleDateString('th-TH', { weekday: 'short' }),
        dineIn: dineInAmount,
        delivery: deliveryAmount,
        total: totalAmount,
        cost: costAmount,
        profit: profit,
        dineInOrders,
        deliveryOrders,
        totalOrders,
        dineInAvgPerOrder,      
        deliveryAvgPerOrder,    
        totalAvgPerOrder,       
        topItems,
        topDeliveryItems,
        peakHours: dayPeakHours,           // ✅ ช่วงเวลารวม
        dineInPeakHours: dineInPeakHours,  // ✅ ช่วงเวลาหน้าร้าน
        deliveryPeakHours: deliveryPeakHours // ✅ ช่วงเวลาเดลิเวอรี่
      });
    }
  }

  return data.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ✅ 6. Utility สำหรับสร้างข้อมูลรายเดือน
export const generateMonthlyData = (dineInData, deliveryData, costData, year, months) => {
  const data = [];
  
  // สร้าง filter functions
  const dineInFilter = filterDataByDate(dineInData, 'saleDate');
  const deliveryFilter = filterDataByDate(deliveryData, 'saleDate');
  const costFilter = filterDataByDate(costData, 'costDate');

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    // ใช้ utility functions
    const monthDineInData = dineInFilter.filterByMonth(monthIdx, year);
    const monthDeliveryData = deliveryFilter.filterByMonth(monthIdx, year);
    const monthCostData = costFilter.filterByMonth(monthIdx, year);

    const dineInAmount = calculateTotals(monthDineInData);
    const deliveryAmount = calculateTotals(monthDeliveryData);
    const costAmount = calculateTotals(monthCostData);

    // ✅ คำนวณ avgPerOrder รายเดือน
    const dineInOrders = monthDineInData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const deliveryOrders = monthDeliveryData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalOrders = dineInOrders + deliveryOrders;

    const dineInAvgPerOrder = dineInOrders > 0 ? dineInAmount / dineInOrders : 0;
    const deliveryAvgPerOrder = deliveryOrders > 0 ? deliveryAmount / deliveryOrders : 0;
    const totalAvgPerOrder = totalOrders > 0 ? (dineInAmount + deliveryAmount) / totalOrders : 0;

    // แยก Top Items ของ Dine-in และ Delivery
    const topDineInItems = processTopSellingItems(monthDineInData, 5);
    const topDeliveryItems = processTopSellingItems(monthDeliveryData, 5);

    const totalAmount = dineInAmount + deliveryAmount;
    const profit = totalAmount - costAmount;

    if (totalAmount > 0 || costAmount > 0) {
      data.push({
        month: monthIdx,
        monthName: months[monthIdx],
        dineIn: dineInAmount,
        delivery: deliveryAmount,
        total: totalAmount,
        cost: costAmount,
        profit: profit,
        dineInOrders,           // ✅ เพิ่มใหม่
        deliveryOrders,         // ✅ เพิ่มใหม่
        totalOrders,            // ✅ เพิ่มใหม่
        dineInAvgPerOrder,      // ✅ เพิ่มใหม่
        deliveryAvgPerOrder,    // ✅ เพิ่มใหม่
        totalAvgPerOrder,       // ✅ เพิ่มใหม่
        topItems: topDineInItems,
        topDeliveryItems: topDeliveryItems
      });
    }
  }

  return data.sort((a, b) => b.month - a.month);
};

// ✅ เพิ่ม function สำหรับ process Peak Hours
export const processPeakHours = (salesData) => {
  const allPeakHours = salesData
    .flatMap(item => item.peakHours || item.PeakHours || [])
    .reduce((acc, hour) => {
      const key = hour.hourRange || hour.HourRange;
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

  // คำนวณค่าเฉลี่ยต่อออเดอร์และเรียงลำดับ
  return Object.values(allPeakHours)
    .map(hour => ({
      ...hour,
      avgPerOrder: hour.orderCount > 0 ? hour.totalSales / hour.orderCount : 0
    }))
    .sort((a, b) => b.orderCount - a.orderCount) // เรียงตามจำนวนออเดอร์มากสุดก่อน
    .slice(0, 5); // เอาแค่ Top 5
};