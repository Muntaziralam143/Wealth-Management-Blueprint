# routers/transactions.py
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import date, datetime
import uuid

# ✅ Replace this import with your real auth dependency
# from deps.auth import get_current_user
def get_current_user():
    # dummy - replace with your real logic
    return {"id": "user_1", "email": "demo@example.com"}

router = APIRouter(prefix="/transactions", tags=["Transactions"])


TransactionType = Literal["income", "expense", "investment"]

class TransactionIn(BaseModel):
    type: TransactionType
    amount: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)
    tx_date: date
    note: Optional[str] = Field(default=None, max_length=200)

class TransactionOut(TransactionIn):
    id: str
    created_at: datetime

# ✅ In-memory store (works now). Later swap with DB easily.
# key: user_id -> list[TransactionOut]
STORE: dict[str, List[TransactionOut]] = {}

@router.get("", response_model=List[TransactionOut])
def list_transactions(
    type: Optional[TransactionType] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    items = STORE.get(user_id, [])

    def ok(t: TransactionOut):
        if type and t.type != type:
            return False
        if from_date and t.tx_date < from_date:
            return False
        if to_date and t.tx_date > to_date:
            return False
        return True

    return [t for t in items if ok(t)]

@router.post("", response_model=TransactionOut)
def create_transaction(payload: TransactionIn, current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    tx = TransactionOut(
        id=str(uuid.uuid4()),
        created_at=datetime.utcnow(),
        **payload.model_dump(),
    )
    STORE.setdefault(user_id, []).append(tx)
    return tx

@router.delete("/{tx_id}")
def delete_transaction(tx_id: str, current_user=Depends(get_current_user)):
    user_id = current_user["id"]
    items = STORE.get(user_id, [])
    before = len(items)
    items = [t for t in items if t.id != tx_id]
    STORE[user_id] = items

    if len(items) == before:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True}
