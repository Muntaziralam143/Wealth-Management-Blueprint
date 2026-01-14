import { api } from "./client";

export async function getDashboardSummary(params = {}) {
  // params: { month, year } optional
  const res = await api.get("/api/dashboard/summary", { params });
  return res.data;
}
