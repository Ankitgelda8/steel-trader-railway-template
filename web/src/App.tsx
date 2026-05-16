import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PurchaseList from './pages/purchases/PurchaseList'
import PurchaseForm from './pages/purchases/PurchaseForm'
import PurchaseDetail from './pages/purchases/PurchaseDetail'
import SaleList from './pages/sales/SaleList'
import SaleForm from './pages/sales/SaleForm'
import SaleDetail from './pages/sales/SaleDetail'
import StockReport from './pages/stock/StockReport'
import AvgPriceReport from './pages/stock/AvgPriceReport'
import Companies from './pages/masters/Companies'
import Brands from './pages/masters/Brands'
import Customers from './pages/masters/Customers'
import Users from './pages/admin/Users'
import { Spinner } from './components/ui'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Purchases */}
        <Route path="purchases" element={<PurchaseList />} />
        <Route path="purchases/new" element={<PurchaseForm />} />
        <Route path="purchases/:id" element={<PurchaseDetail />} />

        {/* Sales */}
        <Route path="sales" element={<SaleList />} />
        <Route path="sales/new" element={<SaleForm />} />
        <Route path="sales/:id" element={<SaleDetail />} />

        {/* Stock */}
        <Route path="stock" element={<StockReport />} />
        <Route path="stock/avg-price" element={<AvgPriceReport />} />

        {/* Masters */}
        <Route path="masters/companies" element={<Companies />} />
        <Route path="masters/brands" element={<Brands />} />
        <Route path="masters/customers" element={<Customers />} />

        {/* Admin */}
        <Route path="admin/users" element={<Users />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}
