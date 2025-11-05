import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import Card from '../components/ui/Card'
import PaymentCard from '../components/payment/PaymentCard'
import Button from '../components/ui/Button'

const Dashboard = () => {
  const { walletBalance, payments, isLoading, refreshBalance } = useWallet()

  const stats = [
    {
      title: 'Total Balance',
      value: `${walletBalance.toLocaleString()} USDC`,
      description: 'Available funds',
      color: 'text-primary',
      icon: '💰'
    },
    {
      title: 'Pending Payments',
      value: payments.filter(p => p.status === 'pending').length,
      description: 'Awaiting confirmation',
      color: 'text-accent',
      icon: '⏳'
    },
    {
      title: 'Completed This Month',
      value: payments.filter(p => p.status === 'completed').length,
      description: 'Successful transactions',
      color: 'text-success',
      icon: '✅'
    },
    {
      title: 'Team Members',
      value: '5',
      description: 'Active collaborators',
      color: 'text-secondary',
      icon: '👥'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-secondary">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Welcome back, John!
          </h1>
          <p className="text-gray-600">
            Here's your payment overview and recent activity.
          </p>
        </div>
        <Button onClick={refreshBalance} variant="outline">
          Refresh Balance
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} hover className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
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
              <div className="text-2xl opacity-20">
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary">
                Recent Payments
              </h2>
              <span className="text-sm text-gray-500">
                {payments.length} total
              </span>
            </div>
            <div className="space-y-4">
              {payments.slice(0, 5).map(payment => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
              {payments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">💸</div>
                  <div>No payments yet</div>
                  <div className="text-sm">Send your first payment to get started</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-secondary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-left">
                <div className="text-2xl">📤</div>
                <div>
                  <div className="font-medium text-secondary">Send Payment</div>
                  <div className="text-sm text-gray-500">Quick transfer to anyone</div>
                </div>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-left">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="font-medium text-secondary">Split Payment</div>
                  <div className="text-sm text-gray-500">Multiple recipients</div>
                </div>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-left">
                <div className="text-2xl">🎙️</div>
                <div>
                  <div className="font-medium text-secondary">Voice Command</div>
                  <div className="text-sm text-gray-500">Speak to pay</div>
                </div>
              </button>
              
              <button className="w-full flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-background transition-colors text-left">
                <div className="text-2xl">📄</div>
                <div>
                  <div className="font-medium text-secondary">Upload Invoice</div>
                  <div className="text-sm text-gray-500">AI-powered processing</div>
                </div>
              </button>
            </div>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <h3 className="text-lg font-semibold text-secondary mb-4">
              Recent Contacts
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Jane Designer', role: 'Designer', lastPaid: '2 days ago' },
                { name: 'Mike Developer', role: 'Developer', lastPaid: '1 week ago' },
                { name: 'Sarah QA', role: 'Quality Assurance', lastPaid: '3 days ago' }
              ].map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-background rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium text-sm">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-secondary">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.role}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{contact.lastPaid}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard