import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salesApi } from '../../api/sales'
import { mastersApi } from '../../api/masters'
import SearchableSelect from '../../components/SearchableSelect'
import { PageHeader, ErrorBox } from '../../components/ui'
import type { Customer, Brand, SaleOrderCreate } from '../../types'

export default function SaleForm() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_id: null as number | null,
    brand_id: null as number | null,
    order_date: new Date().toISOString().slice(0, 10),
    invoice_number: '',
    ordered_qty: '',
    rate_per_ton: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([mastersApi.listCustomers(), mastersApi.listBrands()]).then(
      ([c, b]) => {
        setCustomers(c)
        setBrands(b)
      }
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id || !form.brand_id) {
      setError('Please select a customer and brand')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: SaleOrderCreate = {
        customer_id: form.customer_id,
        brand_id: form.brand_id,
        order_date: new Date(form.order_date).toISOString(),
        invoice_number: form.invoice_number || undefined,
        ordered_qty: parseFloat(form.ordered_qty),
        rate_per_ton: parseFloat(form.rate_per_ton),
        notes: form.notes || undefined,
      }
      const created = await salesApi.create(payload)
      navigate(`/sales/${created.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Failed to create sale order')
    } finally {
      setLoading(false)
    }
  }

  const totalValue =
    form.ordered_qty && form.rate_per_ton
      ? (parseFloat(form.ordered_qty) * parseFloat(form.rate_per_ton)).toLocaleString('en-IN', {
          maximumFractionDigits: 0,
        })
      : null

  return (
    <div>
      <PageHeader title="New Sale Order" subtitle="Create a new sale order" />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
          {error && <ErrorBox message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-green-700 tracking-wide mb-3 pb-1 border-b border-green-100">
                Customer Details
              </h3>
              <SearchableSelect
                label="Customer"
                options={customers.map((c) => ({ id: c.id, label: c.name }))}
                value={form.customer_id}
                onChange={(id) => setForm((f) => ({ ...f, customer_id: id }))}
                placeholder="Select customer..."
                required
              />
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-green-700 tracking-wide mb-3 pb-1 border-b border-green-100">
                Product & Quantity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Brand / Grade"
                  options={brands.map((b) => ({ id: b.id, label: b.name }))}
                  value={form.brand_id}
                  onChange={(id) => setForm((f) => ({ ...f, brand_id: id }))}
                  placeholder="Select brand..."
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordered Qty (Tons) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.ordered_qty}
                    onChange={(e) => setForm((f) => ({ ...f, ordered_qty: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Ton (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.rate_per_ton}
                    onChange={(e) => setForm((f) => ({ ...f, rate_per_ton: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>
                {totalValue && (
                  <div className="flex items-end">
                    <div className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-700 font-medium">Total Value</p>
                      <p className="text-lg font-bold text-green-700">₹{totalValue}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order details */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-green-700 tracking-wide mb-3 pb-1 border-b border-green-100">
                Order Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.order_date}
                    onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="INV-0001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/sales')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-60"
              >
                {loading ? 'Creating...' : 'Create Sale Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

import React from 'react'
