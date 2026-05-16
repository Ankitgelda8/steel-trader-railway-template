import { useEffect, useState } from 'react'
import { mastersApi } from '../../api/masters'
import Modal from '../../components/Modal'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import type { Brand, BrandCreate } from '../../types'

const EMPTY: BrandCreate = { name: '', grade: '', unit: 'tons', description: '' }

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState<BrandCreate>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    mastersApi
      .listBrands()
      .then(setBrands)
      .catch(() => setError('Failed to load brands'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const openEdit = (b: Brand) => {
    setEditing(b)
    setForm({ name: b.name, grade: b.grade ?? '', unit: b.unit, description: b.description ?? '' })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await mastersApi.updateBrand(editing.id, form)
      } else {
        await mastersApi.createBrand(form)
      }
      setModalOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const filtered = brands.filter(
    (b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.grade ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Brands / Grades"
        subtitle="Manage steel brands and grades"
        action={
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700"
          >
            + Add Brand
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No brands found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs">{b.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{b.name}</td>
                    <td className="px-5 py-3 text-gray-600">{b.grade ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-navy-100 text-navy-700 text-xs rounded-full">{b.unit}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{b.description ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-xs text-navy-600 hover:text-navy-800"
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit: ${editing.name}` : 'Add Brand'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade (e.g. Fe500)</label>
            <input
              type="text"
              value={form.grade ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={form.unit ?? 'tons'}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="tons">Tons</option>
              <option value="kg">Kg</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700 disabled:opacity-60"
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
