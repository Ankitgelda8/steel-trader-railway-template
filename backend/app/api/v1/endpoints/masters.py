"""Masters endpoints — Company, Branch, Brand, Customer."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
from app.db.base import get_db
from app.models.models import User
from app.schemas.schemas import (
    BranchCreate, BranchOut,
    BrandCreate, BrandOut,
    CompanyCreate, CompanyOut,
    CustomerCreate, CustomerOut,
)
from app.services.master_service import MasterService

router = APIRouter(prefix="/masters", tags=["Masters"])


# ── Company ─────────────────────────────────────────────────

@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.create_company(db, data)


@router.get("/companies", response_model=List[CompanyOut])
def list_companies(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.list_companies(db, skip, limit)


@router.get("/companies/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.get_company(db, company_id)


@router.put("/companies/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    data: CompanyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.update_company(db, company_id, data)


# ── Branch ───────────────────────────────────────────────────

@router.post("/branches", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(
    data: BranchCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.create_branch(db, data)


@router.get("/branches", response_model=List[BranchOut])
def list_branches(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.list_branches(db, company_id)


# ── Brand ────────────────────────────────────────────────────

@router.post("/brands", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
def create_brand(
    data: BrandCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.create_brand(db, data)


@router.get("/brands", response_model=List[BrandOut])
def list_brands(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.list_brands(db)


# ── Customer ─────────────────────────────────────────────────

@router.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.create_customer(db, data)


@router.get("/customers", response_model=List[CustomerOut])
def list_customers(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.list_customers(db, skip, limit)


@router.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.get_customer(db, customer_id)


@router.put("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return MasterService.update_customer(db, customer_id, data)
