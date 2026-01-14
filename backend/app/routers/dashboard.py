from fastapi import APIRouter, Depends
from datetime import date
from typing import Optional

from .transactions import STORE as TX_STORE   # ✅ FIXED import style

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# (Replace with your real auth)
def get_current_user():
    return {"id": "user_1", "email": "demo@example.com"}

@router.get("/summary")
def dashboard_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    txs = TX_STORE.get(user_id, [])

    today = date.today()
    month = month or today.month
    year = year or today.year

    month_txs = [t for t in txs if t.tx_date.month == month and t.tx_date.year == year]

    income = sum(t.amount for t in month_txs if t.type == "income")
    expense = sum(t.amount for t in month_txs if t.type == "expense")
    investments = sum(t.amount for t in month_txs if t.type == "investment")
    savings = income - expense

    return {
        "month": month,
        "year": year,
        "income": income,
        "expense": expense,
        "investments": investments,
        "savings": savings,
        "transactions_count": len(month_txs),
    }
