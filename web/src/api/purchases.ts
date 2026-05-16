import client from './client'
import type {
  PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate,
  PurchaseReceipt, PurchaseReceiptCreate,
  OrderStatus,
} from '../types'

interface ListParams {
  status?: OrderStatus
  company_id?: number
  brand_id?: number
  skip?: number
  limit?: number
}

export const purchasesApi = {
  list: async (params: ListParams = {}): Promise<PurchaseOrder[]> => {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.append('status', params.status)
    if (params.company_id) searchParams.append('company_id', String(params.company_id))
    if (params.brand_id) searchParams.append('brand_id', String(params.brand_id))
    searchParams.append('limit', String(params.limit ?? 200))
    if (params.skip) searchParams.append('skip', String(params.skip))
    const { data } = await client.get<PurchaseOrder[]>(`/purchases?${searchParams}`)
    return data
  },

  get: async (id: number): Promise<PurchaseOrder> => {
    const { data } = await client.get<PurchaseOrder>(`/purchases/${id}`)
    return data
  },

  create: async (payload: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const { data } = await client.post<PurchaseOrder>('/purchases', payload)
    return data
  },

  update: async (id: number, payload: PurchaseOrderUpdate): Promise<PurchaseOrder> => {
    const { data } = await client.put<PurchaseOrder>(`/purchases/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/purchases/${id}`)
  },

  // Receipts
  listReceipts: async (orderId: number): Promise<PurchaseReceipt[]> => {
    const { data } = await client.get<PurchaseReceipt[]>(`/purchases/${orderId}/receipts`)
    return data
  },

  addReceipt: async (orderId: number, payload: PurchaseReceiptCreate): Promise<PurchaseReceipt> => {
    const { data } = await client.post<PurchaseReceipt>(`/purchases/${orderId}/receipts`, payload)
    return data
  },

  deleteReceipt: async (orderId: number, receiptId: number): Promise<void> => {
    await client.delete(`/purchases/${orderId}/receipts/${receiptId}`)
  },
}
