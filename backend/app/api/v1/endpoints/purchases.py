"""Purchase order and receipt endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user, require_admin, require_purchases_access
from app.db.base import get_db
from app.models.models import OrderStatus, User
from app.schemas.schemas import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderOut,
    PurchaseReceiptCreate, PurchaseReceiptOut,
)
from app.services.purchase_service import PurchaseService

router = APIRouter(prefix="/purchases", tags=["Purchases"])


def _enrich(po) -> PurchaseOrderOut:
    """Convert a PurchaseOrder ORM object to PurchaseOrderOut with name fields."""
    data = PurchaseOrderOut.model_validate(po)
    data.company_name = po.company.name if po.company else None
    data.brand_name = po.brand.name if po.brand else None
    return data


@router.post("", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_purchases_access),
):
    return PurchaseService.create_order(db, data, current_user.id)


@router.get("", response_model=List[PurchaseOrderOut])
def list_purchase_orders(
    status: Optional[OrderStatus] = None,
    company_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_purchases_access),
):
    orders = PurchaseService.list_orders(db, status, company_id, brand_id, skip, limit)
    return [_enrich(po) for po in orders]


@router.get("/{order_id}", response_model=PurchaseOrderOut)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_purchases_access),
):
    return _enrich(PurchaseService.get_order(db, order_id))


@router.post("/{order_id}/receipts", response_model=PurchaseReceiptOut, status_code=status.HTTP_201_CREATED)
def add_receipt(
    order_id: int,
    data: PurchaseReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_purchases_access),
):
    """Add a partial delivery receipt against an open purchase order."""
    return PurchaseService.add_receipt(db, order_id, data, current_user.id)


@router.get("/{order_id}/receipts", response_model=List[PurchaseReceiptOut])
def list_receipts(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_purchases_access),
):
    return PurchaseService.list_receipts(db, order_id)


@router.put("/{order_id}", response_model=PurchaseOrderOut)
def update_purchase_order(
    order_id: int,
    data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return _enrich(PurchaseService.update_order(db, order_id, data))


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    PurchaseService.delete_order(db, order_id)


@router.delete("/{order_id}/receipts/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(
    order_id: int,
    receipt_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    PurchaseService.delete_receipt(db, order_id, receipt_id)
