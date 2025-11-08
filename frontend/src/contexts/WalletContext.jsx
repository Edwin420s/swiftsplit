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
  const [isLoading, setIsLoading] = useState(false)
  const [toasts, setToasts] = useState([])

  const createAccount = async (formData) => {
    try {
      setIsLoading(true)
      
      // Call backend API to create account
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Account creation failed')
      }

      // Set user data from response
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        walletAddress: data.user.walletAddress,
        role: 'freelancer',
        avatar: data.user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        joinedDate: new Date().toISOString().split('T')[0]
      })

      setWalletBalance(0)
      
      // Store token
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }

      addToast('Account created successfully!', 'success')
    } catch (error) {
      addToast(error.message || 'Error creating account', 'error')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

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
    addToast,
    createAccount
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}