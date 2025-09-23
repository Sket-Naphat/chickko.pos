import { useNavigate } from "react-router-dom";

export default function Event() {
    const navigate = useNavigate();

    // ข้อมูลกิจกรรมทั้งหมด
    const events = [
        {
            id: 'rolling-game',
            title: 'วงล้อนำโชค',
            description: 'หมุนวงล้อเพื่อรับรางวัลสุดพิเศษ! ลุ้นรางวัลใหญ่ทุกครั้งที่หมุน',
            icon: '🎡',
            color: 'from-blue-500 to-purple-600',
            status: 'active',
            path: '/rolling-game-report', // เปลี่ยนเป็นหน้ารายงานกิจกรรม
            tags: ['สุ่มรางวัล', 'โชคดี', 'รางวัลใหญ่']
        },

    ];

    const handleEventClick = (event) => {
        if (event.status === 'active') {
            navigate(event.path);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 p-4">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-base-content mb-2">🎮 กิจกรรม</h1>
                <p className="text-base-content/60">เลือกกิจกรรมที่ต้องการ</p>
            </div>

            {/* Events Grid */}
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`
                                card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer
                                ${event.status === 'active' 
                                    ? 'hover:scale-[1.02]' 
                                    : 'opacity-60 cursor-not-allowed'
                                }
                            `}
                        >
                            <div className="card-body p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{event.icon}</div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-base-content">
                                                {event.title}
                                            </h2>
                                            {event.status === 'active' && (
                                                <div className="badge badge-success badge-xs">
                                                    เปิดใช้งาน
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-base-content/70 text-sm mb-4">
                                    {event.description}
                                </p>

                                {/* Action */}
                                <div className="flex justify-end">
                                    {event.status === 'active' ? (
                                        <div className="text-primary text-sm font-medium">
                                            คลิกเพื่อดูรายงาน →
                                        </div>
                                    ) : (
                                        <div className="text-base-content/40 text-sm">
                                            เร็ว ๆ นี้
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Card */}
                <div className="mt-8">
                    <div className="bg-base-100 rounded-lg p-4 shadow-md">
                        <div className="text-center">
                            <p className="text-base-content/60 text-sm">
                                📋 กิจกรรมปัจจุบัน: <span className="font-medium">1 รายการ</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="text-center mt-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost"
                    >
                        ← กลับ
                    </button>
                </div>
            </div>
        </div>
    );
}
