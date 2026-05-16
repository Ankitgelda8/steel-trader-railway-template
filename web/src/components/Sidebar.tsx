import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    label: 'Dashboard',
    to: '/',
    icon: '⊞',
    roles: ['ADMIN', 'SALES', 'PURCHASES'],
  },
  {
    label: 'Purchases',
    to: '/purchases',
    icon: '↓',
    roles: ['ADMIN', 'PURCHASES'],
  },
  {
    label: 'Sales',
    to: '/sales',
    icon: '↑',
    roles: ['ADMIN', 'SALES'],
  },
  {
    label: 'Stock Report',
    to: '/stock',
    icon: '■',
    roles: ['ADMIN', 'SALES', 'PURCHASES'],
  },
  {
    label: 'Avg Price Report',
    to: '/stock/avg-price',
    icon: '~',
    roles: ['ADMIN', 'SALES', 'PURCHASES'],
  },
  {
    label: 'Companies',
    to: '/masters/companies',
    icon: '🏢',
    roles: ['ADMIN', 'PURCHASES'],
  },
  {
    label: 'Brands',
    to: '/masters/brands',
    icon: '⬡',
    roles: ['ADMIN', 'SALES', 'PURCHASES'],
  },
  {
    label: 'Customers',
    to: '/masters/customers',
    icon: '👤',
    roles: ['ADMIN', 'SALES'],
  },
  {
    label: 'Users',
    to: '/admin/users',
    icon: '⚙',
    roles: ['ADMIN'],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visible = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 min-h-screen bg-navy-600 flex flex-col">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-copper-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Sankeshwar Sales
            </p>
            <p className="text-navy-200 text-xs">Office Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-navy-700 text-white font-medium border-r-2 border-copper-400'
                  : 'text-navy-100 hover:bg-navy-700 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center opacity-75">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-5 py-4 border-t border-navy-700">
        <div className="mb-2">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-navy-300 text-xs truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-copper-600 text-white px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 py-1.5 text-sm text-navy-200 hover:text-white hover:bg-navy-700 rounded transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
