// ─── Enums ────────────────────────────────────────────────────

export type OrderStatus = 'OPEN' | 'PARTIAL' | 'COMPLETE' | 'CANCELLED'
export type UserRole = 'ADMIN' | 'SALES' | 'PURCHASES'

// ─── Auth ─────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: number
}

export interface Token {
  access_token: string
  token_type: string
}

export interface UserCreate {
  name: string
  email: string
  password: string
  role: UserRole
}

// ─── Masters ──────────────────────────────────────────────────

export interface Company {
  id: number
  name: string
  gst_number?: string
  contact_person?: string
  phone?: string
  address?: string
  created_at: string
}

export interface CompanyCreate {
  name: string
  gst_number?: string
  contact_person?: string
  phone?: string
  address?: string
}

export interface Branch {
  id: number
  company_id: number
  name: string
  city?: string
  contact_person?: string
  phone?: string
  created_at: string
}

export interface BranchCreate {
  company_id: number
  name: string
  city?: string
  contact_person?: string
  phone?: string
}

export interface Brand {
  id: number
  name: string
  grade?: string
  unit: string
  description?: string
  created_at: string
}

export interface BrandCreate {
  name: string
  grade?: string
  unit?: string
  description?: string
}

export interface Customer {
  id: number
  name: string
  gst_number?: string
  contact_person?: string
  phone?: string
  address?: string
  created_at: string
}

export interface CustomerCreate {
  name: string
  gst_number?: string
  contact_person?: string
  phone?: string
  address?: string
}

// ─── Purchase ─────────────────────────────────────────────────

export interface PurchaseReceipt {
  id: number
  purchase_order_id: number
  receipt_date: string
  received_qty: number
  vehicle_number?: string
  lr_number?: string
  challan_number?: string
  notes?: string
  stock_lot_id?: number
  created_at: string
}

export interface PurchaseReceiptCreate {
  receipt_date: string
  received_qty: number
  vehicle_number?: string
  challan_number?: string
  notes?: string
}

export interface PurchaseOrder {
  id: number
  order_number: string
  company_id: number
  company_name?: string
  branch_id?: number
  brand_id: number
  brand_name?: string
  order_date: string
  invoice_number?: string
  ordered_qty: number
  received_qty: number
  pending_qty: number
  rate_per_ton: number
  total_value?: number
  status: OrderStatus
  notes?: string
  created_at: string
  updated_at: string
  receipts: PurchaseReceipt[]
}

export interface PurchaseOrderCreate {
  company_id: number
  branch_id?: number
  brand_id: number
  order_date: string
  invoice_number?: string
  ordered_qty: number
  rate_per_ton: number
  notes?: string
}

export interface PurchaseOrderUpdate {
  invoice_number?: string
  order_date?: string
  ordered_qty?: number
  rate_per_ton?: number
  notes?: string
}

// ─── Sale ─────────────────────────────────────────────────────

export interface SaleDispatch {
  id: number
  sale_order_id: number
  dispatch_date: string
  dispatched_qty: number
  vehicle_number?: string
  lr_number?: string
  challan_number?: string
  notes?: string
  created_at: string
}

export interface SaleDispatchCreate {
  dispatch_date: string
  dispatched_qty: number
  vehicle_number?: string
  lr_number?: string
  challan_number?: string
  notes?: string
}

export interface SaleOrder {
  id: number
  order_number: string
  customer_id: number
  customer_name?: string
  brand_id: number
  brand_name?: string
  order_date: string
  invoice_number?: string
  ordered_qty: number
  dispatched_qty: number
  pending_qty: number
  rate_per_ton: number
  total_value?: number
  status: OrderStatus
  notes?: string
  created_at: string
  updated_at: string
  dispatches: SaleDispatch[]
}

export interface SaleOrderCreate {
  customer_id: number
  brand_id: number
  order_date: string
  invoice_number?: string
  ordered_qty: number
  rate_per_ton: number
  notes?: string
}

export interface SaleOrderUpdate {
  invoice_number?: string
  order_date?: string
  ordered_qty?: number
  rate_per_ton?: number
  notes?: string
}

// ─── Stock ────────────────────────────────────────────────────

export interface BrandStockRow {
  brand_id: number
  brand_name: string
  unit: string
  total_received: number
  total_sold: number
  current_stock: number
}

export interface DashboardSummary {
  total_purchase_orders: number
  open_purchase_orders: number
  total_ordered_qty: number
  total_received_qty: number
  total_pending_receipt_qty: number
  total_sale_orders: number
  open_sale_orders: number
  total_sold_qty: number
  total_pending_dispatch_qty: number
  current_stock_qty: number
}

// ─── Avg Price (client-computed) ──────────────────────────────

export interface BrandAvgRow {
  brandId: number
  brandName: string
  purchaseTotalQty: number
  purchaseAvgRate: number
  purchaseTotalValue: number
  saleTotalQty: number
  saleAvgRate: number
  saleTotalValue: number
  margin: number
}
