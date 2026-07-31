// src/components/LoadingBar.jsx
export default function LoadingBar({ show = false }) {
  return (
    <>
      {/* แถบครอบ: fixed ด้านบนตลอด, กว้างเต็มจอ, ไม่บังการคลิก */}
      <div
        role="progressbar"                 // ช่วยเรื่อง accessibility
        aria-hidden={!show}                // ซ่อนไว้กับ screen reader เมื่อไม่โชว์
        className={[
          "fixed top-0 left-0 w-full z-50",// ลอยด้านบนสุด
          "overflow-hidden pointer-events-none",
          show ? "h-[2px]" : "h-0",       // โชว์/ซ่อนด้วยการปรับความสูง
          "transition-[height] duration-200"
        ].join(" ")}
      >
        {/* แท่งที่วิ่ง: ความกว้าง ~40% + ไล่เฉดโปร่งกลาง และวิ่งอนิเมชันซ้ำ */}
        <div
          className={[
            "h-full w-2/5",
            "bg-gradient-to-r from-transparent via-black/30 to-transparent",
            show ? "animate-[loadingbar_1.2s_linear_infinite]" : ""
          ].join(" ")}
        />
      </div>

      {/* กำหนด keyframes ให้ Tailwind เรียกใช้งานผ่านชื่อ loadingbar */}
      <style>{`
        @keyframes loadingbar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </>
  );
}