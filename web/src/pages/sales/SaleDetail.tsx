import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { salesApi } from '../../api/sales'
import { PageHeader, Spinner, ErrorBox } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { SaleOrder, SaleDispatchCreate } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<SaleOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addDispatchOpen, setAddDispatchOpen] = useState(false)
  const [dispatchForm, setDispatchForm] = useState({
    dispatch_date: new Date().toISOString().slice(0, 10),
    dispatched_qty: '',
    vehicle_number: '',
    lr_number: '',
    challan_number: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [dispatchError, setDispatchError] = useState('')

  const reload = () => {
    if (!id) return
    setLoading(true)
    salesApi
      .get(parseInt(id))
      .then(setOrder)
      .catch(() => setError('Failed to load sale order'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [id])

  const handleAddDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setDispatchError('')
    try {
      const payload: SaleDispatchCreate = {
        dispatch_date: new Date(dispatchForm.dispatch_date).toISOString(),
        dispatched_qty: parseFloat(dispatchForm.dispatched_qty),
        vehicle_number: dispatchForm.vehicle_number || undefined,
        lr_number: dispatchForm.lr_number || undefined,
        challan_number: dispatchForm.challan_number || undefined,
        notes: dispatchForm.notes || undefined,
      }
      await salesApi.addDispatch(parseInt(id), payload)
      setAddDispatchOpen(false)
      setDispatchForm({
        dispatch_date: new Date().toISOString().slice(0, 10),
        dispatched_qty: '',
        vehicle_number: '',
        lr_number: '',
        challan_number: '',
        notes: '',
      })
      reload()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setDispatchError(msg ?? 'Failed to add dispatch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDispatch = async (dispatchId: number) => {
    if (!id) return
    if (!confirm('Delete this dispatch entry?')) return
    await salesApi.deleteDispatch(parseInt(id), dispatchId)
    reload()
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Delete this entire sale order? This cannot be undone.')) return
    await salesApi.delete(parseInt(id))
    navigate('/sales')
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!order) return null

  const progress = order.ordered_qty > 0 ? (order.dispatched_qty / order.ordered_qty) * 100 : 0

  return (
    <div>
      <PageHeader
        title={order.customer_name ?? order.order_number}
        subtitle={`Order: ${order.order_number}${order.invoice_number ? ` · Invoice: ${order.invoice_number}` : ''}`}
        action={
          <div className="flex gap-2">
            <Link to="/sales" className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ← Back
            </Link>
            <button
              onClick={() => setAddDispatchOpen(true)}
              className="px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800"
            >
              + Add Dispatch
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-semibold text-gray-800">{order.customer_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Brand</p>
              <p className="font-semibold text-green-700">{order.brand_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(order.order_date).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-500">Ordered Qty</p>
              <p className="text-xl font-bold text-gray-800">{fmt(order.ordered_qty)} T</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dispatched Qty</p>
              <p className="text-xl font-bold text-green-700">{fmt(order.dispatched_qty)} T</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Dispatch</p>
              <p className="text-xl font-bold text-copper-600">{fmt(order.pending_qty)} T</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rate per Ton</p>
              <p className="text-xl font-bold text-green-700">₹{fmt(order.rate_per_ton)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Dispatch Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-700 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {order.total_value && (
            <p className="text-sm text-gray-600 mt-3">
              Total Value: <span className="font-bold text-gray-800">₹{fmt(order.total_value)}</span>
            </p>
          )}
          {order.notes && <p className="text-sm text-gray-500 mt-2 italic">Note: {order.notes}</p>}
        </div>

        {/* Dispatches table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">
              Dispatches / Deliveries ({order.dispatches.length})
            </h2>
          </div>
          {order.dispatches.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              No dispatches yet — add the first truck dispatch.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">Qty (T)</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Vehicle</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">LR #</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Challan</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Notes</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">
                      {new Date(d.dispatch_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{fmt(d.dispatched_qty)}</td>
                    <td className="px-5 py-3 text-gray-600">{d.vehicle_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{d.lr_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{d.challan_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{d.notes ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDeleteDispatch(d.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Dispatch Modal */}
      <Modal isOpen={addDispatchOpen} onClose={() => setAddDispatchOpen(false)} title="Add Dispatch">
        <form onSubmit={handleAddDispatch} className="space-y-4">
          {dispatchError && <ErrorBox message={dispatchError} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatch Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dispatchForm.dispatch_date}
                onChange={(e) => setDispatchForm((f) => ({ ...f, dispatch_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatched Qty (T) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={dispatchForm.dispatched_qty}
                onChange={(e) => setDispatchForm((f) => ({ ...f, dispatched_qty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={dispatchForm.vehicle_number}
                onChange={(e) => setDispatchForm((f) => ({ ...f, vehicle_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                placeholder="MH12 AB 1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LR Number</label>
              <input
                type="text"
                value={dispatchForm.lr_number}
                onChange={(e) => setDispatchForm((f) => ({ ...f, lr_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan Number</label>
              <input
                type="text"
                value={dispatchForm.challan_number}
                onChange={(e) => setDispatchForm((f) => ({ ...f, challan_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={dispatchForm.notes}
                onChange={(e) => setDispatchForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddDispatchOpen(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Dispatch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React from 'react'
