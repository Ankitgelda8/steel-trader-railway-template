from fastapi import APIRouter
from app.api.v1.endpoints import auth, masters, purchases, sales, stock

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(masters.router)
api_router.include_router(purchases.router)
api_router.include_router(sales.router)
api_router.include_router(stock.router)
