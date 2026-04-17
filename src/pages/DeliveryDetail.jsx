import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// ฟังก์ชันแปลงวันที่
function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayName = days[date.getDay()];
    return `${dayName} ${day} ${months[month]} ${year}`;
}
const days = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
];
const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export default function DeliveryDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [ordersData, setOrdersData] = useState([]); // ✅ เพิ่ม state สำหรับ orders
    const [ordersLoading, setOrdersLoading] = useState(false); // ✅ loading สำหรับ orders

    // รับข้อมูลจากหน้าก่อน
    const { deliveryData } = location.state || {};

    // ถ้าไม่มีข้อมูล ให้กลับหน้าแรก
    useEffect(() => {
        if (!deliveryData) {
            navigate('/income', { state: { activeTab: 'delivery' } });
            return;
        }
    }, [deliveryData, navigate]);

    // ดึงข้อมูลรายละเอียดเพิ่มเติม (ถ้ามี API เฉพาะ)
    useEffect(() => {
        if (!deliveryData) return;

        const fetchAllData = async () => {
            setLoading(true);
            setOrdersLoading(true);

            try {
                // ✅ ดึงข้อมูล detail
                setDetailData(deliveryData);

                // ✅ ดึงข้อมูล orders
                const ordersResponse = await api.post('/orders/GetDeliveryOrdersByDate', {
                    SaleDate: deliveryData.saleDate
                }, {
                    timeout: 30000, // ✅ รอ 30 วินาที
                    retry: 3, // ✅ ลองใหม่ 3 ครั้ง
                    retryDelay: 2000 // ✅ รอ 2 วินาทีระหว่างแต่ละครั้ง
                });

                console.log('Orders API Response:', ordersResponse.data);

                // ✅ ใช้ structure จาก API response
                if (ordersResponse.data?.success && ordersResponse.data?.data) {
                    const apiOrders = ordersResponse.data.data.map(order => ({
                        orderId: order.orderId,
                        orderTime: order.orderTime,
                        customerName: order.customerName,
                        totalPrice: order.totalPrice,
                        totalGrabPrice: order.totalGrabPrice,
                        totalFoodCost: order.totalFoodCost,
                        items: order.orderDetails?.map(detail => ({
                            name: detail.menuName,
                            qty: detail.quantity,
                            price: detail.price / detail.quantity,
                            grabPrice: detail.grabPrice,           // ✅ เพิ่ม
                            totalFoodCost: detail.totalFoodCost,   // ✅ เพิ่ม
                            toppings: detail.toppings || []
                        })) || []
                    }));

                    setOrdersData(apiOrders);
                } else {
                    setOrdersData([]);
                }

            } catch (error) {
                console.error("Error fetching orders data:", error);
                // ✅ Mock data สำหรับทดสอบ (อัพเดทตาม API structure)
                setOrdersData([
                    {
                        orderId: "9107",
                        orderTime: "2025-09-14T20:30:13",
                        customerName: "ลูกค้า 026",
                        totalPrice: 348,
                        items: [
                            {
                                name: "รามยอนชอสเกี๊ยดไก่ทอด",
                                qty: 1,
                                price: 184
                            },
                            {
                                name: "ไข่ดาว",
                                qty: 1,
                                price: 69
                            }
                        ]
                    },
                    {
                        orderId: "9093",
                        orderTime: "2025-09-14T12:52:45",
                        customerName: "เมื่อไหร่ 313",
                        totalPrice: 253,
                        items: [
                            {
                                name: "เมนูตัวอย่าง",
                                qty: 1,
                                price: 253
                            }
                        ]
                    }
                ]);
            } finally {
                setLoading(false);
                setOrdersLoading(false);
            }
        };

        fetchAllData();
    }, [deliveryData]);

    // ✅ ฟังก์ชันแปลงเวลา
    const formatTime = (timeStr) => {
        const date = new Date(timeStr);
        if (isNaN(date)) return timeStr;
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!deliveryData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-200 flex flex-col items-center px-2 py-4 sm:px-4 sm:py-6">
            <div className="w-full max-w-4xl card bg-base-100 shadow-xl p-3 sm:p-6">
                {/* ✅ Header พร้อมปุ่มกลับ */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        className="btn btn-sm btn-circle btn-outline"
                        onClick={() => navigate('/income', { state: { activeTab: 'delivery' } })}
                        title="กลับหน้าแรก"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">🛵 รายละเอียดยอดขาย Grab</h1>
                        <p className="text-base-content/70">
                            {formatDate(deliveryData.saleDate)}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <span className="mt-3 text-sm text-base-content/70">⏳ กำลังโหลดรายละเอียด…</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ✅ ข้อมูลหลัก */}
                        <div className="card bg-gradient-to-r from-info/10 to-secondary/10 border border-primary/20">
                            <div className="card-body">
                                <h2 className="card-title text-primary mb-4">💰 สรุปยอดขาย</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* ✅ Column ซ้าย: ยอดขาย + ต้นทุน */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                                            <span className="font-semibold">ยอดขายรวม</span>
                                            <span className="text-info font-bold text-xl">
                                                ฿{detailData?.totalSales?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                                            <span className="font-semibold">ยอดหลังหัก GP</span>
                                            <span className="text-success font-bold text-xl">
                                                ฿{detailData?.netSales?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-error/10 border border-error/20 rounded-lg">
                                            <span className="font-semibold">ต้นทุนอาหารรวม</span>
                                            <span className="text-error font-bold text-xl">
                                                ฿{ordersData.reduce((sum, order) => sum + (order.totalFoodCost || 0), 0).toLocaleString()}
                                            </span>
                                        </div>
                                        {(() => {
                                            const netSales = detailData?.netSales || 0;
                                            const totalFoodCost = ordersData.reduce((sum, order) => sum + (order.totalFoodCost || 0), 0);
                                            const grossProfit = netSales - totalFoodCost;
                                            return (
                                                <div className={`flex justify-between items-center p-3 rounded-lg border ${grossProfit >= 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
                                                    <span className="font-semibold">กำไรขั้นต้น</span>
                                                    <span className={`font-bold text-xl ${grossProfit >= 0 ? 'text-success' : 'text-error'}`}>
                                                        ฿{grossProfit.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* ✅ Column ขวา: GP + วิเคราะห์ */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                                            <span className="font-semibold">% GP ที่หักไป</span>
                                            <span className="text-error font-bold text-xl">
                                                {detailData?.gpPercent?.toFixed(2) || 0}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                                            <span className="font-semibold">จำนวน GP ที่หักไป</span>
                                            <span className="text-error font-bold text-xl">
                                                ฿{detailData?.gpAmount?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        {(() => {
                                            const netSales = detailData?.netSales || 0;
                                            const totalOrderPrice = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                                            const difference = netSales - totalOrderPrice;
                                            const colorClass = difference > 0 ? 'text-success' : difference < 0 ? 'text-error' : 'text-warning';
                                            return (
                                                <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                                                    <span className="font-semibold">เทียบกับราคาหน้าร้าน</span>
                                                    <span className={`font-bold text-xl ${colorClass}`}>
                                                        {`${difference >= 0 ? '+' : ''}${difference.toLocaleString()}`}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                        <div className="p-3 bg-base-200 rounded-lg">
                                            <h3 className="font-bold mb-1">วิเคราะห์ GP</h3>
                                            <div className="text-sm">
                                                {detailData?.gpPercent > 30
                                                    ? "🔴 GP สูงกว่าปกติ อาจต้องตรวจสอบราคา"
                                                    : detailData?.gpPercent > 20
                                                        ? "🟡 GP อยู่ในเกณฑ์ปกติ"
                                                        : "🟢 GP ต่ำ ได้กำไรดี"}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* ✅ รายการออเดอร์ในวันนี้ */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="card-title text-accent">🛒 รายการออเดอร์ในวันนี้</h2>
                                    <div className="badge badge-info">
                                        {ordersData.length} รายการ
                                    </div>
                                </div>

                                {ordersLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="loading loading-spinner loading-md text-primary"></span>
                                        <span className="ml-2 text-sm">กำลังโหลดรายการออเดอร์...</span>
                                    </div>
                                ) : ordersData.length === 0 ? (
                                    <div className="text-center text-base-content/60 py-8">
                                        <div className="text-4xl mb-2">📦</div>
                                        <p>ยังไม่มีออเดอร์ในวันนี้</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* ✅ สรุปรวม */}
                                        <div className="card bg-gradient-to-r from-success/10 to-info/10 border border-success/20 mt-4">
                                            <div className="card-body p-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-lg">📊 สรุปรวมเป็นราคาหน้าร้าน</div>
                                                        <div className="text-sm text-base-content/70">
                                                            {ordersData.length} ออเดอร์ • {ordersData.reduce((sum, order) => sum + (order.items?.length || 0), 0)} รายการ
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-success">
                                                            ฿{ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-base-content/60">
                                                            ยอดรวมทั้งหมด
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {ordersData
                                            .slice() // ✅ สร้าง copy เพื่อไม่ให้กระทบ original array
                                            .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime)) // ✅ เรียงจากใหม่ไปเก่า (ล่าสุดก่อน)
                                            .map((order, index, arr) => (
                                                <div key={order.orderId || index} className="collapse collapse-arrow bg-base-200 border border-base-300">
                                                    <input type="checkbox" className="collapse-toggle" />
                                                    <div className="collapse-title">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {/* ✅ ออเดอร์ล่าสุดเป็น #1 */}
                                                                <div className="badge badge-primary badge-sm">#{arr.length - index}</div>
                                                                <div>
                                                                    <div className="font-semibold text-base">
                                                                        {order.customerName || `ออเดอร์ ${order.orderId}`}
                                                                    </div>
                                                                    <div className="text-sm text-base-content/70">
                                                                        🕐 {formatTime(order.orderTime)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-lg text-success">
                                                                    ฿{order.totalPrice?.toLocaleString() || 0}
                                                                </div>
                                                                {/* ✅ เพิ่ม cost food */}
                                                                <div className="text-xs text-error">
                                                                    🍳 ต้นทุน ฿{order.totalFoodCost?.toLocaleString() || 0}
                                                                </div>
                                                                <div className="text-xs text-base-content/60">
                                                                    {order.items?.length || 0} รายการ
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="collapse-content">
                                                        <div className="border-t border-base-300 pt-4">
                                                            <h4 className="font-semibold mb-3 text-sm">📋 รายการสินค้า:</h4>
                                                            <div className="space-y-2">
                                                                {order.items?.map((item, itemIndex) => (
                                                                    <div key={itemIndex} className="flex justify-between items-start p-3 bg-base-100 rounded-lg">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-sm">
                                                                                {item.name}
                                                                            </div>

                                                                            {item.toppings && item.toppings.length > 0 && (
                                                                                <div className="mt-2">
                                                                                    <div className="text-xs text-orange-600 font-medium mb-1 flex items-center gap-1">
                                                                                        <span>Topping : </span>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {item.toppings.map((topping, toppingIndex) => (
                                                                                            <span
                                                                                                key={toppingIndex}
                                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border border-orange-200 shadow-sm"
                                                                                            >
                                                                                                <span className="text-xs">+</span>
                                                                                                <span>{topping.toppingNames || topping}</span>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <div className="text-xs text-base-content/60 mt-1">
                                                                                จำนวน: {item.qty} | ราคา/ชิ้น: ฿{item.price?.toLocaleString() || 0}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right ml-3">
                                                                            <div className="font-bold text-success">
                                                                                ฿{((item.qty || 1) * (item.price || 0)).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )) || (
                                                                        <div className="text-center text-base-content/60 py-4">
                                                                            ไม่มีรายละเอียดสินค้า
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            {/* ✅ ข้อมูลเพิ่มเติมของออเดอร์ */}
                                                            <div className="mt-4 pt-3 border-t border-base-300/50">
                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    <div>
                                                                        <span className="text-base-content/70">รหัสออเดอร์:</span>
                                                                        <span className="ml-2 font-semibold">{order.orderId}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-base-content/70">เวลาสั่ง:</span>
                                                                        <span className="ml-2 font-semibold">{formatTime(order.orderTime)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-base-content/70">สถานะ:</span>
                                                                        <span className="ml-2">
                                                                            <span className="badge badge-success badge-xs">
                                                                                เสร็จสิ้น
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-base-content/70">แพลตฟอร์ม:</span>
                                                                        <span className="ml-2">
                                                                            <span className="badge badge-info badge-xs">
                                                                                🛵 Grab
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}


                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ✅ ปุ่มดำเนินการ */}
                        {/* <div className="flex gap-3 justify-center">
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate('/delivery')}
                            >
                                ← กลับหน้าแรก
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // TODO: เพิ่มฟังก์ชันแก้ไขข้อมูล
                                    alert('ฟีเจอร์แก้ไขข้อมูลกำลังจะมาในเร็วๆ นี้');
                                }}
                            >
                                ✏️ แก้ไขข้อมูล
                            </button>
                        </div> */}
                    </div>
                )}
            </div>
        </div>
    );
}