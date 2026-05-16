import type { OrderStatus } from '../types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  OPEN:      'bg-blue-100 text-blue-800',
  PARTIAL:   'bg-yellow-100 text-yellow-800',
  COMPLETE:  'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}
