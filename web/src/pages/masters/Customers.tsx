import { useEffect, useState } from 'react'
import { mastersApi } from '../../api/masters'
import Modal from '../../components/Modal'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import type { Customer, CustomerCreate } from '../../types'

const EMPTY: CustomerCreate = { name: '', gst_number: '', contact_person: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerCreate>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    mastersApi
      .listCustomers()
      .then(setCustomers)
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({
      name: c.name,
      gst_number: c.gst_number ?? '',
      contact_person: c.contact_person ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await mastersApi.updateCustomer(editing.id, form)
      } else {
        await mastersApi.createCustomer(form)
      }
      setModalOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_person ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
  )

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customers"
        action={
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800"
          >
            + Add Customer
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, contact, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No customers found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">GST</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Address</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs">{c.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs font-mono">{c.gst_number ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{c.contact_person ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[180px] truncate">{c.address ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-green-700 hover:text-green-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit: ${editing.name}` : 'Add Customer'}>
        <form onSubmit={handleSave} className="space-y-4">
          {(
            [
              { key: 'name', label: 'Customer Name', required: true },
              { key: 'gst_number', label: 'GST Number' },
              { key: 'contact_person', label: 'Contact Person' },
              { key: 'phone', label: 'Phone' },
              { key: 'address', label: 'Address' },
            ] as { key: keyof CustomerCreate; label: string; required?: boolean }[]
          ).map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={required}
                value={String(form[key] ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React from 'react'
