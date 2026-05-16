import { useEffect, useState } from 'react'
import { authApi } from '../../api/auth'
import Modal from '../../components/Modal'
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui'
import type { User, UserCreate, UserRole } from '../../types'

const ROLES: UserRole[] = ['ADMIN', 'SALES', 'PURCHASES']

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:     'bg-red-100 text-red-700',
  SALES:     'bg-green-100 text-green-700',
  PURCHASES: 'bg-blue-100 text-blue-700',
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<UserCreate>({ name: '', email: '', password: '', role: 'SALES' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = () => {
    setLoading(true)
    authApi
      .listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users. Admin access required.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      await authApi.createUser(form)
      setModalOpen(false)
      setForm({ name: '', email: '', password: '', role: 'SALES' })
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSaveError(msg ?? 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Admin: create and manage portal users"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-navy-600 text-white text-sm font-semibold rounded-lg hover:bg-navy-700"
          >
            + Create User
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} />
          ) : users.length === 0 ? (
            <EmptyState message="No users found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs">{u.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-4">
          {saveError && <ErrorBox message={saveError} />}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ADMIN: full access · SALES: sale orders only · PURCHASES: purchase orders only
            </p>
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
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React from 'react'
