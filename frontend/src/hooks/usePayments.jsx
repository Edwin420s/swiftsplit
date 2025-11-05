import { useState, useEffect } from 'react'

export const usePayments = () => {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulate API call
    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        // In a real app, this would be an API call
        const mockPayments = [
          {
            id: 1,
            amount: 120,
            currency: 'USDC',
            status: 'completed',
            recipient: 'Jane Designer',
            date: '2024-01-15',
            type: 'single',
            transactionHash: '0xabc123...'
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
            type: 'split',
            transactionHash: '0xdef456...'
          }
        ]
        setPayments(mockPayments)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const addPayment = (payment) => {
    setPayments(prev => [payment, ...prev])
  }

  const updatePaymentStatus = (paymentId, status) => {
    setPayments(prev => prev.map(payment =>
      payment.id === paymentId ? { ...payment, status } : payment
    ))
  }

  return {
    payments,
    isLoading,
    error,
    addPayment,
    updatePaymentStatus
  }
}