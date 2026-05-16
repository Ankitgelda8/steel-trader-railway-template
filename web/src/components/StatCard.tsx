interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'navy' | 'copper' | 'green' | 'red'
}

const colorMap = {
  navy:   'bg-navy-600 text-white',
  copper: 'bg-copper-600 text-white',
  green:  'bg-green-600 text-white',
  red:    'bg-red-600 text-white',
}

export default function StatCard({ label, value, sub, color = 'navy' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 shadow-sm ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-75 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
    </div>
  )
}
