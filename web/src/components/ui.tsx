export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-6 py-5 bg-white border-b">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {message}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      {message}
    </div>
  )
}

import React from 'react'
