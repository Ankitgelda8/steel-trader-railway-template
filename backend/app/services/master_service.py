"""
Business logic for master data (Company, Branch, Brand, Customer).
"""

from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.models import Company, SupplierBranch, Brand, Customer
from app.schemas.schemas import (
    CompanyCreate, BranchCreate, BrandCreate, CustomerCreate,
)


class MasterService:

    # ── Company ──────────────────────────────────────────────

    @staticmethod
    def create_company(db: Session, data: CompanyCreate) -> Company:
        obj = Company(**data.model_dump())
        db.add(obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Company name already exists")
        db.refresh(obj)
        return obj

    @staticmethod
    def list_companies(db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
        return db.query(Company).order_by(Company.name).offset(skip).limit(limit).all()

    @staticmethod
    def get_company(db: Session, company_id: int) -> Optional[Company]:
        return db.query(Company).filter(Company.id == company_id).first()

    @staticmethod
    def update_company(db: Session, company_id: int, data: CompanyCreate) -> Optional[Company]:
        obj = db.query(Company).filter(Company.id == company_id).first()
        if not obj:
            return None
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj

    # ── Branch ───────────────────────────────────────────────

    @staticmethod
    def create_branch(db: Session, data: BranchCreate) -> SupplierBranch:
        obj = SupplierBranch(**data.model_dump())
        db.add(obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Branch name already exists for this company")
        db.refresh(obj)
        return obj

    @staticmethod
    def list_branches(db: Session, company_id: Optional[int] = None) -> List[SupplierBranch]:
        q = db.query(SupplierBranch)
        if company_id:
            q = q.filter(SupplierBranch.company_id == company_id)
        return q.order_by(SupplierBranch.name).all()

    # ── Brand ────────────────────────────────────────────────

    @staticmethod
    def create_brand(db: Session, data: BrandCreate) -> Brand:
        obj = Brand(**data.model_dump())
        db.add(obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Brand name already exists")
        db.refresh(obj)
        return obj

    @staticmethod
    def list_brands(db: Session) -> List[Brand]:
        return db.query(Brand).order_by(Brand.name).all()

    # ── Customer ─────────────────────────────────────────────

    @staticmethod
    def create_customer(db: Session, data: CustomerCreate) -> Customer:
        obj = Customer(**data.model_dump())
        db.add(obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Customer name already exists")
        db.refresh(obj)
        return obj

    @staticmethod
    def list_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
        return db.query(Customer).order_by(Customer.name).offset(skip).limit(limit).all()

    @staticmethod
    def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def update_customer(db: Session, customer_id: int, data: CustomerCreate) -> Optional[Customer]:
        obj = db.query(Customer).filter(Customer.id == customer_id).first()
        if not obj:
            return None
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj
