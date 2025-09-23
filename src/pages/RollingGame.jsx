import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api"; // ✅ ใช้ api แทน api

export default function RollingGame() {
    const [searchParams] = useSearchParams();
    const customerName = searchParams.get("CustomerName") || "ลูกค้า";
    const orderId = searchParams.get("OrderId") || "";
    const site = searchParams.get("site") || ""; // ดึงค่า site จาก URL parameter

    const [rewardList, setRewardList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState("");
    // const [hasPlayed, setHasPlayed] = useState(false);
    const [previousReward, setPreviousReward] = useState(null);
    const [showPlayAgainModal, setShowPlayAgainModal] = useState(false);
    const [canPlay, setCanPlay] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [newRewardName, setNewRewardName] = useState("");
    const [newRewardDescription, setNewRewardDescription] = useState("");

    const wheelRef = useRef(null);
    const [rotation, setRotation] = useState(0);

    // ฟังก์ชันสำหรับเรียก API พร้อม X-Site header
    const apiCall = useMemo(() => ({
        get: (url) => api.get(url, {
            headers: site ? { 'X-Site': site } : {}
        }),
        post: (url, data) => api.post(url, data, {
            headers: site ? { 'X-Site': site } : {}
        }),
        put: (url, data) => api.put(url, data, {
            headers: site ? { 'X-Site': site } : {}
        }),
        delete: (url) => api.delete(url, {
            headers: site ? { 'X-Site': site } : {}
        })
    }), [site]);

    // สีสำหรับแต่ละช่วงของวงล้อ - ใช้โทนสี minimal และเข้า theme
    const colors = [
        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
        "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
        "#EC4899", "#6366F1", "#14B8A6", "#A855F7"
    ];

    // โหลดรายการรางวัลและตรวจสอบประวัติ
    useEffect(() => {
        const checkHistory = async () => {
            if (!orderId) return { hasPlayed: false };
            
            try {
                const response = await apiCall.get(`/event/gethistoryrollinggame?OrderFirstStoreID=${orderId}`);
                const history = response.data?.data || response.data || null;
                
                if (history) {
                    return {
                        hasPlayed: true,
                        previousReward: {
                            rewardName: history.reward.rewardName,
                            description: history.reward.description || "",
                            playedAt: `${history.createdDate} ${history.createdTime}`
                        }
                    };
                }
                return { hasPlayed: false };
            } catch (err) {
                console.error("Error checking play history:", err);
                return { hasPlayed: false };
            }
        };

        const fetchRewardsAndCheckHistory = async () => {
            try {
                setLoading(true);
                
                // โหลดรายการรางวัล
                const response = await apiCall.get("/event/getRollingRewardList");
                const rewards = response.data?.data || response.data || [];
                setRewardList(rewards);
                
                // ตรวจสอบประวัติการเล่น
                const history = await checkHistory();
                
                if (history.hasPlayed) {
                    setPreviousReward(history.previousReward);
                    setShowPlayAgainModal(true);
                    setCanPlay(false); // ยังเล่นไม่ได้จนกว่าจะกดยืนยัน
                } else {
                    setCanPlay(true); // เล่นได้เลย
                }
                
                setError("");
            } catch (err) {
                console.error("Error fetching rewards:", err);
                setError("ไม่สามารถโหลดรายการรางวัลได้");
                // ข้อมูลทดสอบ
                setRewardList([
                    { RollingRewardId: 1, rewardName : "รางวัลที่ 1 - ส่วนลด 50 บาท" },
                    { RollingRewardId: 2, rewardName : "รางวัลที่ 2 - ส่วนลด 100 บาท" },
                    { RollingRewardId: 3, rewardName : "รางวัลที่ 3 - ไก่ฟรี 1 ตัว" },
                    { RollingRewardId: 4, rewardName : "รางวัลที่ 4 - ส่วนลด 20%" },
                    { RollingRewardId: 5, rewardName : "รางวัลที่ 5 - ขอบคุณที่ใช้บริการ" },
                    { RollingRewardId: 6, rewardName : "รางวัลที่ 6 - ส่วนลด 10%" },
                ]);
                setCanPlay(true); // ถ้า error ให้เล่นได้
            } finally {
                setLoading(false);
            }
        };

        fetchRewardsAndCheckHistory();
    }, [orderId, apiCall]); // เพิ่ม apiCall ใน dependency

    // ฟังก์ชันจัดการรางวัล
    const handleAddReward = async () => {
        if (!newRewardName.trim()) return;
        
        try {
            const response = await apiCall.post("/event/addRollingReward", {
                rewardName: newRewardName,
                description: newRewardDescription
            });
            
            if (response.data) {
                // รีเฟรชรายการรางวัล
                const rewardsResponse = await apiCall.get("/event/getRollingRewardList");
                const rewards = rewardsResponse.data?.data || rewardsResponse.data || [];
                setRewardList(rewards);
                
                // รีเซ็ตฟอร์ม
                setNewRewardName("");
                setNewRewardDescription("");
            }
        } catch (err) {
            console.error("Error adding reward:", err);
        }
    };

    const handleEditReward = async () => {
        if (!editingReward || !newRewardName.trim()) return;
        
        try {
            const response = await apiCall.put("/event/updateRollingReward", {
                RollingRewardId: editingReward.rollingRewardId ,
                RewardName: newRewardName,
                Description: newRewardDescription,
                Probability: 0
            });
            
            if (response.data) {
                // อัพเดทรายการรางวัลใน state
                setRewardList(prev => prev.map(reward => 
                    reward.rollingRewardId === editingReward.rollingRewardId 
                        ? { ...reward, rewardName: newRewardName, description: newRewardDescription }
                        : reward
                ));
                
                // รีเซ็ตฟอร์ม
                setEditingReward(null);
                setNewRewardName("");
                setNewRewardDescription("");
            }
        } catch (err) {
            console.error("Error updating reward:", err);
        }
    };

    const handleDeleteReward = async (rewardId) => {
        if (!confirm("คุณต้องการลบรางวัลนี้หรือไม่?")) return;
        
        try {
            await apiCall.delete(`/event/deleteRollingReward/${rewardId}`);
            
            // ลบจาก state
            setRewardList(prev => prev.filter(reward => reward.rollingRewardId !== rewardId));
        } catch (err) {
            console.error("Error deleting reward:", err);
        }
    };

    const openEditModal = (reward) => {
        setEditingReward(reward);
        setNewRewardName(reward.rewardName);
        setNewRewardDescription(reward.description || "");
        setShowSettingsModal(true);
    };

    const openAddModal = () => {
        setEditingReward(null);
        setNewRewardName("");
        setNewRewardDescription("");
        setShowSettingsModal(true);
    };

    const closeSettingsModal = () => {
        setShowSettingsModal(false);
        setEditingReward(null);
        setNewRewardName("");
        setNewRewardDescription("");
    };

    // ฟังก์ชันหมุนวงล้อ
    const spinWheel = async () => {
        if (isSpinning || rewardList.length === 0 || !canPlay) return;

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
                await apiCall.post("/event/saveRollingGameReward", {
                    CustomerName: customerName,
                    OrderFirstStoreID: orderId,
                    RewardId: selectedReward.rollingRewardId,
                    rewardName : selectedReward.rewardName 
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
                        <g key={reward.rollingRewardId || index}>
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
                                {reward.rewardName ?.length > 15 
                                    ? `${reward.rewardName .substring(0, 12)}...` 
                                    : reward.rewardName  || `รางวัล ${index + 1}`
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
        <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 relative">
            {/* Settings Button - Fixed at top right corner */}
            <button
                onClick={openAddModal}
                className="fixed top-4 right-4 btn btn-ghost btn-circle text-base-content/70 hover:text-base-content hover:bg-base-300 z-40"
                title="จัดการรางวัล"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-12">
                <div className="mb-4">
                    <div className="text-6xl mb-2">🎡</div>
                    <h1 className="text-3xl font-bold text-base-content">ชิกโก๋สุ่มรางวัล</h1>
                </div>
                <div className="space-y-1">
                    <p className="text-lg text-base-content">สวัสดี คุณ<span className="font-semibold text-primary">{customerName}</span></p>
                    <p className="text-sm text-base-content/60">หมายเลขคำสั่งซื้อ: <span className="font-mono">{orderId}</span></p>
                    {site && (
                        <p className="text-sm text-base-content/60">สาขา: <span className="font-semibold text-secondary">{site}</span></p>
                    )}
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
                disabled={isSpinning || rewardList.length === 0 || !canPlay}
                className={`btn btn-lg btn-primary shadow-lg transform transition-all duration-200 ${
                    isSpinning 
                        ? 'loading' 
                        : canPlay ? 'hover:scale-105 active:scale-95' : 'btn-disabled'
                }`}
            >
                {isSpinning ? (
                    'กำลังหมุน...'
                ) : !canPlay ? (
                    <>
                        <span className="mr-2">🔒</span>
                        รอการยืนยัน
                    </>
                ) : (
                    <>
                        <span className="mr-2">🎲</span>
                        หมุนวงล้อ
                    </>
                )}
            </button>

            {/* Play Again Modal */}
            {showPlayAgainModal && previousReward && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-2xl">
                        <div className="space-y-6">
                            <div className="text-4xl">🎯</div>
                            <h2 className="text-2xl font-bold text-base-content">คุณเคยเล่นแล้ว!</h2>
                            <div className="space-y-3">
                                <p className="text-base-content/70">คุณได้รับรางวัล</p>
                                <div className="bg-success text-success-content px-4 py-3 rounded-xl font-semibold break-words">
                                    {previousReward.rewardName}
                                    {previousReward.description && ` ${previousReward.description}`}
                                </div>
                                {previousReward.playedAt && (
                                    <p className="text-sm text-base-content/50">
                                        เล่นเมื่อ: {new Date(previousReward.playedAt).toLocaleString('th-TH')}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-3">
                                <p className="text-base-content/70">คุณต้องการเล่นอีกครั้งหรือไม่?</p>
                                <div className="flex gap-3 justify-center">
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowPlayAgainModal(false);
                                            // ไม่ให้เล่น
                                        }}
                                    >
                                        ไม่เล่น
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowPlayAgainModal(false);
                                            setCanPlay(true);
                                        }}
                                    >
                                        <span className="mr-2">🎲</span>
                                        เล่นอีกครั้ง
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-base-content">
                                {editingReward ? "แก้ไขรางวัล" : "จัดการรางวัล"}
                            </h2>
                            <button 
                                className="btn btn-ghost btn-circle"
                                onClick={closeSettingsModal}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Add/Edit Form */}
                        <div className="bg-base-200 rounded-xl p-4 mb-6">
                            <h3 className="text-lg font-semibold mb-3">
                                {editingReward ? "แก้ไขรางวัล" : "เพิ่มรางวัลใหม่"}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="label">
                                        <span className="label-text">ชื่อรางวัล</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="ใส่ชื่อรางวัล"
                                        value={newRewardName}
                                        onChange={(e) => setNewRewardName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">รายละเอียด (ไม่บังคับ)</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full"
                                        placeholder="ใส่รายละเอียดรางวัล"
                                        rows="2"
                                        value={newRewardDescription}
                                        onChange={(e) => setNewRewardDescription(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-primary"
                                        onClick={editingReward ? handleEditReward : handleAddReward}
                                        disabled={!newRewardName.trim()}
                                    >
                                        {editingReward ? "บันทึกการแก้ไข" : "เพิ่มรางวัล"}
                                    </button>
                                    {editingReward && (
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => {
                                                setEditingReward(null);
                                                setNewRewardName("");
                                                setNewRewardDescription("");
                                            }}
                                        >
                                            ยกเลิก
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rewards List */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">รายการรางวัลปัจจุบัน ({rewardList.length} รางวัล)</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {rewardList.map((reward, index) => (
                                    <div key={reward.rollingRewardId || index} className="bg-base-200 rounded-lg p-3 flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold text-base-content">
                                                {reward.rewardName}
                                            </div>
                                            {reward.description && (
                                                <div className="text-sm text-base-content/70 mt-1">
                                                    {reward.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                            <button
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => openEditModal(reward)}
                                                title="แก้ไข"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs text-error"
                                                onClick={() => handleDeleteReward(reward.rollingRewardId)}
                                                title="ลบ"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {rewardList.length === 0 && (
                                    <div className="text-center text-base-content/50 py-8">
                                        ยังไม่มีรางวัลในระบบ
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                {selectedReward.rewardName + ' ' + selectedReward.description }
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