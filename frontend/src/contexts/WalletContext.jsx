import React, { createContext, useContext, useState, useEffect } from 'react'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState(0)
  const [user, setUser] = useState(null)
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockUser = {
      name: 'John Freelancer',
      email: 'john@example.com',
      walletAddress: '0x742d35Cc...',
      role: 'freelancer'
    }

    const mockPayments = [
      {
        id: 1,
        amount: 120,
        currency: 'USDC',
        status: 'completed',
        recipient: 'Jane Designer',
        date: '2024-01-15',
        type: 'single'
      },
      {
        id: 2,
        amount: 500,
        currency: 'USDC',
        status: 'pending',
        recipients: [
          { name: 'John Dev', amount: 300 },
          { name: 'Sarah QA', amount: 200 }
        ],
        date: '2024-01-14',
        type: 'split'
      }
    ]

    setUser(mockUser)
    setWalletBalance(1500)
    setPayments(mockPayments)
    setIsLoading(false)
  }, [])

  const value = {
    walletBalance,
    user,
    payments,
    isLoading,
    setWalletBalance,
    addPayment: (payment) => setPayments(prev => [payment, ...prev])
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}