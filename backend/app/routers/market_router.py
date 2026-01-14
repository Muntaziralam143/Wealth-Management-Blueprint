from fastapi import APIRouter

router = APIRouter(prefix="/market", tags=["Market"])

@router.get("/status")
def market_status():
    return {"ok": True, "market": "stub"}
