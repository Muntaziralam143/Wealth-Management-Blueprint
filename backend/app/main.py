from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, engine
from .routers.admin_router import router as admin_router


# ✅ IMPORT MODELS (important for SQLAlchemy)
from .models import user, goal, transaction


# ✅ ROUTERS (match filenames exactly)
from .routers.auth_router import router as auth_router
from .routers.user_router import router as user_router
from .routers.goals_router import router as goals_router
from .routers.portfolio_router import router as portfolio_router
from .routers.market_router import router as market_router

from .routers.transactions import router as transactions_router
from .routers.dashboard import router as dashboard_router
from .routers.analytics import router as analytics_router

# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True, "message": "API running"}

# Core routes
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(user_router, prefix=settings.API_V1_PREFIX)
app.include_router(goals_router, prefix=settings.API_V1_PREFIX)
app.include_router(portfolio_router, prefix=settings.API_V1_PREFIX)
app.include_router(market_router, prefix=settings.API_V1_PREFIX)

# New feature routes
app.include_router(transactions_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

