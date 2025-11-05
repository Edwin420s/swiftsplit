import React, { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import InputField from '../components/ui/InputField'
import InvoiceUpload from '../components/payment/InvoiceUpload'
import SplitCalculator from '../components/payment/SplitCalculator'

const PaymentRequest = () => {
  const [activeTab, setActiveTab] = useState('single')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false)
      alert('Payment request submitted successfully!')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Send Payment
        </h1>
        <p className="text-gray-600">
          Choose your preferred method to send payments quickly and securely.
        </p>
      </div>

      {/* Payment Method Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'single', label: 'Single Payment', icon: '👤' },
              { id: 'split', label: 'Split Payment', icon: '👥' },
              { id: 'invoice', label: 'Invoice Upload', icon: '📄' },
              { id: 'voice', label: 'Voice Command', icon: '🎙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* Single Payment Form */}
          {activeTab === 'single' && (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <InputField
                label="Recipient Wallet Address"
                type="text"
                placeholder="0x742d35Cc6634C893292..."
                required
              />
              <InputField
                label="Amount (USDC)"
                type="number"
                placeholder="0.00"
                step="0.01"
                required
              />
              <InputField
                label="Description"
                type="text"
                placeholder="Payment for website design"
              />
              <Button type="submit" loading={isProcessing}>
                Send Payment
              </Button>
            </form>
          )}

          {/* Split Payment */}
          {activeTab === 'split' && <SplitCalculator />}

          {/* Invoice Upload */}
          {activeTab === 'invoice' && <InvoiceUpload />}

          {/* Voice Command */}
          {activeTab === 'voice' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Voice Payment
              </h3>
              <p className="text-gray-600 mb-6">
                Click and speak your payment command
              </p>
              <Button size="large" className="w-32 h-32 rounded-full">
                <span className="text-2xl">🎤</span>
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Try saying: "Pay John 50 USDC for design work"
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Templates */}
      <Card>
        <h3 className="text-lg font-semibold text-secondary mb-4">
          Payment Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Monthly Retainer', amount: '1000 USDC', recipients: 1 },
            { name: 'Design Team', amount: '2500 USDC', recipients: 3 },
            { name: 'Content Team', amount: '1500 USDC', recipients: 2 }
          ].map((template, index) => (
            <button
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-background transition-colors text-left"
            >
              <div className="font-medium text-secondary">{template.name}</div>
              <div className="text-primary font-semibold">{template.amount}</div>
              <div className="text-sm text-gray-500">
                {template.recipients} recipient{template.recipients > 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default PaymentRequest