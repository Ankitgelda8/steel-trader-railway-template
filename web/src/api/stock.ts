import client from './client'
import type { BrandStockRow, DashboardSummary } from '../types'

export const stockApi = {
  dashboard: async (): Promise<DashboardSummary> => {
    const { data } = await client.get<DashboardSummary>('/stock/dashboard')
    return data
  },

  brandReport: async (): Promise<BrandStockRow[]> => {
    const { data } = await client.get<BrandStockRow[]>('/stock/brand-report')
    return data
  },
}
