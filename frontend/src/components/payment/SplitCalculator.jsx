import React, { useState } from 'react'
import Button from '../ui/Button'
import InputField from '../ui/InputField'

const SplitCalculator = () => {
  const [totalAmount, setTotalAmount] = useState('')
  const [recipients, setRecipients] = useState([
    { id: 1, name: '', wallet: '', amount: '', percentage: 100 }
  ])
  const [splitType, setSplitType] = useState('equal') // 'equal', 'percentage', 'amount'

  const addRecipient = () => {
    setRecipients(prev => [
      ...prev,
      { id: Date.now(), name: '', wallet: '', amount: '', percentage: 0 }
    ])
  }

  const removeRecipient = (id) => {
    if (recipients.length > 1) {
      setRecipients(prev => prev.filter(recipient => recipient.id !== id))
    }
  }

  const updateRecipient = (id, field, value) => {
    setRecipients(prev => prev.map(recipient => 
      recipient.id === id ? { ...recipient, [field]: value } : recipient
    ))
  }

  const calculateEqualSplit = () => {
    if (!totalAmount) return
    
    const amountPerRecipient = (parseFloat(totalAmount) / recipients.length).toFixed(2)
    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      amount: amountPerRecipient,
      percentage: (100 / recipients.length).toFixed(2)
    })))
  }

  const calculateByPercentages = () => {
    if (!totalAmount) return
    
    const totalPercentage = recipients.reduce((sum, recipient) => 
      sum + parseFloat(recipient.percentage || 0), 0
    )
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert(`Total percentage must be 100%. Current: ${totalPercentage}%`)
      return
    }

    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      amount: ((parseFloat(totalAmount) * parseFloat(recipient.percentage || 0)) / 100).toFixed(2)
    })))
  }

  const calculateByAmounts = () => {
    if (!totalAmount) return
    
    const totalAmounts = recipients.reduce((sum, recipient) => 
      sum + parseFloat(recipient.amount || 0), 0
    )
    
    if (Math.abs(totalAmounts - parseFloat(totalAmount)) > 0.01) {
      alert(`Total amounts must equal ${totalAmount}. Current: ${totalAmounts}`)
      return
    }

    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      percentage: ((parseFloat(recipient.amount || 0) / parseFloat(totalAmount)) * 100).toFixed(2)
    })))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validate and submit split payment
    alert('Split payment configured successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Total Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Total Amount (USDC)"
          type="number"
          placeholder="0.00"
          step="0.01"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Split Type
          </label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="equal">Equal Split</option>
            <option value="percentage">By Percentage</option>
            <option value="amount">By Amount</option>
          </select>
        </div>
      </div>

      {/* Calculation Buttons */}
      <div className="flex space-x-4">
        {splitType === 'equal' && (
          <Button onClick={calculateEqualSplit} variant="outline">
            Calculate Equal Split
          </Button>
        )}
        {splitType === 'percentage' && (
          <Button onClick={calculateByPercentages} variant="outline">
            Calculate Amounts
          </Button>
        )}
        {splitType === 'amount' && (
          <Button onClick={calculateByAmounts} variant="outline">
            Calculate Percentages
          </Button>
        )}
      </div>

      {/* Recipients List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-secondary">
            Recipients ({recipients.length})
          </h3>
          <Button onClick={addRecipient} variant="outline" size="small">
            + Add Recipient
          </Button>
        </div>

        {recipients.map((recipient, index) => (
          <div key={recipient.id} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Name */}
              <div className="md:col-span-3">
                <InputField
                  label="Name"
                  placeholder="Recipient Name"
                  value={recipient.name}
                  onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                />
              </div>

              {/* Wallet */}
              <div className="md:col-span-4">
                <InputField
                  label="Wallet Address"
                  placeholder="0x..."
                  value={recipient.wallet}
                  onChange={(e) => updateRecipient(recipient.id, 'wallet', e.target.value)}
                />
              </div>

              {/* Amount */}
              <div className="md:col-span-2">
                <InputField
                  label="Amount (USDC)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recipient.amount}
                  onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                />
              </div>

              {/* Percentage */}
              <div className="md:col-span-2">
                <InputField
                  label="Percentage (%)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recipient.percentage}
                  onChange={(e) => updateRecipient(recipient.id, 'percentage', e.target.value)}
                />
              </div>

              {/* Remove Button */}
              <div className="md:col-span-1">
                {recipients.length > 1 && (
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="w-full py-2 text-error hover:bg-error hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {totalAmount && (
        <div className="bg-background rounded-lg p-6">
          <h4 className="font-semibold text-secondary mb-4">Split Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total Amount</div>
              <div className="font-semibold text-primary text-lg">{totalAmount} USDC</div>
            </div>
            <div>
              <div className="text-gray-500">Recipients</div>
              <div className="font-semibold text-secondary">{recipients.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Total %</div>
              <div className="font-semibold text-secondary">
                {recipients.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-gray-500">Total Amount</div>
              <div className="font-semibold text-secondary">
                {recipients.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toFixed(2)} USDC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} className="w-full" size="large">
        Send Split Payment
      </Button>
    </div>
  )
}

export default SplitCalculator