import client from './client'
import type {
  SaleOrder, SaleOrderCreate, SaleOrderUpdate,
  SaleDispatch, SaleDispatchCreate,
  OrderStatus,
} from '../types'

interface ListParams {
  status?: OrderStatus
  customer_id?: number
  brand_id?: number
  skip?: number
  limit?: number
}

export const salesApi = {
  list: async (params: ListParams = {}): Promise<SaleOrder[]> => {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.append('status', params.status)
    if (params.customer_id) searchParams.append('customer_id', String(params.customer_id))
    if (params.brand_id) searchParams.append('brand_id', String(params.brand_id))
    searchParams.append('limit', String(params.limit ?? 200))
    if (params.skip) searchParams.append('skip', String(params.skip))
    const { data } = await client.get<SaleOrder[]>(`/sales?${searchParams}`)
    return data
  },

  get: async (id: number): Promise<SaleOrder> => {
    const { data } = await client.get<SaleOrder>(`/sales/${id}`)
    return data
  },

  create: async (payload: SaleOrderCreate): Promise<SaleOrder> => {
    const { data } = await client.post<SaleOrder>('/sales', payload)
    return data
  },

  update: async (id: number, payload: SaleOrderUpdate): Promise<SaleOrder> => {
    const { data } = await client.put<SaleOrder>(`/sales/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/sales/${id}`)
  },

  // Dispatches
  listDispatches: async (orderId: number): Promise<SaleDispatch[]> => {
    const { data } = await client.get<SaleDispatch[]>(`/sales/${orderId}/dispatches`)
    return data
  },

  addDispatch: async (orderId: number, payload: SaleDispatchCreate): Promise<SaleDispatch> => {
    const { data } = await client.post<SaleDispatch>(`/sales/${orderId}/dispatches`, payload)
    return data
  },

  deleteDispatch: async (orderId: number, dispatchId: number): Promise<void> => {
    await client.delete(`/sales/${orderId}/dispatches/${dispatchId}`)
  },
}
