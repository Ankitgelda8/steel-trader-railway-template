import { useState, useRef, useEffect } from 'react'

interface Option {
  id: number
  label: string
}

interface Props {
  label: string
  options: Option[]
  value: number | null
  onChange: (id: number | null) => void
  placeholder?: string
  required?: boolean
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  required,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value)

  useEffect(() => {
    if (selected) setQuery(selected.label)
    else setQuery('')
  }, [value, selected])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        // Restore display text to selected value
        if (selected) setQuery(selected.label)
        else setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options.slice(0, 50)

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (!e.target.value) onChange(null)
        }}
        onFocus={() => setOpen(true)}
      />
      {value && (
        <button
          type="button"
          className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
          onClick={() => { onChange(null); setQuery('') }}
        >
          ✕
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm">
          {filtered.map((opt) => (
            <li
              key={opt.id}
              className={`px-3 py-2 cursor-pointer hover:bg-navy-50 ${opt.id === value ? 'bg-navy-100 font-medium' : ''}`}
              onMouseDown={() => {
                onChange(opt.id)
                setQuery(opt.label)
                setOpen(false)
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
