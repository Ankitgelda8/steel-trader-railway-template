import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { purchasesApi } from '../../api/purchases'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import type { PurchaseOrder, OrderStatus } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

const STATUS_FILTERS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Complete', value: 'COMPLETE' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default function PurchaseList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    purchasesApi
      .list(statusFilter ? { status: statusFilter } : {})
      .then(setOrders)
      .catch(() => setError('Failed to load purchase orders'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.company_name ?? '').toLowerCase().includes(q) ||
      (o.brand_name ?? '').toLowerCase().includes(q) ||
      (o.invoice_number ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="All incoming purchase orders"
        action={
          <button
            onClick={() => navigate('/purchases/new')}
            className="px-4 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700 transition-colors"
          >
            + New Purchase Order
          </button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search order#, company, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as OrderStatus | '')}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-navy-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No purchase orders found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ordered (T)</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Received (T)</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate ₹/T</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Value (₹)</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/purchases/${po.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{po.order_number}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{po.company_name ?? '—'}</td>
                    <td className="px-5 py-3 text-navy-700">{po.brand_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(po.order_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">{fmt(po.ordered_qty)}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{fmt(po.received_qty)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-copper-600">
                      ₹{fmt(po.rate_per_ton)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {po.total_value ? `₹${fmt(po.total_value)}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2">{filtered.length} orders shown</p>
      </div>
    </div>
  )
}
