import { api } from "./client";

export async function getMe() {
  const res = await api.get("/api/users/me");
  return res.data;
}
