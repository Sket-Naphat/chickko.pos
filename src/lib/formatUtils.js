// src/lib/formatUtils.js

/**
 * แปลงตัวเลขเป็นสตริงคั่นหลักพันแบบไทย เช่น 1234.5 -> "1,234.5"
 */
export function formatCurrency(amount) {
    return Number(amount ?? 0).toLocaleString();
}
