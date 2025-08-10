// src/components/Toast.jsx
import { useEffect } from "react";

/**
 * Props:
 * - message: string | null   ข้อความที่จะแสดง (ไม่มี = ไม่แสดง)
 * - onClose: () => void      ฟังก์ชันปิด toast
 * - type?: "error" | "success" | "info"   สีหลัก (ดีฟอลต์ error)
 * - duration?: number        เวลา auto-hide (ms), ดีฟอลต์ 4000
 */
export default function Toast({ message, onClose, type = "error", duration = 4000 }) {
  // ตั้งเวลา auto-hide + ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onClose?.(), duration);
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [message, duration, onClose]);

  if (!message) return null;

  // เลือกสีพื้นตามชนิด
  const color =
    type === "success" ? "bg-emerald-500" :
    type === "info"    ? "bg-sky-500"     :
                         "bg-rose-500"; // error

  return (
    <>
      {/* กล่องวางตำแหน่ง: มุมขวาล่าง, ไม่บังคลิกส่วนอื่น (pointer-events-none) */}
      <div className="fixed right-4 bottom-4 z-[100] pointer-events-none">
        {/* ตัว toast: เปิดรับคลิกเองเท่านั้น (pointer-events-auto) */}
        <div
          role="alert"
          aria-live="polite"
          className={[
            "pointer-events-auto",
            "max-w-[360px] rounded-2xl shadow-lg backdrop-blur",
            "px-4 py-3 text-white",
            color,
            // เข้าจอแบบนุ่ม ๆ
            "animate-[toast-in_160ms_ease-out]",
          ].join(" ")}
          onClick={onClose} // คลิกกล่องเพื่อปิดก็ได้
          title="Click to dismiss"
        >
          <div className="flex items-start gap-3">
            <span className="text-sm leading-5">{message}</span>
            {/* ปุ่มกากบาทปิด */}
            <button
              type="button"
              aria-label="Dismiss"
              className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition"
              onClick={(e) => {
                e.stopPropagation(); // กันฟองคลิกไปปิดซ้ำ
                onClose?.();
              }}
            >
              {/* ไอคอน X แบบเบา ๆ */}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* keyframes สำหรับแอนิเมชันเข้า */}
      <style>{`
        @keyframes toast-in {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}