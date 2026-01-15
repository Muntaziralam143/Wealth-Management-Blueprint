import { api } from "./client";

export async function listGoals() {
  const res = await api.get("/api/goals");
  return res.data;
}

export async function createGoal(payload) {
  const res = await api.post("/api/goals", payload);
  return res.data;
}
