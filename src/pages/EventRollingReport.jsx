import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function EventRollingReport() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalStats, setTotalStats] = useState({
        totalPlayers: 0,
        totalPlays: 0,
        todayPlays: 0
    });
    
    // States สำหรับจัดการรางวัล
    const [rewardList, setRewardList] = useState([]);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [newRewardName, setNewRewardName] = useState("");
    const [newRewardDescription, setNewRewardDescription] = useState("");

    // โหลดข้อมูลรายงาน
    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const endpoint = selectedDate 
                    ? `/event/getRollingGameReport?date=${selectedDate}`
                    : "/event/getRollingGameReport";
                
                const response = await api.get(endpoint);
                const data = response.data?.data || response.data || [];
                
                // จัดกลุ่มข้อมูลตามวันที่
                const groupedData = groupDataByDate(data);
                setReportData(groupedData);
                
                // คำนวณสถิติ
                calculateStats(data);
                
            } catch (err) {
                console.error("Error fetching report data:", err);
                // ไม่มีข้อมูลหรือเกิดข้อผิดพลาด - แสดงเป็นไม่มีผู้เข้าร่วม
                setReportData([]);
                setTotalStats({
                    totalPlayers: 0,
                    totalPlays: 0,
                    todayPlays: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [selectedDate]);

    // โหลดรายการรางวัล
    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const response = await api.get("/event/getRollingRewardList");
            const rewards = response.data?.data || response.data || [];
            setRewardList(rewards);
        } catch (err) {
            console.error("Error fetching rewards:", err);
            setRewardList([]);
        }
    };

    // ฟังก์ชันจัดการรางวัล
    const handleAddReward = async () => {
        if (!newRewardName.trim()) return;
        
        try {
            const response = await api.post("/event/addRollingReward", {
                rewardName: newRewardName,
                description: newRewardDescription
            });
            
            if (response.data) {
                await fetchRewards(); // รีเฟรชรายการรางวัล
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
            const response = await api.put("/event/updateRollingReward", {
                RollingRewardId: editingReward.rollingRewardId,
                RewardName: newRewardName,
                Description: newRewardDescription,
                Probability: 0
            });
            
            if (response.data) {
                await fetchRewards(); // รีเฟรชรายการรางวัล
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
            await api.delete(`/event/deleteRollingReward/${rewardId}`);
            await fetchRewards(); // รีเฟรชรายการรางวัล
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

    const groupDataByDate = (data) => {
        const grouped = {};
        data.forEach(item => {
            const date = item.createdDate || item.playDate;
            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    plays: []
                };
            }
            grouped[date].plays.push({
                id: item.id,
                customerName: item.customerName,
                orderId: item.orderFirstStoreID || item.orderId,
                rewardName: item.reward?.rewardName || item.rewardName,
                playTime: (item.createdTime || item.playTime || "").split(".")[0] // ตัดมิลลิวินาทีออก
            });
        });
        
        // เรียงตามวันที่ (ใหม่ไปเก่า)
        return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const calculateStats = (data) => {
        const today = new Date().toISOString().split('T')[0];
        const todayPlays = data.filter(item => 
            (item.createdDate || item.playDate) === today
        ).length;
        
        const uniquePlayers = new Set(data.map(item => item.customerName)).size;
        
        setTotalStats({
            totalPlayers: uniquePlayers,
            totalPlays: data.length,
            todayPlays: todayPlays
        });
    };

    const formatThaiDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-base-content/70">กำลังโหลดรายงาน...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-4">
            {/* Header */}
            <div className="text-center mb-6 px-4">
                <div className="mb-4">
                    <div className="text-4xl sm:text-6xl mb-2">📊</div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content">รายงานสล็อตแมชชีน</h1>
                    <p className="text-sm sm:text-base lg:text-lg text-base-content/70 mt-2">
                        ประวัติการเล่นเกมและสถิติการใช้งาน
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-0">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="stat bg-base-100 rounded-2xl shadow-lg p-4">
                        <div className="stat-figure text-primary">
                            <div className="text-2xl sm:text-3xl">👥</div>
                        </div>
                        <div className="stat-title text-sm sm:text-base">ผู้เล่นทั้งหมด</div>
                        <div className="stat-value text-primary text-2xl sm:text-3xl">{totalStats.totalPlayers}</div>
                        <div className="stat-desc text-xs sm:text-sm">คนที่เคยเล่น</div>
                    </div>

                    <div className="stat bg-base-100 rounded-2xl shadow-lg p-4">
                        <div className="stat-figure text-secondary">
                            <div className="text-2xl sm:text-3xl">�</div>
                        </div>
                        <div className="stat-title text-sm sm:text-base">จำนวนการเล่นทั้งหมด</div>
                        <div className="stat-value text-secondary text-2xl sm:text-3xl">{totalStats.totalPlays}</div>
                        <div className="stat-desc text-xs sm:text-sm">ครั้งทั้งหมด</div>
                    </div>

                    <div className="stat bg-base-100 rounded-2xl shadow-lg p-4 sm:col-span-2 lg:col-span-1">
                        <div className="stat-figure text-accent">
                            <div className="text-2xl sm:text-3xl">📅</div>
                        </div>
                        <div className="stat-title text-sm sm:text-base">วันนี้</div>
                        <div className="stat-value text-accent text-2xl sm:text-3xl">{totalStats.todayPlays}</div>
                        <div className="stat-desc text-xs sm:text-sm">ครั้งที่เล่นวันนี้</div>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="bg-base-100 rounded-2xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg sm:text-xl font-bold text-base-content text-center sm:text-left">
                            🔍 กรองข้อมูล
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={openAddModal}
                                className="btn btn-primary btn-sm flex-1 sm:flex-none"
                                title="จัดการรางวัล"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">แก้ไขของรางวัล</span>
                                <span className="sm:hidden">จัดการรางวัล</span>
                            </button>
                            <div className="flex gap-2 flex-1">
                                <input
                                    type="date"
                                    className="input input-bordered flex-1"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <button
                                    className="btn btn-ghost btn-sm whitespace-nowrap"
                                    onClick={() => setSelectedDate("")}
                                >
                                    <span className="hidden sm:inline">แสดงทั้งหมด</span>
                                    <span className="sm:hidden">ทั้งหมด</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Reports */}
                <div className="space-y-6">
                    {reportData.length === 0 ? (
                        <div className="bg-base-100 rounded-2xl p-8 sm:p-12 shadow-lg text-center">
                            <div className="text-4xl sm:text-6xl mb-4">📝</div>
                            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-2">
                                ไม่มีข้อมูลการเล่น
                            </h3>
                            <p className="text-sm sm:text-base text-base-content/70 px-4">
                                {selectedDate 
                                    ? `ไม่มีข้อมูลการเล่นในวันที่ ${formatThaiDate(selectedDate)}`
                                    : "ยังไม่มีผู้เล่นเกมสล็อตแมชชีน"
                                }
                            </p>
                        </div>
                    ) : (
                        reportData.map((dayData) => (
                            <div key={dayData.date} className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
                                {/* Day Header */}
                                <div className="bg-gradient-to-r from-primary to-secondary p-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <div className="flex-1">
                                            <h3 className="text-lg sm:text-xl font-bold text-primary-content">
                                                📅 {formatThaiDate(dayData.date)}
                                            </h3>
                                            <p className="text-sm sm:text-base text-primary-content/80">
                                                มีการเล่น {dayData.plays.length} ครั้ง
                                            </p>
                                        </div>
                                        <div className="badge badge-sm sm:badge-lg bg-white text-primary self-start sm:self-center">
                                            {dayData.plays.length} เกม
                                        </div>
                                    </div>
                                </div>

                                {/* Games List */}
                                <div className="p-4 sm:p-6">
                                    <div className="space-y-3 sm:space-y-4">
                                        {dayData.plays.map((play, index) => (
                                            <div key={play.id} className="bg-base-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-primary-content font-bold text-sm sm:text-base">
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-semibold text-base-content text-base sm:text-lg truncate">
                                                                👤 {play.customerName}
                                                            </h4>
                                                            <p className="text-xs sm:text-sm text-base-content/70 truncate">
                                                                📋 {play.orderId}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:text-right gap-1">
                                                        <div className="bg-success text-success-content px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium">
                                                            🎁 {play.rewardName}
                                                        </div>
                                                        <p className="text-xs text-base-content/60">
                                                            ⏰ {play.playTime}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Back Button */}
                <div className="text-center mt-8">
                    <button 
                        onClick={() => window.history.back()}
                        className="btn btn-ghost btn-wide"
                    >
                        <span className="mr-2">←</span>
                        กลับ
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                        <h3 className="font-bold text-lg mb-4">
                            {editingReward ? "แก้ไขรางวัล" : "แก้ไขรายการในสล็อต"}
                        </h3>
                        
                        {/* Add/Edit Form */}
                        <div className="mb-6 p-4 bg-base-200 rounded-lg">
                            <div className="grid grid-cols-1 gap-4 mb-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text">ชื่อรางวัล</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="กรอกชื่อรางวัล"
                                        className="input input-bordered w-full"
                                        value={newRewardName}
                                        onChange={(e) => setNewRewardName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text">คำอธิบาย</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="กรอกคำอธิบาย (ไม่บังคับ)"
                                        className="input input-bordered w-full"
                                        value={newRewardDescription}
                                        onChange={(e) => setNewRewardDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    className="btn btn-primary flex-1 sm:flex-none"
                                    onClick={editingReward ? handleEditReward : handleAddReward}
                                    disabled={!newRewardName.trim()}
                                >
                                    {editingReward ? "บันทึกการแก้ไข" : "เพิ่มรางวัล"}
                                </button>
                                {editingReward && (
                                    <button
                                        className="btn btn-ghost flex-1 sm:flex-none"
                                        onClick={() => {
                                            setEditingReward(null);
                                            setNewRewardName("");
                                            setNewRewardDescription("");
                                        }}
                                    >
                                        ยกเลิกการแก้ไข
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Rewards List */}
                        <div className="mb-4">
                            <h4 className="font-semibold mb-3 text-sm sm:text-base">รายการรางวัลปัจจุบัน ({rewardList.length} รายการ)</h4>
                            {rewardList.length === 0 ? (
                                <p className="text-center text-base-content/50 py-8 text-sm">
                                    ยังไม่มีรางวัลในระบบ
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {rewardList.map((reward, index) => (
                                        <div key={reward.rollingRewardId || index} 
                                             className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-base-100 rounded-lg border">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm sm:text-base truncate">{reward.rewardName}</div>
                                                {reward.description && (
                                                    <div className="text-xs sm:text-sm text-base-content/70 truncate">
                                                        {reward.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 self-end sm:self-center">
                                                <button
                                                    className="btn btn-ghost btn-xs sm:btn-sm"
                                                    onClick={() => openEditModal(reward)}
                                                    title="แก้ไข"
                                                >
                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-xs sm:btn-sm text-error hover:bg-error hover:text-error-content"
                                                    onClick={() => handleDeleteReward(reward.rollingRewardId)}
                                                    title="ลบ"
                                                >
                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={closeSettingsModal}>
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
