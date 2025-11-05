import React, { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import InputField from '../components/ui/InputField'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  const [profile, setProfile] = useState({
    name: 'John Freelancer',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    timezone: 'UTC-5',
    currency: 'USDC'
  })

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: 30,
    emailNotifications: true,
    pushNotifications: true
  })

  const [preferences, setPreferences] = useState({
    autoProcessInvoices: true,
    defaultSplit: 'equal',
    voiceCommands: true,
    darkMode: false
  })

  const handleSave = async (section) => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert(`${section} settings saved successfully!`)
    }, 1500)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'billing', label: 'Billing', icon: '💳' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-background hover:text-primary'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-xl font-semibold text-secondary mb-6">
                Profile Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InputField
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
                <InputField
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                />
                <InputField
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Timezone
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="UTC-5">UTC-5 (Eastern Time)</option>
                    <option value="UTC-6">UTC-6 (Central Time)</option>
                    <option value="UTC-7">UTC-7 (Mountain Time)</option>
                    <option value="UTC-8">UTC-8 (Pacific Time)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  <h3 className="font-semibold text-secondary mb-1">Wallet Address</h3>
                  <code className="text-sm bg-background px-3 py-2 rounded">
                    0x742d35Cc6634C893292...
                  </code>
                </div>
                <Button 
                  onClick={() => handleSave('Profile')}
                  loading={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <h2 className="text-xl font-semibold text-secondary mb-6">
                Security Settings
              </h2>
              
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.twoFactor}
                      onChange={(e) => setSecurity(prev => ({ ...prev, twoFactor: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Session Timeout */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Session Timeout</h3>
                    <p className="text-sm text-gray-600">Automatically log out after inactivity</p>
                  </div>
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {/* Connected Devices */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-secondary mb-4">Connected Devices</h3>
                  <div className="space-y-3">
                    {[
                      { device: 'MacBook Pro', location: 'New York, US', lastActive: '2 hours ago', current: true },
                      { device: 'iPhone 14', location: 'New York, US', lastActive: '5 minutes ago', current: false }
                    ].map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background rounded">
                        <div>
                          <div className="font-medium text-secondary">{device.device}</div>
                          <div className="text-sm text-gray-500">
                            {device.location} • {device.lastActive}
                            {device.current && <span className="ml-2 text-primary">Current</span>}
                          </div>
                        </div>
                        {!device.current && (
                          <button className="text-error hover:text-red-700 text-sm">
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave('Security')}
                  loading={isLoading}
                  className="w-full"
                >
                  Update Security Settings
                </Button>
              </div>
            </Card>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <Card>
              <h2 className="text-xl font-semibold text-secondary mb-6">
                Preferences
              </h2>
              
              <div className="space-y-6">
                {/* Auto-process Invoices */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Auto-process Invoices</h3>
                    <p className="text-sm text-gray-600">Automatically process and pay verified invoices</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoProcessInvoices}
                      onChange={(e) => setPreferences(prev => ({ ...prev, autoProcessInvoices: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Voice Commands */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Voice Commands</h3>
                    <p className="text-sm text-gray-600">Enable voice-activated payments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.voiceCommands}
                      onChange={(e) => setPreferences(prev => ({ ...prev, voiceCommands: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Default Split */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Default Split Method</h3>
                    <p className="text-sm text-gray-600">Preferred method for splitting payments</p>
                  </div>
                  <select
                    value={preferences.defaultSplit}
                    onChange={(e) => setPreferences(prev => ({ ...prev, defaultSplit: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="equal">Equal Split</option>
                    <option value="percentage">By Percentage</option>
                    <option value="amount">By Amount</option>
                  </select>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-secondary">Dark Mode</h3>
                    <p className="text-sm text-gray-600">Switch to dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.darkMode}
                      onChange={(e) => setPreferences(prev => ({ ...prev, darkMode: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <Button 
                  onClick={() => handleSave('Preferences')}
                  loading={isLoading}
                  className="w-full"
                >
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-xl font-semibold text-secondary mb-6">
                Notification Settings
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    category: 'Payment Notifications',
                    settings: [
                      { name: 'Payment Received', description: 'When you receive a payment', enabled: true },
                      { name: 'Payment Sent', description: 'When you send a payment', enabled: true },
                      { name: 'Payment Failed', description: 'When a payment fails', enabled: true }
                    ]
                  },
                  {
                    category: 'Security Alerts',
                    settings: [
                      { name: 'New Device Login', description: 'When a new device signs in', enabled: true },
                      { name: 'Security Changes', description: 'When security settings change', enabled: true }
                    ]
                  },
                  {
                    category: 'Team Updates',
                    settings: [
                      { name: 'Team Member Added', description: 'When a new member joins', enabled: false },
                      { name: 'Split Payment Ready', description: 'When a split payment is processed', enabled: true }
                    ]
                  }
                ].map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-secondary">{category.category}</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {category.settings.map((setting, settingIndex) => (
                        <div key={settingIndex} className="flex items-center justify-between p-4">
                          <div>
                            <div className="font-medium text-secondary">{setting.name}</div>
                            <div className="text-sm text-gray-600">{setting.description}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={setting.enabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button 
                  onClick={() => handleSave('Notification')}
                  loading={isLoading}
                  className="w-full"
                >
                  Update Notification Settings
                </Button>
              </div>
            </Card>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <Card>
              <h2 className="text-xl font-semibold text-secondary mb-6">
                Billing & Plans
              </h2>
              
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="p-6 border border-primary rounded-lg bg-primary bg-opacity-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">Freelancer Plan</h3>
                      <p className="text-gray-600">Perfect for individual freelancers and small teams</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">$0</div>
                      <div className="text-sm text-gray-500">forever</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">✓</span>
                      <span>Unlimited transactions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">✓</span>
                      <span>AI invoice processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">✓</span>
                      <span>Split payments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">✓</span>
                      <span>Voice commands</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Current Plan
                  </Button>
                </div>

                {/* Transaction History */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary mb-4">
                    Transaction History
                  </h3>
                  <div className="space-y-3">
                    {[
                      { date: '2024-01-15', description: 'Payment to Jane Designer', amount: '120.00 USDC', type: 'outgoing' },
                      { date: '2024-01-14', description: 'Payment from Acme Inc', amount: '500.00 USDC', type: 'incoming' },
                      { date: '2024-01-13', description: 'Network Fee', amount: '0.10 USDC', type: 'fee' }
                    ].map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-secondary">{transaction.description}</div>
                          <div className="text-sm text-gray-500">{transaction.date}</div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'incoming' ? 'text-success' : 
                          transaction.type === 'fee' ? 'text-error' : 'text-secondary'
                        }`}>
                          {transaction.type === 'incoming' ? '+' : '-'}{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Data */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-secondary mb-2">Export Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download your transaction history for accounting purposes.
                  </p>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="small">
                      Export CSV
                    </Button>
                    <Button variant="outline" size="small">
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings