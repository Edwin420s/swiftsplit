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
  const [toasts, setToasts] = useState([])

  // Mock data for demonstration
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockUser = {
          id: 1,
          name: 'John Freelancer',
          email: 'john@example.com',
          walletAddress: '0x742d35Cc6634C893292',
          role: 'freelancer',
          avatar: 'JF',
          joinedDate: '2024-01-01'
        }

        const mockPayments = [
          {
            id: 1,
            amount: 120,
            currency: 'USDC',
            status: 'completed',
            recipient: 'Jane Designer',
            recipientWallet: '0x893292Cc6634C742d35',
            date: '2024-01-15',
            type: 'single',
            description: 'Website design payment',
            transactionHash: '0xabc123def456...'
          },
          {
            id: 2,
            amount: 500,
            currency: 'USDC',
            status: 'pending',
            recipients: [
              { name: 'John Dev', amount: 300, wallet: '0x742d35Cc6634C893292' },
              { name: 'Sarah QA', amount: 200, wallet: '0x893292Cc6634C742d35' }
            ],
            date: '2024-01-14',
            type: 'split',
            description: 'Team payment for project',
            transactionHash: '0xdef456abc123...'
          },
          {
            id: 3,
            amount: 75,
            currency: 'USDC',
            status: 'completed',
            recipient: 'Mike Copywriter',
            recipientWallet: '0x6634C893292742d35',
            date: '2024-01-12',
            type: 'single',
            description: 'Content writing',
            transactionHash: '0x123abc456def...'
          }
        ]

        setUser(mockUser)
        setWalletBalance(1500.75)
        setPayments(mockPayments)
        
        addToast('Welcome back to SwiftSplit!', 'success')
      } catch (error) {
        addToast('Error loading wallet data', 'error')
        console.error('Error loading initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const addPayment = (payment) => {
    const newPayment = {
      id: Date.now(),
      ...payment,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
    }
    
    setPayments(prev => [newPayment, ...prev])
    setWalletBalance(prev => prev - payment.amount)
    addToast(`Payment of ${payment.amount} USDC sent!`, 'success')
    
    // Simulate payment confirmation after 3 seconds
    setTimeout(() => {
      updatePaymentStatus(newPayment.id, 'completed')
      addToast(`Payment of ${payment.amount} USDC confirmed!`, 'success')
    }, 3000)
  }

  const updatePaymentStatus = (paymentId, status) => {
    setPayments(prev => prev.map(payment =>
      payment.id === paymentId ? { ...payment, status } : payment
    ))
  }

  const refreshBalance = async () => {
    try {
      // Simulate API call to refresh balance
      await new Promise(resolve => setTimeout(resolve, 1000))
      setWalletBalance(prev => prev + Math.random() * 100) // Mock balance update
      addToast('Balance updated successfully', 'success')
    } catch (error) {
      addToast('Error updating balance', 'error')
    }
  }

  const value = {
    walletBalance,
    user,
    payments,
    isLoading,
    toasts,
    setWalletBalance,
    addPayment,
    updatePaymentStatus,
    refreshBalance,
    addToast
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}