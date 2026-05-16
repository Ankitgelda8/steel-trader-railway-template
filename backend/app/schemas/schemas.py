"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator

from app.models.models import OrderStatus, UserRole


# ─────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.SALES


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ─────────────────────────────────────────────────────────────
# Masters
# ─────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CompanyOut(CompanyCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BranchCreate(BaseModel):
    company_id: int
    name: str
    city: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None


class BranchOut(BranchCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BrandCreate(BaseModel):
    name: str
    grade: Optional[str] = None
    unit: str = "tons"
    description: Optional[str] = None


class BrandOut(BrandCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerCreate(BaseModel):
    name: str
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Purchase
# ─────────────────────────────────────────────────────────────

class PurchaseOrderCreate(BaseModel):
    company_id: int
    branch_id: Optional[int] = None
    brand_id: int
    order_date: datetime
    invoice_number: Optional[str] = None
    ordered_qty: float
    rate_per_ton: float
    notes: Optional[str] = None

    @field_validator("ordered_qty", "rate_per_ton")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than zero")
        return v


class PurchaseOrderUpdate(BaseModel):
    invoice_number: Optional[str] = None
    order_date: Optional[datetime] = None
    ordered_qty: Optional[float] = None
    rate_per_ton: Optional[float] = None
    notes: Optional[str] = None


class PurchaseReceiptCreate(BaseModel):
    receipt_date: datetime
    received_qty: float
    vehicle_number: Optional[str] = None
    challan_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("received_qty")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than zero")
        return v


class PurchaseReceiptOut(BaseModel):
    id: int
    purchase_order_id: int
    receipt_date: datetime
    received_qty: float
    vehicle_number: Optional[str]
    lr_number: Optional[str]
    challan_number: Optional[str]
    notes: Optional[str]
    stock_lot_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderOut(BaseModel):
    id: int
    order_number: str
    company_id: int
    company_name: Optional[str] = None
    branch_id: Optional[int]
    brand_id: int
    brand_name: Optional[str] = None
    order_date: datetime
    invoice_number: Optional[str]
    ordered_qty: float
    received_qty: float
    pending_qty: float
    rate_per_ton: float
    total_value: Optional[float]
    status: OrderStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    receipts: List[PurchaseReceiptOut] = []

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Stock
# ─────────────────────────────────────────────────────────────

class StockLotOut(BaseModel):
    id: int
    lot_number: str
    brand_id: int
    company_id: int
    original_qty: float
    available_qty: float
    cost_per_ton: float
    received_date: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Sale
# ─────────────────────────────────────────────────────────────

class SaleOrderCreate(BaseModel):
    customer_id: int
    brand_id: int
    order_date: datetime
    invoice_number: Optional[str] = None
    ordered_qty: float
    rate_per_ton: float
    notes: Optional[str] = None

    @field_validator("ordered_qty", "rate_per_ton")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than zero")
        return v


class SaleOrderUpdate(BaseModel):
    invoice_number: Optional[str] = None
    order_date: Optional[datetime] = None
    ordered_qty: Optional[float] = None
    rate_per_ton: Optional[float] = None
    notes: Optional[str] = None


class AllocationItem(BaseModel):
    stock_lot_id: int
    allocated_qty: float

    @field_validator("allocated_qty")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than zero")
        return v


class SaleDispatchCreate(BaseModel):
    dispatch_date: datetime
    dispatched_qty: float
    vehicle_number: Optional[str] = None
    lr_number: Optional[str] = None
    challan_number: Optional[str] = None
    notes: Optional[str] = None
    allocations: List[AllocationItem] = []

    @field_validator("dispatched_qty")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than zero")
        return v


class SaleDispatchOut(BaseModel):
    id: int
    sale_order_id: int
    dispatch_date: datetime
    dispatched_qty: float
    vehicle_number: Optional[str]
    lr_number: Optional[str] = None
    challan_number: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SaleOrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: Optional[str] = None
    brand_id: int
    brand_name: Optional[str] = None
    order_date: datetime
    invoice_number: Optional[str]
    ordered_qty: float
    dispatched_qty: float
    pending_qty: float
    rate_per_ton: float
    total_value: Optional[float]
    status: OrderStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    dispatches: List[SaleDispatchOut] = []

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Dashboard / summary
# ─────────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_purchase_orders: int
    open_purchase_orders: int
    total_ordered_qty: float
    total_received_qty: float
    total_pending_receipt_qty: float
    total_sale_orders: int
    open_sale_orders: int
    total_sold_qty: float
    total_pending_dispatch_qty: float
    current_stock_qty: float


class BrandStockRow(BaseModel):
    brand_id: int
    brand_name: str
    unit: str
    total_received: float
    total_sold: float
    current_stock: float
