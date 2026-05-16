"""Sale order and dispatch endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user, require_admin, require_sales_access
from app.db.base import get_db
from app.models.models import OrderStatus, User
from app.schemas.schemas import (
    SaleDispatchCreate, SaleDispatchOut,
    SaleOrderCreate, SaleOrderUpdate, SaleOrderOut,
)
from app.services.sale_service import SaleService

router = APIRouter(prefix="/sales", tags=["Sales"])


def _enrich(so) -> SaleOrderOut:
    """Convert a SaleOrder ORM object to SaleOrderOut with name fields."""
    data = SaleOrderOut.model_validate(so)
    data.customer_name = so.customer.name if so.customer else None
    data.brand_name = so.brand.name if so.brand else None
    return data


@router.post("", response_model=SaleOrderOut, status_code=status.HTTP_201_CREATED)
def create_sale_order(
    data: SaleOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sales_access),
):
    return SaleService.create_order(db, data, current_user.id)


@router.get("", response_model=List[SaleOrderOut])
def list_sale_orders(
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_sales_access),
):
    orders = SaleService.list_orders(db, status, customer_id, brand_id, skip, limit)
    return [_enrich(so) for so in orders]


@router.get("/{order_id}", response_model=SaleOrderOut)
def get_sale_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_sales_access),
):
    return _enrich(SaleService.get_order(db, order_id))


@router.post("/{order_id}/dispatches", response_model=SaleDispatchOut, status_code=status.HTTP_201_CREATED)
def add_dispatch(
    order_id: int,
    data: SaleDispatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_sales_access),
):
    """Add a truck-load dispatch entry against an open sale order."""
    return SaleService.add_dispatch(db, order_id, data, current_user.id)


@router.get("/{order_id}/dispatches", response_model=List[SaleDispatchOut])
def list_dispatches(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_sales_access),
):
    return SaleService.list_dispatches(db, order_id)


@router.put("/{order_id}", response_model=SaleOrderOut)
def update_sale_order(
    order_id: int,
    data: SaleOrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return _enrich(SaleService.update_order(db, order_id, data))


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    SaleService.delete_order(db, order_id)


@router.delete("/{order_id}/dispatches/{dispatch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dispatch(
    order_id: int,
    dispatch_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    SaleService.delete_dispatch(db, order_id, dispatch_id)
