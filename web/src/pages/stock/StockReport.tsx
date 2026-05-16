import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { stockApi } from '../../api/stock'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import type { BrandStockRow } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function StockReport() {
  const [rows, setRows] = useState<BrandStockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    stockApi
      .brandReport()
      .then(setRows)
      .catch(() => setError('Failed to load stock report'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const totalReceived = rows.reduce((s, r) => s + r.total_received, 0)
  const totalSold = rows.reduce((s, r) => s + r.total_sold, 0)
  const totalStock = rows.reduce((s, r) => s + r.current_stock, 0)

  return (
    <div>
      <PageHeader
        title="Brand Stock Report"
        subtitle="Current stock position by brand"
        action={
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ↻ Refresh
            </button>
            <Link
              to="/stock/avg-price"
              className="px-4 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700"
            >
              Avg Price Report
            </Link>

          </div>
        }
      />

      <div className="p-6">
        {/* Summary strip */}
        {!loading && !error && rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-navy-600 text-white rounded-xl p-4 shadow-sm">
              <p className="text-xs opacity-75 uppercase">Total Received</p>
              <p className="text-2xl font-bold">{fmt(totalReceived)} T</p>
            </div>
            <div className="bg-green-700 text-white rounded-xl p-4 shadow-sm">
              <p className="text-xs opacity-75 uppercase">Total Sold</p>
              <p className="text-2xl font-bold">{fmt(totalSold)} T</p>
            </div>
            <div className="bg-copper-600 text-white rounded-xl p-4 shadow-sm">
              <p className="text-xs opacity-75 uppercase">Current Stock</p>
              <p className="text-2xl font-bold">{fmt(totalStock)} T</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : rows.length === 0 ? (
            <EmptyState message="No stock data available" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Received</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Sold</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => {
                  const pct = r.total_received > 0 ? (r.current_stock / r.total_received) * 100 : 0
                  return (
                    <tr key={r.brand_id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-semibold text-gray-800">{r.brand_name}</td>
                      <td className="px-5 py-3 text-gray-500">{r.unit}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmt(r.total_received)}</td>
                      <td className="px-5 py-3 text-right text-green-700">{fmt(r.total_sold)}</td>
                      <td className="px-5 py-3 text-right font-bold text-navy-700">{fmt(r.current_stock)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-navy-600 rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 font-semibold">
                <tr>
                  <td className="px-5 py-3 text-gray-700">Total</td>
                  <td />
                  <td className="px-5 py-3 text-right text-gray-700">{fmt(totalReceived)}</td>
                  <td className="px-5 py-3 text-right text-green-700">{fmt(totalSold)}</td>
                  <td className="px-5 py-3 text-right text-navy-700">{fmt(totalStock)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
