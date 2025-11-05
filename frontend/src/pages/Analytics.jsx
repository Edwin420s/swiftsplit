import React from 'react'
import Card from '../components/ui/Card'

const Analytics = () => {
  // Mock data for analytics
  const analyticsData = {
    monthlyPayments: [
      { month: 'Jan', amount: 4500, count: 12 },
      { month: 'Feb', amount: 5200, count: 15 },
      { month: 'Mar', amount: 4800, count: 14 },
      { month: 'Apr', amount: 6100, count: 18 },
      { month: 'May', amount: 5700, count: 16 },
      { month: 'Jun', amount: 6300, count: 19 }
    ],
    paymentTypes: [
      { type: 'Single', count: 45, percentage: 60 },
      { type: 'Split', count: 30, percentage: 40 }
    ],
    topRecipients: [
      { name: 'Jane Designer', amount: 12000, count: 8 },
      { name: 'Mike Developer', amount: 15000, count: 10 },
      { name: 'Sarah QA', amount: 8000, count: 6 },
      { name: 'Tom PM', amount: 6000, count: 4 }
    ]
  }

  const totalAmount = analyticsData.monthlyPayments.reduce((sum, month) => sum + month.amount, 0)
  const totalTransactions = analyticsData.monthlyPayments.reduce((sum, month) => sum + month.count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Analytics
        </h1>
        <p className="text-gray-600">
          Track your payment performance and insights.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              ${(totalAmount / 1000).toFixed(1)}k
            </div>
            <div className="text-sm font-medium text-secondary">
              Total Volume
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-2">
              {totalTransactions}
            </div>
            <div className="text-sm font-medium text-secondary">
              Total Transactions
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-2">
              {analyticsData.topRecipients.length}
            </div>
            <div className="text-sm font-medium text-secondary">
              Active Recipients
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary mb-2">
              ${(totalAmount / totalTransactions).toFixed(0)}
            </div>
            <div className="text-sm font-medium text-secondary">
              Avg. Transaction
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payments Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-secondary mb-4">
            Monthly Payment Volume
          </h3>
          <div className="space-y-3">
            {analyticsData.monthlyPayments.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary w-12">
                  {month.month}
                </span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ 
                        width: `${(month.amount / Math.max(...analyticsData.monthlyPayments.map(m => m.amount))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-right w-20">
                  <div className="text-sm font-semibold text-primary">
                    ${month.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    {month.count} txns
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Types */}
        <Card>
          <h3 className="text-lg font-semibold text-secondary mb-4">
            Payment Types
          </h3>
          <div className="space-y-4">
            {analyticsData.paymentTypes.map((type, index) => (
              <div key={type.type}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-secondary">
                    {type.type} Payments
                  </span>
                  <span className="text-sm text-gray-500">
                    {type.count} ({type.percentage}%)
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent rounded-full h-2 transition-all"
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Recipients */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-secondary mb-4">
            Top Recipients
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Recipient</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Total Received</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Transactions</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Avg. Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Last Payment</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topRecipients.map((recipient, index) => (
                  <tr key={recipient.name} className="border-b border-gray-100 hover:bg-background">
                    <td className="py-3 px-4">
                      <div className="font-medium text-secondary">{recipient.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-primary">
                        ${recipient.amount}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary">{recipient.count}</td>
                    <td className="py-3 px-4 text-secondary">
                      ${(recipient.amount / recipient.count).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      2 days ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-secondary mb-4">
            Savings vs Traditional
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-800">With SwiftSplit</span>
              <span className="font-semibold text-green-800">$0.10 avg fee</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-800">Traditional Methods</span>
              <span className="font-semibold text-red-800">$15.00 avg fee</span>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-lg font-bold text-primary">
                ${(15 * totalTransactions - 0.1 * totalTransactions).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Savings</div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-secondary mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-3">
            {[
              { metric: 'Payment Success Rate', value: '99.2%', trend: 'up' },
              { metric: 'Average Processing Time', value: '8.3s', trend: 'down' },
              { metric: 'AI Accuracy', value: '96.7%', trend: 'up' },
              { metric: 'User Satisfaction', value: '4.8/5.0', trend: 'up' }
            ].map((item, index) => (
              <div key={item.metric} className="flex justify-between items-center py-2">
                <span className="text-sm text-secondary">{item.metric}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-primary">{item.value}</span>
                  <span className={`text-sm ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.trend === 'up' ? '↗' : '↘'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Analytics