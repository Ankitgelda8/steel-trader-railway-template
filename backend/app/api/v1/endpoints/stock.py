"""Stock and dashboard endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
from app.db.base import get_db
from app.models.models import (
    Brand, OrderStatus, PurchaseOrder, SaleOrder, StockLot, User,
)
from app.schemas.schemas import BrandStockRow, DashboardSummary, StockLotOut

router = APIRouter(prefix="/stock", tags=["Stock & Dashboard"])


@router.get("/lots", response_model=List[StockLotOut])
def list_stock_lots(
    brand_id: Optional[int] = None,
    company_id: Optional[int] = None,
    with_balance_only: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    List available stock lots.
    Set with_balance_only=true (default) to show only lots that still have stock.
    """
    q = db.query(StockLot)
    if brand_id:
        q = q.filter(StockLot.brand_id == brand_id)
    if company_id:
        q = q.filter(StockLot.company_id == company_id)
    if with_balance_only:
        q = q.filter(StockLot.available_qty > 0)
    return q.order_by(StockLot.received_date).all()


@router.get("/brand-report", response_model=List[BrandStockRow])
def brand_stock_report(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Per-brand summary: total received, total sold, current available stock."""
    received_sq = (
        db.query(
            PurchaseOrder.brand_id,
            func.coalesce(func.sum(PurchaseOrder.received_qty), 0.0).label("received"),
        )
        .group_by(PurchaseOrder.brand_id)
        .subquery()
    )
    sold_sq = (
        db.query(
            SaleOrder.brand_id,
            func.coalesce(func.sum(SaleOrder.dispatched_qty), 0.0).label("sold"),
        )
        .group_by(SaleOrder.brand_id)
        .subquery()
    )
    rows = (
        db.query(
            Brand.id.label("brand_id"),
            Brand.name.label("brand_name"),
            Brand.unit,
            func.coalesce(received_sq.c.received, 0.0).label("total_received"),
            func.coalesce(sold_sq.c.sold, 0.0).label("total_sold"),
        )
        .outerjoin(received_sq, received_sq.c.brand_id == Brand.id)
        .outerjoin(sold_sq, sold_sq.c.brand_id == Brand.id)
        .order_by(Brand.name)
        .all()
    )
    return [
        BrandStockRow(
            brand_id=r.brand_id,
            brand_name=r.brand_name,
            unit=r.unit or "tons",
            total_received=r.total_received,
            total_sold=r.total_sold,
            current_stock=round(r.total_received - r.total_sold, 4),
        )
        for r in rows
    ]


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    def po_agg(field, filter_status=None):
        q = db.query(func.coalesce(func.sum(field), 0.0))
        if filter_status:
            q = q.filter(PurchaseOrder.status == filter_status)
        return q.scalar() or 0.0

    def so_agg(field, filter_status=None):
        q = db.query(func.coalesce(func.sum(field), 0.0))
        if filter_status:
            q = q.filter(SaleOrder.status == filter_status)
        return q.scalar() or 0.0

    total_pos = db.query(func.count(PurchaseOrder.id)).scalar() or 0
    open_pos = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status.in_([OrderStatus.OPEN, OrderStatus.PARTIAL])
    ).scalar() or 0
    total_ordered = db.query(func.coalesce(func.sum(PurchaseOrder.ordered_qty), 0.0)).scalar() or 0.0
    total_received = db.query(func.coalesce(func.sum(PurchaseOrder.received_qty), 0.0)).scalar() or 0.0
    total_pending_receipt = db.query(func.coalesce(func.sum(PurchaseOrder.pending_qty), 0.0)).filter(
        PurchaseOrder.status.in_([OrderStatus.OPEN, OrderStatus.PARTIAL])
    ).scalar() or 0.0

    total_sos = db.query(func.count(SaleOrder.id)).scalar() or 0
    open_sos = db.query(func.count(SaleOrder.id)).filter(
        SaleOrder.status.in_([OrderStatus.OPEN, OrderStatus.PARTIAL])
    ).scalar() or 0
    total_sold = db.query(func.coalesce(func.sum(SaleOrder.dispatched_qty), 0.0)).scalar() or 0.0
    total_pending_dispatch = db.query(func.coalesce(func.sum(SaleOrder.pending_qty), 0.0)).filter(
        SaleOrder.status.in_([OrderStatus.OPEN, OrderStatus.PARTIAL])
    ).scalar() or 0.0

    current_stock = db.query(func.coalesce(func.sum(StockLot.available_qty), 0.0)).scalar() or 0.0

    return DashboardSummary(
        total_purchase_orders=total_pos,
        open_purchase_orders=open_pos,
        total_ordered_qty=total_ordered,
        total_received_qty=total_received,
        total_pending_receipt_qty=total_pending_receipt,
        total_sale_orders=total_sos,
        open_sale_orders=open_sos,
        total_sold_qty=total_sold,
        total_pending_dispatch_qty=total_pending_dispatch,
        current_stock_qty=current_stock,
    )
