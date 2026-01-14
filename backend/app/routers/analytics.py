from fastapi import APIRouter, Depends, Query
from datetime import date
from typing import Dict, Optional

from .transactions import STORE as TX_STORE  # ✅ FIXED import style

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# (Replace with your real auth)
def get_current_user():
    return {"id": "user_1", "email": "demo@example.com"}

@router.get("/spending-by-category")
def spending_by_category(
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    txs = TX_STORE.get(user_id, [])

    bucket: Dict[str, float] = {}
    for t in txs:
        if t.type != "expense":
            continue
        if from_date and t.tx_date < from_date:
            continue
        if to_date and t.tx_date > to_date:
            continue
        bucket[t.category] = bucket.get(t.category, 0) + t.amount

    return [{"name": k, "value": v} for k, v in bucket.items()]
