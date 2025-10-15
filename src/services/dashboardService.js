// ✅ 1. แก้ไข Utility สำหรับการกรองข้อมูลตามวันที่
// ✅ 7. Utility สำหรับ format วันที่เป็นภาษาไทย
export const formatDisplayDate = (dateString) => {
  // สร้าง Date object จาก string
  const date = new Date(dateString);
  
  // ตรวจสอบว่าเป็น valid date หรือไม่
  if (isNaN(date.getTime())) {
    return dateString; // return กลับไปถ้าไม่ใช่วันที่ที่ถูกต้อง
  }
  
  // Array ชื่อวันภาษาไทย
  const dayNames = [
    'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
  ];
  
  // Array ชื่อเดือนภาษาไทย
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  // ดึงข้อมูลวัน เดือน ปี
  const dayName = dayNames[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear(); // ✅ แปลงเป็นปีพุทธศักราช
  
  // สร้าง format: วัน เสาร์ ที่ 01 ตุลาคม 2568
  return `วัน${dayName} ที่ ${day} ${monthName} ${year}`;
};

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
    
    const dayDineInData = dineInFilter.filterByDateString(date);
    const dayDeliveryData = deliveryFilter.filterByDateString(date);
    const dayCost = costFilter.filterByDateString(date);

    const dineInAmount = calculateTotals(dayDineInData);
    const deliveryAmount = calculateTotals(dayDeliveryData);
    const costAmount = calculateTotals(dayCost);
    const dineInDiscount = calculateTotals(dayDineInData, 'totalDiscount');

    // คำนวณ avgPerOrder
    const dineInOrders = dayDineInData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const deliveryOrders = dayDeliveryData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalOrders = dineInOrders + deliveryOrders;
    
    const dineInAvgPerOrder = dineInOrders > 0 ? dineInAmount / dineInOrders : 0;
    const deliveryAvgPerOrder = deliveryOrders > 0 ? deliveryAmount / deliveryOrders : 0;
    const totalAvgPerOrder = totalOrders > 0 ? (dineInAmount + deliveryAmount) / totalOrders : 0;

    // ✅ ใช้ peakHours ที่มีอยู่แล้วในข้อมูล
    const dineInPeakHours = dayDineInData.length > 0 ? dayDineInData[0].peakHours || [] : [];
    const deliveryPeakHours = dayDeliveryData.length > 0 ? dayDeliveryData[0].peakHours || [] : [];
    
    // รวม peakHours จากทั้งหน้าร้านและเดลิเวอรี่
    const combinedPeakHours = [...dineInPeakHours, ...deliveryPeakHours];
    const peakHours = processPeakHours(combinedPeakHours);

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
        peakHours: peakHours,           // ✅ ใช้ข้อมูลที่รวมแล้ว
        dineInPeakHours: dineInPeakHours,  // ✅ ข้อมูลหน้าร้านโดยตรง
        deliveryPeakHours: deliveryPeakHours, // ✅ ข้อมูลเดลิเวอรี่โดยตรง
        dineInDiscount: dineInDiscount
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
    const dineInDiscount = calculateTotals(monthDineInData, 'TotalDiscount');

    // ✅ คำนวณ avgPerOrder รายเดือน
    const dineInOrders = monthDineInData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const deliveryOrders = monthDeliveryData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalOrders = dineInOrders + deliveryOrders;

    const dineInAvgPerOrder = dineInOrders > 0 ? dineInAmount / dineInOrders : 0;
    const deliveryAvgPerOrder = deliveryOrders > 0 ? deliveryAmount / deliveryOrders : 0;
    const totalAvgPerOrder = totalOrders > 0 ? (dineInAmount + deliveryAmount) / totalOrders : 0;

    // ✅ คำนวณจำนวนวันที่มีออเดอร์ในเดือนนี้
    const dineInDaysCount = monthDineInData.filter(item => (item.orders || 0) > 0).length;
    const deliveryDaysCount = monthDeliveryData.filter(item => (item.orders || 0) > 0).length;
    
    // ✅ เพิ่มค่าเฉลี่ยออเดอร์ต่อวัน
    const avgDineInOrdersPerDay = dineInDaysCount > 0 ? dineInOrders / dineInDaysCount : 0;
    const avgDeliveryOrdersPerDay = deliveryDaysCount > 0 ? deliveryOrders / deliveryDaysCount : 0;

    // รวบรวม Peak Hours จากข้อมูลทั้งหน้าร้านและเดลิเวอรี่
    const dineInPeakHours = monthDineInData
      .flatMap(item => item.peakHours || item.PeakHours || []);
    
    const deliveryPeakHours = monthDeliveryData
      .flatMap(item => item.peakHours || item.PeakHours || []);
    
    const combinedPeakHours = [...dineInPeakHours, ...deliveryPeakHours];
    
    const peakHours = processPeakHours(combinedPeakHours);
    const processedDineInPeakHours = processPeakHours(dineInPeakHours);
    const processedDeliveryPeakHours = processPeakHours(deliveryPeakHours);

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
        dineInOrders,           
        deliveryOrders,         
        totalOrders,            
        dineInAvgPerOrder,      
        deliveryAvgPerOrder,    
        totalAvgPerOrder,       
        // ✅ เพิ่มค่าเฉลี่ยออเดอร์ต่อวัน
        avgDineInOrdersPerDay: Math.round(avgDineInOrdersPerDay),
        avgDeliveryOrdersPerDay: Math.round(avgDeliveryOrdersPerDay),
        // ✅ เพิ่มจำนวนวันที่มีการขาย
        dineInDaysCount,
        deliveryDaysCount,
        topItems: topDineInItems,
        topDeliveryItems: topDeliveryItems,
        peakHours: peakHours,
        dineInPeakHours: processedDineInPeakHours,
        deliveryPeakHours: processedDeliveryPeakHours,
        dineInDiscount: dineInDiscount
      });
    }
  }

  return data.sort((a, b) => b.month - a.month);
};


export const processPeakHours = (peakHoursArray) => {
  if (!peakHoursArray || peakHoursArray.length === 0) return [];

  const aggregatedHours = peakHoursArray.reduce((acc, hour) => {
    const key = hour.hourRange || hour.HourRange;
    if (!key) return acc; // ✅ เพิ่มการตรวจสอบ key
    
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
  return Object.values(aggregatedHours)
    .map(hour => ({
      ...hour,
      avgPerOrder: hour.orderCount > 0 ? hour.totalSales / hour.orderCount : 0
    }))
    .sort((a, b) => b.orderCount - a.orderCount) // เรียงตามจำนวนออเดอร์มากสุดก่อน
    //.slice(0, 5); // เอาแค่ Top 5
};