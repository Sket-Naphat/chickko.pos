import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api"; // ✅ ใช้ api แทน api

export default function RollingGame() {
    const [searchParams] = useSearchParams();
    const customerName = searchParams.get("CustomerName") || "ลูกค้า";
    const orderId = searchParams.get("OrderId") || "";

    const [rewardList, setRewardList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState("");

    const wheelRef = useRef(null);
    const [rotation, setRotation] = useState(0);

    // สีสำหรับแต่ละช่วงของวงล้อ - ใช้โทนสี minimal และเข้า theme
    const colors = [
        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
        "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
        "#EC4899", "#6366F1", "#14B8A6", "#A855F7"
    ];

    // โหลดรายการรางวัลจาก API
    useEffect(() => {
        const fetchRewards = async () => {
            try {
                setLoading(true);
                // ✅ ใช้ api แทน api
                const response = await api.get("/event/getRollingRewardList");
                const rewards = response.data?.data || response.data || [];
                setRewardList(rewards);
                setError("");
            } catch (err) {
                console.error("Error fetching rewards:", err);
                setError("ไม่สามารถโหลดรายการรางวัลได้");
                // ข้อมูลทดสอบ
                setRewardList([
                    { id: 1, name: "รางวัลที่ 1 - ส่วนลด 50 บาท" },
                    { id: 2, name: "รางวัลที่ 2 - ส่วนลด 100 บาท" },
                    { id: 3, name: "รางวัลที่ 3 - ไก่ฟรี 1 ตัว" },
                    { id: 4, name: "รางวัลที่ 4 - ส่วนลด 20%" },
                    { id: 5, name: "รางวัลที่ 5 - ขอบคุณที่ใช้บริการ" },
                    { id: 6, name: "รางวัลที่ 6 - ส่วนลด 10%" },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchRewards();
    }, []);

    // ฟังก์ชันหมุนวงล้อ
    const spinWheel = async () => {
        if (isSpinning || rewardList.length === 0) return;

        setIsSpinning(true);
        setShowResult(false);
        setSelectedReward(null);

        // สุ่มรางวัลที่จะได้
        const randomIndex = Math.floor(Math.random() * rewardList.length);
        const selectedReward = rewardList[randomIndex];

        // คำนวณมุมที่ต้องหมุนไป
        const degreesPerSegment = 360 / rewardList.length;
        const targetAngle = (randomIndex * degreesPerSegment) + (degreesPerSegment / 2);
        
        // เพิ่มการหมุนหลายรอบ (3-5 รอบ) + มุมเป้าหมาย
        const spins = 3 + Math.random() * 2; // 3-5 รอบ
        const finalRotation = rotation + (spins * 360) + (360 - targetAngle);

        setRotation(finalRotation);

        // รอให้แอนิเมชันเสร็จ
        setTimeout(async () => {
            setSelectedReward(selectedReward);
            setShowResult(true);
            setIsSpinning(false);

            // บันทึกผลลง API
            try {
                // ✅ ใช้ api แทน api
                await api.post("/game/saveRollingGameReward", {
                    CustomerName: customerName,
                    OrderId: orderId,
                    RewardId: selectedReward.id,
                    RewardName: selectedReward.name
                });
            } catch (err) {
                console.error("Error saving reward:", err);
            }
        }, 3000); // 3 วินาที
    };

    // สร้าง SVG วงล้อ
    const createWheel = () => {
        if (rewardList.length === 0) return null;

        const radius = 150;
        const centerX = 160;
        const centerY = 160;
        const segments = rewardList.length;
        const anglePerSegment = 360 / segments;

        return (
            <svg width="320" height="320" className="drop-shadow-lg">
                {/* วงกลมพื้นหลัง */}
                <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r={radius + 5} 
                    fill="#1f2937" 
                    stroke="#374151"
                    strokeWidth="2"
                />
                
                {/* สร้างแต่ละช่วงของวงล้อ */}
                {rewardList.map((reward, index) => {
                    const startAngle = (index * anglePerSegment - 90) * (Math.PI / 180);
                    const endAngle = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180);
                    
                    const x1 = centerX + radius * Math.cos(startAngle);
                    const y1 = centerY + radius * Math.sin(startAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);
                    
                    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
                    
                    const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                    ].join(' ');

                    // คำนวณตำแหน่งข้อความ
                    const textAngle = (index * anglePerSegment + anglePerSegment / 2 - 90) * (Math.PI / 180);
                    const textRadius = radius * 0.7;
                    const textX = centerX + textRadius * Math.cos(textAngle);
                    const textY = centerY + textRadius * Math.sin(textAngle);

                    // ปรับขนาดข้อความให้เหมาะกับจำนวนช่วง
                    const fontSize = segments > 8 ? "9" : segments > 6 ? "10" : "11";

                    return (
                        <g key={reward.id || index}>
                            <path
                                d={pathData}
                                fill={colors[index % colors.length]}
                                stroke="#f8fafc"
                                strokeWidth="1.5"
                            />
                            <text
                                x={textX}
                                y={textY}
                                fill="white"
                                fontSize={fontSize}
                                fontWeight="600"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="pointer-events-none select-none"
                                style={{
                                    textShadow: "0 1px 3px rgba(0,0,0,0.5)"
                                }}
                            >
                                {/* แสดงข้อความสั้น ๆ */}
                                {reward.name?.length > 15 
                                    ? `${reward.name.substring(0, 12)}...` 
                                    : reward.name || `รางวัล ${index + 1}`
                                }
                            </text>
                        </g>
                    );
                })}
                
                {/* จุดกลาง */}
                <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r="12" 
                    fill="#1f2937" 
                    stroke="#f8fafc" 
                    strokeWidth="2" 
                />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-base-content/70">กำลังโหลดรายการรางวัล...</p>
                </div>
            </div>
        );
    }

    if (error && rewardList.length === 0) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😞</div>
                    <p className="text-xl mb-4 text-base-content">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="mb-4">
                    <div className="text-6xl mb-2">🎡</div>
                    <h1 className="text-3xl font-bold text-base-content">วงล้อนำโชค</h1>
                </div>
                <div className="space-y-1">
                    <p className="text-lg text-base-content">สวัสดี คุณ<span className="font-semibold text-primary">{customerName}</span></p>
                    <p className="text-sm text-base-content/60">หมายเลขคำสั่งซื้อ: <span className="font-mono">{orderId}</span></p>
                </div>
            </div>

            {/* Wheel Container */}
            <div className="relative mb-12">
                {/* ลูกศรชี้ */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-10">
                    <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-primary drop-shadow-sm"></div>
                </div>

                {/* วงล้อ */}
                <div 
                    ref={wheelRef}
                    className={`transition-transform duration-[3000ms] ease-out ${isSpinning ? '' : 'hover:scale-105 transition-transform duration-200'}`}
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'center'
                    }}
                >
                    {createWheel()}
                </div>
            </div>

            {/* Spin Button */}
            <button
                onClick={spinWheel}
                disabled={isSpinning || rewardList.length === 0}
                className={`btn btn-lg btn-primary shadow-lg transform transition-all duration-200 ${
                    isSpinning 
                        ? 'loading' 
                        : 'hover:scale-105 active:scale-95'
                }`}
            >
                {isSpinning ? (
                    'กำลังหมุน...'
                ) : (
                    <>
                        <span className="mr-2">🎲</span>
                        หมุนวงล้อ
                    </>
                )}
            </button>

            {/* Result Modal */}
            {showResult && selectedReward && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl">
                        {/* Content */}
                        <div className="space-y-4">
                            <div className="text-5xl animate-bounce">🎉</div>
                            <h2 className="text-2xl font-bold text-base-content">ยินดีด้วย!</h2>
                            <p className="text-base-content/70">คุณได้รับรางวัล</p>
                            <div className="bg-primary text-primary-content px-4 py-3 rounded-xl font-semibold break-words">
                                {selectedReward.name}
                            </div>
                            <p className="text-sm text-base-content/60">
                                ผลลัพธ์ได้ถูกบันทึกเรียบร้อยแล้ว
                            </p>
                            <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => setShowResult(false)}
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8">
                <p className="text-sm text-base-content/50">ขอให้โชคดี! 🍀</p>
            </div>
        </div>
    );
}