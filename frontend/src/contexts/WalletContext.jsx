import React, { createContext, useContext, useState, useEffect } from 'react'
import { connectWallet, signMessage, getUSDCBalance, onAccountsChanged, onChainChanged, disconnectWallet, approveUSDC, executePayment } from '../utils/walletConnection'

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
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'

  // Connect wallet and authenticate
  const connectUserWallet = async () => {
    try {
      setIsLoading(true)
      
      // Step 1: Connect to wallet
      const { provider: walletProvider, signer: walletSigner, address } = await connectWallet()
      
      setProvider(walletProvider)
      setSigner(walletSigner)
      setWalletAddress(address)
      setIsConnected(true)
      
      // Step 2: Get nonce from backend for signature verification
      const nonceResponse = await fetch(`${API_BASE_URL}/auth/nonce?address=${address}`)
      const { nonce } = await nonceResponse.json()
      
      // Step 3: Sign the nonce message
      const message = `SwiftSplit Login\n\nSign this message to authenticate your wallet.\n\nNonce: ${nonce}`
      const signature = await signMessage(walletSigner, message)
      
      // Step 4: Send signature to backend for verification and authentication
      const authResponse = await fetch(`${API_BASE_URL}/auth/wallet-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce })
      })
      
      const data = await authResponse.json()
      
      if (!authResponse.ok) {
        throw new Error(data.message || 'Authentication failed')
      }
      
      // Set user data
      setUser({
        id: data.user.id,
        walletAddress: data.user.walletAddress,
        name: data.user.name || `User ${address.substring(0, 6)}`,
        joinedDate: data.user.createdAt,
        role: 'freelancer'
      })
      
      // Store token
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('walletAddress', address)
      }
      
      // Fetch USDC balance
      const balance = await getUSDCBalance(walletProvider, address, USDC_ADDRESS)
      setWalletBalance(parseFloat(balance))
      
      // Fetch user's payments
      await fetchPayments(data.token)
      
      addToast('Wallet connected successfully!', 'success')
      
      return address
    } catch (error) {
      console.error('Wallet connection error:', error)
      addToast(error.message || 'Failed to connect wallet', 'error')
      
      // Reset connection state
      setIsConnected(false)
      setWalletAddress(null)
      setProvider(null)
      setSigner(null)
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Disconnect wallet
  const disconnectUserWallet = () => {
    disconnectWallet()
    setIsConnected(false)
    setWalletAddress(null)
    setProvider(null)
    setSigner(null)
    setUser(null)
    setWalletBalance(0)
    setPayments([])
    localStorage.removeItem('authToken')
    localStorage.removeItem('walletAddress')
    addToast('Wallet disconnected', 'info')
  }

  // Fetch user payments from backend
  const fetchPayments = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('authToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  // Reconnect on page load if wallet was previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress')
    const savedToken = localStorage.getItem('authToken')
    
    if (savedAddress && savedToken && window.ethereum) {
      // Auto-reconnect
      connectUserWallet().catch(err => {
        console.log('Auto-reconnect failed:', err)
      })
    }
  }, [])

  // Listen for account and network changes
  useEffect(() => {
    onAccountsChanged((newAddress) => {
      if (newAddress && newAddress !== walletAddress) {
        // Account changed, reconnect
        connectUserWallet().catch(console.error)
      } else if (!newAddress) {
        // Disconnected
        disconnectUserWallet()
      }
    })
    
    onChainChanged((chainId) => {
      // Network changed, refresh connection
      if (isConnected) {
        addToast('Network changed. Please reconnect.', 'warning')
        disconnectUserWallet()
      }
    })
  }, [walletAddress, isConnected])

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  // Execute payment on blockchain
  const sendPayment = async (recipients, amounts) => {
    try {
      if (!signer || !isConnected) {
        throw new Error('Wallet not connected')
      }

      setIsLoading(true)
      
      // Convert amounts to smallest unit (6 decimals for USDC)
      const { ethers } = await import('ethers')
      const amountsInWei = amounts.map(amt => ethers.utils.parseUnits(amt.toString(), 6))
      const totalAmount = amountsInWei.reduce((sum, amt) => sum.add(amt), ethers.BigNumber.from(0))
      
      // Step 1: Approve USDC spending
      addToast('Approving USDC spending...', 'info')
      await approveUSDC(signer, USDC_ADDRESS, CONTRACT_ADDRESS, totalAmount)
      
      // Step 2: Execute payment on smart contract
      addToast('Executing payment...', 'info')
      const result = await executePayment(signer, CONTRACT_ADDRESS, recipients, amountsInWei)
      
      // Step 3: Save payment to backend
      const token = localStorage.getItem('authToken')
      await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients,
          amounts,
          txHash: result.txHash,
          paymentId: result.paymentId
        })
      })
      
      // Update local state
      await fetchPayments(token)
      await refreshBalance()
      
      addToast('Payment sent successfully!', 'success')
      return result
    } catch (error) {
      console.error('Payment error:', error)
      addToast(error.message || 'Payment failed', 'error')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updatePaymentStatus = (paymentId, status) => {
    setPayments(prev => prev.map(payment =>
      payment.id === paymentId ? { ...payment, status } : payment
    ))
  }

  const refreshBalance = async () => {
    try {
      if (!provider || !walletAddress) {
        return
      }
      
      const balance = await getUSDCBalance(provider, walletAddress, USDC_ADDRESS)
      setWalletBalance(parseFloat(balance))
      addToast('Balance updated successfully', 'success')
    } catch (error) {
      console.error('Balance refresh error:', error)
      addToast('Error updating balance', 'error')
    }
  }

  const value = {
    // State
    walletBalance,
    user,
    walletAddress,
    isConnected,
    provider,
    signer,
    payments,
    isLoading,
    toasts,
    // Wallet functions
    connectWallet: connectUserWallet,
    disconnectWallet: disconnectUserWallet,
    // Payment functions
    sendPayment,
    updatePaymentStatus,
    refreshBalance,
    fetchPayments,
    // Utility
    addToast
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}