// src/lib/dateUtils.js

/**
 * แปลง Date object เป็น yyyy-mm-dd (string) สำหรับ input type="date" (UTC+7)
 */
export function toThaiDateString(date) {
    const tzOffset = 7 * 60; // +7 ชั่วโมง
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000) + (tzOffset * 60000));
    return local.toISOString().slice(0, 10);
}

/**
 * แปลง string (yyyy-mm-dd) เป็นวันที่แบบไทย (เช่น 15 มี.ค. 2569)
 */
export function formatDisplayDate(dateString) {
    const months = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
}

/**
 * แปลง string (yyyy-mm-dd) เป็นวันที่+วัน (เช่น ศ. 15 มี.ค. 2569)
 */
export function formatDateWithDay(dateString) {
    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const months = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${dayName} ${day} ${month} ${year}`;
}
