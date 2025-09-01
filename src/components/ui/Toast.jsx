// ใช้กับ daisyUI + Tailwind
export default function Toast({
  show = false,
  message = "",
  type = "success", // "success" | "error" | "info" | "warning"
  position = "top-center", // "top-center" | "bottom-center" | "top-start" | "top-end" | ...
  className = "",
}) {
  if (!show || !message) return null;

  // map ตำแหน่งให้เป็นคลาสของ daisyUI
  const posMap = {
    "top-center": "toast-top toast-center",
    "bottom-center": "toast-bottom toast-center",
    "top-start": "toast-top toast-start",
    "top-end": "toast-top toast-end",
    "bottom-start": "toast-bottom toast-start",
    "bottom-end": "toast-bottom toast-end",
  };

  const base =
    "toast z-[1000] w-11/12 sm:w-3/4 md:w-1/2 max-w-xl py-4 " + (posMap[position] || posMap["top-center"]);

  const alertClass =
    type === "success"
      ? "alert alert-success"
      : type === "error"
      ? "alert alert-error"
      : type === "warning"
      ? "alert alert-warning"
      : "alert alert-info";

  return (
    <div className={`${base} ${className}`}>
      <div role="alert" className={alertClass} aria-live="polite">
        <span>{message}</span>
      </div>
    </div>
  );
}
