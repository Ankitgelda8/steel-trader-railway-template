import { useEffect, useState } from 'react'
import { purchasesApi } from '../../api/purchases'
import { salesApi } from '../../api/sales'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import type { BrandAvgRow, PurchaseOrder, SaleOrder } from '../../types'

function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits })
}

function buildAvgRows(purchases: PurchaseOrder[], sales: SaleOrder[]): BrandAvgRow[] {
  // Map: brandId → { brandName, pQtySum, pWeightedSum, sQtySum, sWeightedSum }
  const map = new Map<
    number,
    {
      brandName: string
      pQtySum: number
      pWeightedSum: number
      sQtySum: number
      sWeightedSum: number
    }
  >()

  for (const po of purchases) {
    const key = po.brand_id
    const prev = map.get(key) ?? {
      brandName: po.brand_name ?? `Brand ${key}`,
      pQtySum: 0,
      pWeightedSum: 0,
      sQtySum: 0,
      sWeightedSum: 0,
    }
    prev.pQtySum += po.ordered_qty
    prev.pWeightedSum += po.ordered_qty * po.rate_per_ton
    map.set(key, prev)
  }

  for (const so of sales) {
    const key = so.brand_id
    const prev = map.get(key) ?? {
      brandName: so.brand_name ?? `Brand ${key}`,
      pQtySum: 0,
      pWeightedSum: 0,
      sQtySum: 0,
      sWeightedSum: 0,
    }
    prev.sQtySum += so.ordered_qty
    prev.sWeightedSum += so.ordered_qty * so.rate_per_ton
    map.set(key, prev)
  }

  const rows: BrandAvgRow[] = []
  for (const [brandId, v] of map.entries()) {
    const purchaseAvgRate = v.pQtySum > 0 ? v.pWeightedSum / v.pQtySum : 0
    const saleAvgRate = v.sQtySum > 0 ? v.sWeightedSum / v.sQtySum : 0
    rows.push({
      brandId,
      brandName: v.brandName,
      purchaseTotalQty: v.pQtySum,
      purchaseAvgRate,
      purchaseTotalValue: v.pWeightedSum,
      saleTotalQty: v.sQtySum,
      saleAvgRate,
      saleTotalValue: v.sWeightedSum,
      margin: saleAvgRate - purchaseAvgRate,
    })
  }

  return rows.sort((a, b) => a.brandName.localeCompare(b.brandName))
}

export default function AvgPriceReport() {
  const [rows, setRows] = useState<BrandAvgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([purchasesApi.list({ limit: 1000 }), salesApi.list({ limit: 1000 })])
      .then(([purchases, sales]) => setRows(buildAvgRows(purchases, sales)))
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <PageHeader
        title="Brand-wise Avg Price Report"
        subtitle="Weighted average purchase & sale rate per brand — Σ(qty × rate) ÷ Σ(qty)"
        action={
          <button
            onClick={load}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        }
      />

      <div className="p-6">
        {/* Formula card */}
        <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 mb-4 text-sm text-navy-800">
          <strong>Weighted Avg Formula:</strong> For each brand, avg rate = Σ(quantity × rate) ÷ Σ(quantity).
          Margin = Avg Sale Rate − Avg Purchase Rate.
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : rows.length === 0 ? (
            <EmptyState message="No data to display" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase" rowSpan={2}>
                    Brand
                  </th>
                  <th
                    className="px-5 py-2 text-center text-xs font-semibold text-blue-700 uppercase border-b border-blue-100 bg-blue-50"
                    colSpan={3}
                  >
                    Purchase Side
                  </th>
                  <th
                    className="px-5 py-2 text-center text-xs font-semibold text-green-700 uppercase border-b border-green-100 bg-green-50"
                    colSpan={3}
                  >
                    Sale Side
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase" rowSpan={2}>
                    Margin ₹/T
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 bg-blue-50">Total Qty (T)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 bg-blue-50">Avg Rate ₹/T</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 bg-blue-50">Total Value (₹)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-green-600 bg-green-50">Total Qty (T)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-green-600 bg-green-50">Avg Rate ₹/T</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-green-600 bg-green-50">Total Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.brandId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-800">{r.brandName}</td>
                    {/* Purchase */}
                    <td className="px-4 py-3 text-right text-blue-800">{fmt(r.purchaseTotalQty)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">
                      {r.purchaseTotalQty > 0 ? `₹${fmt(r.purchaseAvgRate)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 text-xs">
                      {r.purchaseTotalQty > 0 ? `₹${fmt(r.purchaseTotalValue, 0)}` : '—'}
                    </td>
                    {/* Sale */}
                    <td className="px-4 py-3 text-right text-green-800">{fmt(r.saleTotalQty)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {r.saleTotalQty > 0 ? `₹${fmt(r.saleAvgRate)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 text-xs">
                      {r.saleTotalQty > 0 ? `₹${fmt(r.saleTotalValue, 0)}` : '—'}
                    </td>
                    {/* Margin */}
                    <td className="px-5 py-3 text-right">
                      {r.purchaseTotalQty > 0 && r.saleTotalQty > 0 ? (
                        <span
                          className={`font-bold ${r.margin >= 0 ? 'text-green-700' : 'text-red-600'}`}
                        >
                          {r.margin >= 0 ? '+' : ''}₹{fmt(r.margin)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
