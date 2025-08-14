import { api } from "../lib/api";
export async function getCostCategories() {
    const res = await api.get("/cost/GetCostCategoryList"); // ✅ path ตาม Controller คุณ
    return res.data ?? [];
}
