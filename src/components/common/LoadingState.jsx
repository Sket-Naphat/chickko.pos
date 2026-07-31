// บล็อกแสดงสถานะ "กำลังโหลดข้อมูล..." แบบ DaisyUI ใช้ร่วมกันระหว่างส่วนต่างๆ ที่ fetch ข้อมูลเป็น list
export default function LoadingState({ label = "กำลังโหลดข้อมูล..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 bg-gradient-to-br from-base-100 to-base-200 rounded-xl border border-base-300">
      <span className="loading loading-dots loading-md text-primary"></span>
      <span className="text-sm md:text-base text-base-content/80 font-medium">{label}</span>
    </div>
  );
}
