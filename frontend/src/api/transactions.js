import { api } from "./client";

export async function listTransactions(params = {}) {
  // params can include: type, from_date, to_date
  const res = await api.get("/api/transactions", { params });
  return res.data;
}

export async function createTransaction(payload) {
  const res = await api.post("/api/transactions", payload);
  return res.data;
}

export async function deleteTransaction(txId) {
  const res = await api.delete(`/api/transactions/${txId}`);
  return res.data;
}
