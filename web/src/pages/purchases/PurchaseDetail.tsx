import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { purchasesApi } from '../../api/purchases'
import { PageHeader, Spinner, ErrorBox } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { PurchaseOrder, PurchaseReceiptCreate } from '../../types'

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addReceiptOpen, setAddReceiptOpen] = useState(false)
  const [receiptForm, setReceiptForm] = useState<{
    receipt_date: string
    received_qty: string
    vehicle_number: string
    challan_number: string
    notes: string
  }>({
    receipt_date: new Date().toISOString().slice(0, 10),
    received_qty: '',
    vehicle_number: '',
    challan_number: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [receiptError, setReceiptError] = useState('')

  const reload = () => {
    if (!id) return
    setLoading(true)
    purchasesApi
      .get(parseInt(id))
      .then(setOrder)
      .catch(() => setError('Failed to load purchase order'))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [id])

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setReceiptError('')
    try {
      const payload: PurchaseReceiptCreate = {
        receipt_date: new Date(receiptForm.receipt_date).toISOString(),
        received_qty: parseFloat(receiptForm.received_qty),
        vehicle_number: receiptForm.vehicle_number || undefined,
        challan_number: receiptForm.challan_number || undefined,
        notes: receiptForm.notes || undefined,
      }
      await purchasesApi.addReceipt(parseInt(id), payload)
      setAddReceiptOpen(false)
      setReceiptForm({
        receipt_date: new Date().toISOString().slice(0, 10),
        received_qty: '',
        vehicle_number: '',
        challan_number: '',
        notes: '',
      })
      reload()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setReceiptError(msg ?? 'Failed to add receipt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReceipt = async (receiptId: number) => {
    if (!id) return
    if (!confirm('Delete this receipt?')) return
    await purchasesApi.deleteReceipt(parseInt(id), receiptId)
    reload()
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Delete this entire purchase order? This cannot be undone.')) return
    await purchasesApi.delete(parseInt(id))
    navigate('/purchases')
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!order) return null

  const progress = order.ordered_qty > 0 ? (order.received_qty / order.ordered_qty) * 100 : 0

  return (
    <div>
      <PageHeader
        title={order.company_name ?? order.order_number}
        subtitle={`Order: ${order.order_number}${order.invoice_number ? ` · Invoice: ${order.invoice_number}` : ''}`}
        action={
          <div className="flex gap-2">
            <Link to="/purchases" className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              ← Back
            </Link>
            <button
              onClick={() => setAddReceiptOpen(true)}
              className="px-4 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700"
            >
              + Add Receipt
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
              <p className="text-xs text-gray-500">Company</p>
              <p className="font-semibold text-gray-800">{order.company_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Brand</p>
              <p className="font-semibold text-navy-700">{order.brand_name ?? '—'}</p>
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
              <p className="text-xs text-gray-500">Received Qty</p>
              <p className="text-xl font-bold text-green-700">{fmt(order.received_qty)} T</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Qty</p>
              <p className="text-xl font-bold text-copper-600">{fmt(order.pending_qty)} T</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rate per Ton</p>
              <p className="text-xl font-bold text-copper-600">₹{fmt(order.rate_per_ton)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Delivery Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy-600 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {order.total_value && (
            <p className="text-sm text-gray-600 mt-3">
              Total Value: <span className="font-bold text-gray-800">₹{fmt(order.total_value)}</span>
            </p>
          )}
          {order.notes && (
            <p className="text-sm text-gray-500 mt-2 italic">Note: {order.notes}</p>
          )}
        </div>

        {/* Receipts table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Receipts / Deliveries ({order.receipts.length})
            </h2>
          </div>
          {order.receipts.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              No receipts yet — add the first delivery.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">Qty (T)</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Vehicle</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Challan</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Notes</th>
                  <th className="px-5 py-2.5 text-center text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">
                      {new Date(r.receipt_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{fmt(r.received_qty)}</td>
                    <td className="px-5 py-3 text-gray-600">{r.vehicle_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.challan_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{r.notes ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDeleteReceipt(r.id)}
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

      {/* Add Receipt Modal */}
      <Modal isOpen={addReceiptOpen} onClose={() => setAddReceiptOpen(false)} title="Add Receipt">
        <form onSubmit={handleAddReceipt} className="space-y-4">
          {receiptError && <ErrorBox message={receiptError} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={receiptForm.receipt_date}
                onChange={(e) =>
                  setReceiptForm((f) => ({ ...f, receipt_date: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Qty (T) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={receiptForm.received_qty}
                onChange={(e) =>
                  setReceiptForm((f) => ({ ...f, received_qty: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={receiptForm.vehicle_number}
                onChange={(e) =>
                  setReceiptForm((f) => ({ ...f, vehicle_number: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
                placeholder="MH12 AB 1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan Number</label>
              <input
                type="text"
                value={receiptForm.challan_number}
                onChange={(e) =>
                  setReceiptForm((f) => ({ ...f, challan_number: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={receiptForm.notes}
                onChange={(e) =>
                  setReceiptForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddReceiptOpen(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700 disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React from 'react'
