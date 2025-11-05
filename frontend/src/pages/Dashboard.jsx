import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import Card from '../components/ui/Card'
import PaymentCard from '../components/payment/PaymentCard'

const Dashboard = () => {
  const { walletBalance, payments, isLoading } = useWallet()

  const stats = [
    {
      title: 'Total Balance',
      value: `${walletBalance} USDC`,
      description: 'Available funds',
      color: 'text-primary'
    },
    {
      title: 'Pending Payments',
      value: payments.filter(p => p.status === 'pending').length,
      description: 'Awaiting confirmation',
      color: 'text-accent'
    },
    {
      title: 'Completed This Month',
      value: payments.filter(p => p.status === 'completed').length,
      description: 'Successful transactions',
      color: 'text-success'
    },
    {
      title: 'Team Members',
      value: '5',
      description: 'Active collaborators',
      color: 'text-secondary'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Welcome back, John!
        </h1>
        <p className="text-gray-600">
          Here's your payment overview and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} hover>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-secondary mb-1">
                {stat.title}
              </div>
              <div className="text-xs text-gray-500">
                {stat.description}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-secondary mb-4">
          Recent Payments
        </h2>
        <div className="space-y-4">
          {payments.slice(0, 5).map(payment => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
          {payments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent payments found
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-secondary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-center">
            <div className="text-2xl mb-2">📤</div>
            <div className="font-medium text-secondary">Send Payment</div>
            <div className="text-sm text-gray-500">Quick transfer</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-secondary">Split Payment</div>
            <div className="text-sm text-gray-500">Multiple recipients</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-center">
            <div className="text-2xl mb-2">🎙️</div>
            <div className="font-medium text-secondary">Voice Command</div>
            <div className="text-sm text-gray-500">Speak to pay</div>
          </button>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard