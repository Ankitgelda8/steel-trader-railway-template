"""
SQLAlchemy ORM models — all tables for the Steel Trader app.

Table relationships:
  Company  ──< SupplierBranch
  Company  ──< PurchaseOrder
  Customer ──< SaleOrder
  Brand    ──< PurchaseOrder
  Brand    ──< SaleOrder
  PurchaseOrder ──< PurchaseReceipt
  SaleOrder     ──< SaleDispatch
  PurchaseReceipt ──< StockLot
  StockLot        ──< DispatchAllocation
  SaleDispatch    ──< DispatchAllocation
  User     ──< PurchaseOrder, SaleOrder (created_by)
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


# ─────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────

class OrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIAL = "PARTIAL"
    COMPLETE = "COMPLETE"
    CANCELLED = "CANCELLED"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SALES = "SALES"
    PURCHASES = "PURCHASES"


# ─────────────────────────────────────────────────────────────
# Master tables
# ─────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.SALES)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())


class Company(Base):
    """Steel supplier company, e.g. UMA Steel."""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    gst_number = Column(String(20))
    contact_person = Column(String(120))
    phone = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime, default=func.now())

    branches = relationship("SupplierBranch", back_populates="company", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="company")


class SupplierBranch(Base):
    """Branch or location of a supplier company."""
    __tablename__ = "supplier_branches"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(200), nullable=False)
    city = Column(String(100))
    contact_person = Column(String(120))
    phone = Column(String(20))
    created_at = Column(DateTime, default=func.now())

    company = relationship("Company", back_populates="branches")
    purchase_orders = relationship("PurchaseOrder", back_populates="branch")


class Brand(Base):
    """Steel brand / product grade, e.g. TATA TMT 500D."""
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    grade = Column(String(100))
    unit = Column(String(20), default="tons")
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())

    purchase_orders = relationship("PurchaseOrder", back_populates="brand")
    sale_orders = relationship("SaleOrder", back_populates="brand")


class Customer(Base):
    """Customer to whom steel is sold."""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    gst_number = Column(String(20))
    contact_person = Column(String(120))
    phone = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime, default=func.now())

    sale_orders = relationship("SaleOrder", back_populates="customer")


# ─────────────────────────────────────────────────────────────
# Purchase side
# ─────────────────────────────────────────────────────────────

class PurchaseOrder(Base):
    """
    Header record for a purchase order.
    One order can have many PurchaseReceipt rows (partial deliveries).
    """
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(60), nullable=False, unique=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("supplier_branches.id"))
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))

    order_date = Column(DateTime, nullable=False)
    invoice_number = Column(String(100))
    ordered_qty = Column(Float, nullable=False)          # total tons ordered
    received_qty = Column(Float, nullable=False, default=0.0)  # auto-updated
    pending_qty = Column(Float, nullable=False)          # = ordered - received
    rate_per_ton = Column(Float, nullable=False)
    total_value = Column(Float)                          # ordered_qty * rate

    status = Column(Enum(OrderStatus), default=OrderStatus.OPEN)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="purchase_orders")
    branch = relationship("SupplierBranch", back_populates="purchase_orders")
    brand = relationship("Brand", back_populates="purchase_orders")
    receipts = relationship("PurchaseReceipt", back_populates="purchase_order",
                            cascade="all, delete-orphan", order_by="PurchaseReceipt.receipt_date")


class PurchaseReceipt(Base):
    """
    One partial delivery against a PurchaseOrder.
    Each receipt creates one StockLot entry.
    """
    __tablename__ = "purchase_receipts"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))

    receipt_date = Column(DateTime, nullable=False)
    received_qty = Column(Float, nullable=False)
    vehicle_number = Column(String(60))
    lr_number = Column(String(100))
    challan_number = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())

    purchase_order = relationship("PurchaseOrder", back_populates="receipts")
    stock_lot = relationship("StockLot", back_populates="receipt", uselist=False,
                             cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────
# Inventory
# ─────────────────────────────────────────────────────────────

class StockLot(Base):
    """
    One lot of physical stock created from a PurchaseReceipt.
    available_qty decreases as SaleDispatch entries consume it.
    """
    __tablename__ = "stock_lots"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("purchase_receipts.id"), nullable=False, unique=True)

    lot_number = Column(String(80), nullable=False, unique=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    original_qty = Column(Float, nullable=False)
    available_qty = Column(Float, nullable=False)        # reduces on dispatch
    cost_per_ton = Column(Float, nullable=False)
    received_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())

    receipt = relationship("PurchaseReceipt", back_populates="stock_lot")
    allocations = relationship("DispatchAllocation", back_populates="stock_lot",
                               cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────
# Sale side
# ─────────────────────────────────────────────────────────────

class SaleOrder(Base):
    """
    Header record for a sale order to a customer.
    One order can have many SaleDispatch rows (truck-wise loadings).
    """
    __tablename__ = "sale_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(60), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))

    order_date = Column(DateTime, nullable=False)
    invoice_number = Column(String(100))
    ordered_qty = Column(Float, nullable=False)          # total tons ordered by customer
    dispatched_qty = Column(Float, nullable=False, default=0.0)  # auto-updated
    pending_qty = Column(Float, nullable=False)          # = ordered - dispatched
    rate_per_ton = Column(Float, nullable=False)
    total_value = Column(Float)                          # ordered_qty * rate

    status = Column(Enum(OrderStatus), default=OrderStatus.OPEN)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="sale_orders")
    brand = relationship("Brand", back_populates="sale_orders")
    dispatches = relationship("SaleDispatch", back_populates="sale_order",
                              cascade="all, delete-orphan", order_by="SaleDispatch.dispatch_date")


class SaleDispatch(Base):
    """
    One truck-load dispatched against a SaleOrder.
    Each dispatch has one or more DispatchAllocation rows linking to stock lots.
    """
    __tablename__ = "sale_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    sale_order_id = Column(Integer, ForeignKey("sale_orders.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))

    dispatch_date = Column(DateTime, nullable=False)
    dispatched_qty = Column(Float, nullable=False)
    vehicle_number = Column(String(60))
    lr_number = Column(String(100))
    challan_number = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())

    sale_order = relationship("SaleOrder", back_populates="dispatches")
    allocations = relationship("DispatchAllocation", back_populates="dispatch",
                               cascade="all, delete-orphan")


class DispatchAllocation(Base):
    """
    Links a SaleDispatch to one or more StockLots (manual allocation by user).
    allocated_qty reduces StockLot.available_qty.
    """
    __tablename__ = "dispatch_allocations"

    id = Column(Integer, primary_key=True, index=True)
    dispatch_id = Column(Integer, ForeignKey("sale_dispatches.id"), nullable=False)
    stock_lot_id = Column(Integer, ForeignKey("stock_lots.id"), nullable=False)
    allocated_qty = Column(Float, nullable=False)
    created_at = Column(DateTime, default=func.now())

    dispatch = relationship("SaleDispatch", back_populates="allocations")
    stock_lot = relationship("StockLot", back_populates="allocations")


# ─────────────────────────────────────────────────────────────
# Audit log
# ─────────────────────────────────────────────────────────────

class AuditLog(Base):
    """Immutable append-only record of every state change."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entity_type = Column(String(80), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(40), nullable=False)          # CREATE / UPDATE / DELETE
    detail = Column(Text)
    created_at = Column(DateTime, default=func.now())
