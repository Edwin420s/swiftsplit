import React from 'react'

const PaymentCard = ({ payment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'pending':
        return '⏳'
      case 'failed':
        return '❌'
      default:
        return '📄'
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-background transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
          <span className="text-lg">{getStatusIcon(payment.status)}</span>
        </div>
        
        <div>
          <div className="font-medium text-secondary">
            {payment.type === 'split' ? 'Split Payment' : `To: ${payment.recipient}`}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(payment.date).toLocaleDateString()}
          </div>
          {payment.type === 'split' && (
            <div className="text-xs text-gray-500 mt-1">
              {payment.recipients?.length} recipients
            </div>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold text-primary text-lg">
          {payment.amount} {payment.currency}
        </div>
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </div>
    </div>
  )
}

export default PaymentCard