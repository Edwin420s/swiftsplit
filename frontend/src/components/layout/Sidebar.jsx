import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/payments', icon: '💸', label: 'Send Payment' },
    { path: '/team', icon: '👥', label: 'Team Management' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="fixed left-0 top-16 h-screen w-64 bg-white border-r border-gray-200">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-background hover:text-primary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="px-4 text-sm font-semibold text-secondary mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-background hover:text-primary rounded-lg transition-colors">
              <span className="text-lg">🔄</span>
              <span className="font-medium">Recurring Payments</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-background hover:text-primary rounded-lg transition-colors">
              <span className="text-lg">🎙️</span>
              <span className="font-medium">Voice Payment</span>
            </button>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar