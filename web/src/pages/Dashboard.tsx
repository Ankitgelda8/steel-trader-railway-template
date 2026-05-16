import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { stockApi } from '../api/stock'
import { purchasesApi } from '../api/purchases'
import { salesApi } from '../api/sales'
import StatCard from '../components/StatCard'
import { PageHeader, Spinner, ErrorBox } from '../components/ui'
import StatusBadge from '../components/StatusBadge'
import type { DashboardSummary, PurchaseOrder, SaleOrder } from '../types'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentPurchases, setRecentPurchases] = useState<PurchaseOrder[]>([])
  const [recentSales, setRecentSales] = useState<SaleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      stockApi.dashboard(),
      purchasesApi.list({ limit: 5 }),
      salesApi.list({ limit: 5 }),
    ])
      .then(([s, p, sa]) => {
        setSummary(s)
        setRecentPurchases(p.slice(0, 5))
        setRecentSales(sa.slice(0, 5))
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!summary) return null

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of all operations" />

      <div className="p-6 space-y-6">
        {/* KPI row 1 — Purchases */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Purchases
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Purchase Orders"
              value={summary.total_purchase_orders}
              sub={`${summary.open_purchase_orders} open`}
              color="navy"
            />
            <StatCard
              label="Total Ordered"
              value={`${fmt(summary.total_ordered_qty)} T`}
              color="navy"
            />
            <StatCard
              label="Total Received"
              value={`${fmt(summary.total_received_qty)} T`}
              color="navy"
            />
            <StatCard
              label="Pending Receipt"
              value={`${fmt(summary.total_pending_receipt_qty)} T`}
              color="copper"
            />
          </div>
        </div>

        {/* KPI row 2 — Sales */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Sales
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Sale Orders"
              value={summary.total_sale_orders}
              sub={`${summary.open_sale_orders} open`}
              color="green"
            />
            <StatCard
              label="Total Sold"
              value={`${fmt(summary.total_sold_qty)} T`}
              color="green"
            />
            <StatCard
              label="Pending Dispatch"
              value={`${fmt(summary.total_pending_dispatch_qty)} T`}
              color="copper"
            />
            <StatCard
              label="Current Stock"
              value={`${fmt(summary.current_stock_qty)} T`}
              color="navy"
            />
          </div>
        </div>

        {/* Recent tables side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Purchases */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Recent Purchases</h2>
              <Link to="/purchases" className="text-xs text-navy-600 hover:underline">View all</Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Company / Brand</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPurchases.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data</td></tr>
                )}
                {recentPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/purchases/${po.id}`} className="font-medium text-gray-800 hover:text-navy-600">
                        {po.company_name ?? po.order_number}
                      </Link>
                      <p className="text-xs text-navy-600">{po.brand_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(po.ordered_qty)} T</td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Recent Sales</h2>
              <Link to="/sales" className="text-xs text-navy-600 hover:underline">View all</Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Customer / Brand</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data</td></tr>
                )}
                {recentSales.map((so) => (
                  <tr key={so.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/sales/${so.id}`} className="font-medium text-gray-800 hover:text-navy-600">
                        {so.customer_name ?? so.order_number}
                      </Link>
                      <p className="text-xs text-green-700">{so.brand_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(so.ordered_qty)} T</td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={so.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
