"""
Business logic for Purchase Orders and Purchase Receipts.

Rules:
  - Every receipt reduces pending_qty on the parent PO.
  - Status auto-transitions: OPEN → PARTIAL → COMPLETE.
  - A receipt cannot exceed the remaining pending_qty.
  - Each confirmed receipt automatically creates a StockLot.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from sqlalchemy.orm import joinedload

from app.models.models import (
    DispatchAllocation, OrderStatus, PurchaseOrder, PurchaseReceipt, StockLot,
)
from app.schemas.schemas import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseReceiptCreate


def _generate_order_number(prefix: str = "PO") -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short = str(uuid.uuid4())[:6].upper()
    return f"{prefix}-{ts}-{short}"


def _update_po_status(po: PurchaseOrder) -> None:
    if po.received_qty >= po.ordered_qty:
        po.status = OrderStatus.COMPLETE
        po.pending_qty = 0.0
    elif po.received_qty > 0:
        po.status = OrderStatus.PARTIAL
        po.pending_qty = round(po.ordered_qty - po.received_qty, 4)
    else:
        po.status = OrderStatus.OPEN
        po.pending_qty = po.ordered_qty


class PurchaseService:

    @staticmethod
    def create_order(db: Session, data: PurchaseOrderCreate, user_id: int) -> PurchaseOrder:
        po = PurchaseOrder(
            order_number=_generate_order_number("PO"),
            company_id=data.company_id,
            branch_id=data.branch_id,
            brand_id=data.brand_id,
            created_by=user_id,
            order_date=data.order_date,
            invoice_number=data.invoice_number,
            ordered_qty=data.ordered_qty,
            received_qty=0.0,
            pending_qty=data.ordered_qty,
            rate_per_ton=data.rate_per_ton,
            total_value=round(data.ordered_qty * data.rate_per_ton, 2),
            notes=data.notes,
            status=OrderStatus.OPEN,
        )
        db.add(po)
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def list_orders(
        db: Session,
        status: Optional[OrderStatus] = None,
        company_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PurchaseOrder]:
        q = db.query(PurchaseOrder).options(
            joinedload(PurchaseOrder.company),
            joinedload(PurchaseOrder.brand),
        )
        if status:
            q = q.filter(PurchaseOrder.status == status)
        if company_id:
            q = q.filter(PurchaseOrder.company_id == company_id)
        if brand_id:
            q = q.filter(PurchaseOrder.brand_id == brand_id)
        return q.order_by(PurchaseOrder.order_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_order(db: Session, order_id: int) -> PurchaseOrder:
        po = db.query(PurchaseOrder).options(
            joinedload(PurchaseOrder.company),
            joinedload(PurchaseOrder.brand),
        ).filter(PurchaseOrder.id == order_id).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
        return po

    @staticmethod
    def add_receipt(
        db: Session, order_id: int, data: PurchaseReceiptCreate, user_id: int
    ) -> PurchaseReceipt:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

        if po.status == OrderStatus.COMPLETE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order is already complete — no further receipts allowed",
            )
        if po.status == OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order is cancelled",
            )

        remaining = round(po.ordered_qty - po.received_qty, 4)
        if data.received_qty > remaining:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Receipt qty {data.received_qty} exceeds remaining pending qty "
                    f"{remaining} on this order"
                ),
            )

        receipt = PurchaseReceipt(
            purchase_order_id=order_id,
            created_by=user_id,
            receipt_date=data.receipt_date,
            received_qty=data.received_qty,
            vehicle_number=data.vehicle_number,
            lr_number=getattr(data, "lr_number", None),
            challan_number=data.challan_number,
            notes=data.notes,
        )
        db.add(receipt)
        db.flush()  # get receipt.id before creating the lot

        # Create stock lot from this receipt
        lot_number = f"LOT-{order_id}-{receipt.id}-{str(uuid.uuid4())[:6].upper()}"
        lot = StockLot(
            receipt_id=receipt.id,
            lot_number=lot_number,
            brand_id=po.brand_id,
            company_id=po.company_id,
            original_qty=data.received_qty,
            available_qty=data.received_qty,
            cost_per_ton=po.rate_per_ton,
            received_date=data.receipt_date,
        )
        db.add(lot)

        # Update PO balances
        po.received_qty = round(po.received_qty + data.received_qty, 4)
        _update_po_status(po)

        db.commit()
        db.refresh(receipt)
        db.refresh(lot)
        receipt.stock_lot_id = lot.id   # attach for schema serialisation
        return receipt

    @staticmethod
    def list_receipts(db: Session, order_id: int) -> List[PurchaseReceipt]:
        return (
            db.query(PurchaseReceipt)
            .filter(PurchaseReceipt.purchase_order_id == order_id)
            .order_by(PurchaseReceipt.receipt_date)
            .all()
        )

    @staticmethod
    def update_order(db: Session, order_id: int, data: PurchaseOrderUpdate) -> PurchaseOrder:
        po = db.query(PurchaseOrder).options(
            joinedload(PurchaseOrder.company),
            joinedload(PurchaseOrder.brand),
        ).filter(PurchaseOrder.id == order_id).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

        if data.invoice_number is not None:
            po.invoice_number = data.invoice_number
        if data.order_date is not None:
            po.order_date = data.order_date
        if data.notes is not None:
            po.notes = data.notes
        if data.rate_per_ton is not None:
            if data.rate_per_ton <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rate must be positive")
            po.rate_per_ton = data.rate_per_ton
        if data.ordered_qty is not None:
            if data.ordered_qty <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ordered qty must be positive")
            if data.ordered_qty < po.received_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot reduce ordered qty below already received qty ({po.received_qty})",
                )
            po.ordered_qty = data.ordered_qty
            _update_po_status(po)
        po.total_value = round(po.ordered_qty * po.rate_per_ton, 2)
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def delete_order(db: Session, order_id: int) -> None:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
        if not po:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
        if po.status != OrderStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only OPEN orders with no receipts can be deleted",
            )
        db.delete(po)
        db.commit()

    @staticmethod
    def delete_receipt(db: Session, order_id: int, receipt_id: int) -> None:
        receipt = db.query(PurchaseReceipt).filter(
            PurchaseReceipt.id == receipt_id,
            PurchaseReceipt.purchase_order_id == order_id,
        ).first()
        if not receipt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")

        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()

        # Guard: if the stock lot has already been allocated to dispatches, block deletion
        lot = db.query(StockLot).filter(StockLot.receipt_id == receipt_id).first()
        if lot:
            has_allocations = db.query(DispatchAllocation).filter(
                DispatchAllocation.stock_lot_id == lot.id
            ).first()
            if has_allocations:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete receipt: stock from this receipt has already been dispatched",
                )
            db.delete(lot)

        # Reverse PO quantities and recalculate status
        po.received_qty = round(po.received_qty - receipt.received_qty, 4)
        _update_po_status(po)

        db.delete(receipt)
        db.commit()
