from fastapi import APIRouter

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("")
def get_portfolio():
    return {
        "message": "Portfolio endpoint working",
        "holdings": []
    }
