from fastapi import APIRouter
from .auth import router as auth_router
from .company import router as company_router
from .reference import router as reference_router
from .opportunities import router as opportunities_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(company_router, prefix="/company", tags=["Company"])
api_router.include_router(reference_router, prefix="/reference", tags=["Reference Data"])
api_router.include_router(opportunities_router, tags=["Opportunities & Evaluations"])

__all__ = ["api_router"]
