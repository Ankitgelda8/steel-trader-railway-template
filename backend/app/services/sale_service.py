"""
Business logic for Sale Orders and Sale Dispatches.

Rules:
  - Every dispatch reduces pending_qty on the parent sale order.
  - Status auto-transitions: OPEN → PARTIAL → COMPLETE.
  - A dispatch cannot exceed the remaining pending_qty.
  - Each dispatch carries manual allocations to specific stock lots.
  - Total allocated qty must equal dispatched_qty.
  - Each allocation cannot exceed the available_qty of the chosen stock lot.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.models import (
    DispatchAllocation, OrderStatus, SaleDispatch, SaleOrder, StockLot,
)
from app.schemas.schemas import SaleDispatchCreate, SaleOrderCreate, SaleOrderUpdate


def _generate_order_number(prefix: str = "SO") -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short = str(uuid.uuid4())[:6].upper()
    return f"{prefix}-{ts}-{short}"


def _update_so_status(so: SaleOrder) -> None:
    if so.dispatched_qty >= so.ordered_qty:
        so.status = OrderStatus.COMPLETE
        so.pending_qty = 0.0
    elif so.dispatched_qty > 0:
        so.status = OrderStatus.PARTIAL
        so.pending_qty = round(so.ordered_qty - so.dispatched_qty, 4)
    else:
        so.status = OrderStatus.OPEN
        so.pending_qty = so.ordered_qty


class SaleService:

    @staticmethod
    def create_order(db: Session, data: SaleOrderCreate, user_id: int) -> SaleOrder:
        # Stock availability check: total received - total committed in pending orders
        total_received = db.query(func.sum(StockLot.original_qty)).filter(
            StockLot.brand_id == data.brand_id
        ).scalar() or 0.0

        total_committed = db.query(func.sum(SaleOrder.pending_qty)).filter(
            SaleOrder.brand_id == data.brand_id,
            SaleOrder.status.in_([OrderStatus.OPEN, OrderStatus.PARTIAL]),
        ).scalar() or 0.0

        total_dispatched = db.query(func.sum(SaleDispatch.dispatched_qty)).join(
            SaleOrder, SaleDispatch.sale_order_id == SaleOrder.id
        ).filter(SaleOrder.brand_id == data.brand_id).scalar() or 0.0

        free_stock = round(total_received - total_dispatched - total_committed, 4)
        if data.ordered_qty > free_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock to book this order: only {free_stock} tons free "
                    f"(received {total_received}, dispatched {total_dispatched}, "
                    f"already committed in other open orders {total_committed})"
                ),
            )

        so = SaleOrder(
            order_number=_generate_order_number("SO"),
            customer_id=data.customer_id,
            brand_id=data.brand_id,
            created_by=user_id,
            order_date=data.order_date,
            invoice_number=data.invoice_number,
            ordered_qty=data.ordered_qty,
            dispatched_qty=0.0,
            pending_qty=data.ordered_qty,
            rate_per_ton=data.rate_per_ton,
            total_value=round(data.ordered_qty * data.rate_per_ton, 2),
            notes=data.notes,
            status=OrderStatus.OPEN,
        )
        db.add(so)
        db.commit()
        db.refresh(so)
        return so

    @staticmethod
    def list_orders(
        db: Session,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SaleOrder]:
        q = db.query(SaleOrder).options(
            joinedload(SaleOrder.customer),
            joinedload(SaleOrder.brand),
        )
        if status:
            q = q.filter(SaleOrder.status == status)
        if customer_id:
            q = q.filter(SaleOrder.customer_id == customer_id)
        if brand_id:
            q = q.filter(SaleOrder.brand_id == brand_id)
        return q.order_by(SaleOrder.order_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_order(db: Session, order_id: int) -> SaleOrder:
        so = db.query(SaleOrder).options(
            joinedload(SaleOrder.customer),
            joinedload(SaleOrder.brand),
        ).filter(SaleOrder.id == order_id).first()
        if not so:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale order not found")
        return so

    @staticmethod
    def add_dispatch(
        db: Session, order_id: int, data: SaleDispatchCreate, user_id: int
    ) -> SaleDispatch:
        so = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
        if not so:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale order not found")

        if so.status == OrderStatus.COMPLETE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale order is already complete — no further dispatches allowed",
            )
        if so.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale order is cancelled",
            )

        remaining = round(so.ordered_qty - so.dispatched_qty, 4)
        if data.dispatched_qty > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Dispatch qty {data.dispatched_qty} exceeds remaining pending qty "
                    f"{remaining} on this sale order"
                ),
            )

        # Global stock check: total received for this brand vs total dispatched
        total_received = db.query(func.sum(StockLot.original_qty)).filter(
            StockLot.brand_id == so.brand_id
        ).scalar() or 0.0

        total_dispatched = db.query(func.sum(SaleDispatch.dispatched_qty)).join(
            SaleOrder, SaleDispatch.sale_order_id == SaleOrder.id
        ).filter(SaleOrder.brand_id == so.brand_id).scalar() or 0.0

        available_stock = round(total_received - total_dispatched, 4)
        if data.dispatched_qty > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock: only {available_stock} tons available in stock "
                    f"for this brand (purchased {total_received}, already dispatched {total_dispatched})"
                ),
            )

        # Persist dispatch
        dispatch = SaleDispatch(
            sale_order_id=order_id,
            created_by=user_id,
            dispatch_date=data.dispatch_date,
            dispatched_qty=data.dispatched_qty,
            vehicle_number=data.vehicle_number,
            lr_number=data.lr_number,
            challan_number=data.challan_number,
            notes=data.notes,
        )
        db.add(dispatch)
        db.flush()

        # Update sale order balances
        so.dispatched_qty = round(so.dispatched_qty + data.dispatched_qty, 4)
        _update_so_status(so)

        db.commit()
        db.refresh(dispatch)
        return dispatch

    @staticmethod
    def list_dispatches(db: Session, order_id: int) -> List[SaleDispatch]:
        return (
            db.query(SaleDispatch)
            .filter(SaleDispatch.sale_order_id == order_id)
            .order_by(SaleDispatch.dispatch_date)
            .all()
        )

    @staticmethod
    def update_order(db: Session, order_id: int, data: SaleOrderUpdate) -> SaleOrder:
        so = db.query(SaleOrder).options(
            joinedload(SaleOrder.customer),
            joinedload(SaleOrder.brand),
        ).filter(SaleOrder.id == order_id).first()
        if not so:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale order not found")

        if data.invoice_number is not None:
            so.invoice_number = data.invoice_number
        if data.order_date is not None:
            so.order_date = data.order_date
        if data.notes is not None:
            so.notes = data.notes
        if data.rate_per_ton is not None:
            if data.rate_per_ton <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rate must be positive")
            so.rate_per_ton = data.rate_per_ton
        if data.ordered_qty is not None:
            if data.ordered_qty <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ordered qty must be positive")
            if data.ordered_qty < so.dispatched_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot reduce ordered qty below already dispatched qty ({so.dispatched_qty})",
                )
            so.ordered_qty = data.ordered_qty
            _update_so_status(so)
        so.total_value = round(so.ordered_qty * so.rate_per_ton, 2)
        db.commit()
        db.refresh(so)
        return so

    @staticmethod
    def delete_order(db: Session, order_id: int) -> None:
        so = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
        if not so:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale order not found")
        if so.status != OrderStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only OPEN orders with no dispatches can be deleted",
            )
        db.delete(so)
        db.commit()

    @staticmethod
    def delete_dispatch(db: Session, order_id: int, dispatch_id: int) -> None:
        dispatch = db.query(SaleDispatch).filter(
            SaleDispatch.id == dispatch_id,
            SaleDispatch.sale_order_id == order_id,
        ).first()
        if not dispatch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispatch not found")

        so = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()

        # Reverse all stock-lot allocations for this dispatch
        allocations = db.query(DispatchAllocation).filter(
            DispatchAllocation.dispatch_id == dispatch_id
        ).all()
        for alloc in allocations:
            lot = db.query(StockLot).filter(StockLot.id == alloc.stock_lot_id).first()
            if lot:
                lot.available_qty = round(lot.available_qty + alloc.allocated_qty, 4)
            db.delete(alloc)

        # Reverse SO quantities and recalculate status
        so.dispatched_qty = round(so.dispatched_qty - dispatch.dispatched_qty, 4)
        _update_so_status(so)

        db.delete(dispatch)
        db.commit()
