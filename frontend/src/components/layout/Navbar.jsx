import React from 'react'
import { useWallet } from '../../contexts/WalletContext'

const Navbar = () => {
  const { user, walletBalance } = useWallet()

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="ml-3 text-xl font-semibold text-secondary">
              SwiftSplit
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-secondary hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 0-6 6v2.25l-2 2V15h16.5v-.75l-2-2V9.75a6 6 0 0 0-6-6z" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </button>

            {/* Wallet Balance */}
            <div className="bg-background px-4 py-2 rounded-lg border">
              <div className="text-sm text-secondary">Balance</div>
              <div className="font-semibold text-primary">{walletBalance} USDC</div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-secondary">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar