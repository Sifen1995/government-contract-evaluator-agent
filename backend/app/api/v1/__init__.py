from fastapi import APIRouter
from .auth import router as auth_router
from .company import router as company_router
from .reference import router as reference_router
from .opportunities import router as opportunities_router
from app.api.v1.awards import router as awards_router
from .documents import router as documents_router
from .agencies import router as agencies_router
from .evaluations import router as evaluations_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(company_router, prefix="/company", tags=["Company"])
api_router.include_router(reference_router, prefix="/reference", tags=["Reference Data"])
api_router.include_router(opportunities_router, tags=["Opportunities & Evaluations"])
api_router.include_router(awards_router)
api_router.include_router(documents_router, prefix="/documents", tags=["Document Management"])
api_router.include_router(agencies_router, prefix="/agencies", tags=["Authority Mapping"])
api_router.include_router(evaluations_router, prefix="/evaluations", tags=["Dynamic Re-scoring"])



__all__ = ["api_router"]
