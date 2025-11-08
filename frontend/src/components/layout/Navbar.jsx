import React from 'react'
import { useWallet } from '../../contexts/WalletContext'
import Button from '../ui/Button'

const Navbar = () => {
  const { user, walletBalance, walletAddress, isConnected, connectWallet, isLoading } = useWallet()

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
      <div className="px-6 py-3">
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
            {/* Wallet Balance - only show if connected */}
            {isConnected && (
              <div className="bg-background px-4 py-2 rounded-lg border">
                <div className="text-sm text-secondary">Balance</div>
                <div className="font-semibold text-primary">{walletBalance} USDC</div>
              </div>
            )}

            {/* Connect Wallet Button */}
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                variant="primary"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <div className="bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Connected</div>
                <div className="text-sm font-mono text-green-800">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</div>
              </div>
            )}

            {/* User Profile - only show if connected */}
            {isConnected && user && (
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
            )}

            {/* Notifications - only show if connected */}
            {isConnected && (
              <button className="relative p-2 text-secondary hover:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 0-6 6v2.25l-2 2V15h16.5v-.75l-2-2V9.75a6 6 0 0 0-6-6z" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
