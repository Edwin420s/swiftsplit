import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useWallet } from '../contexts/WalletContext'

const Landing = () => {
  const navigate = useNavigate()
  const { connectWallet, isConnected, isLoading } = useWallet()

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
      navigate('/dashboard')
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Parsing',
      description: 'Upload invoices or use voice commands to create payments instantly'
    },
    {
      icon: '⚡',
      title: 'Instant Settlements',
      description: 'Send USDC payments on Arc blockchain with near-zero fees'
    },
    {
      icon: '👥',
      title: 'Team Payments',
      description: 'Split payments automatically among team members'
    },
    {
      icon: '🔒',
      title: 'Secure & Transparent',
      description: 'All transactions verified on blockchain with full audit trail'
    }
  ]

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="border-b border-accent/20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-primary">
                SwiftSplit
              </span>
            </div>

            {/* Connect Wallet Button */}
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : isConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-primary">
            SwiftSplit
          </h1>
          <p className="text-2xl text-secondary mb-4">
            Fast, Simple Cross-Border Payments
          </p>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
            AI-powered payment platform for freelancers and teams. Send USDC payments instantly with automatic splits.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Get Started
            </Button>
            <Button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-surface/30 backdrop-blur-sm rounded-2xl p-8 border border-accent/20 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$1M+</div>
              <div className="text-muted">Total Volume Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">10k+</div>
              <div className="text-muted">Transactions Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">99.9%</div>
              <div className="text-muted">Uptime Guarantee</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-primary">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-muted">Connect your Circle Wallet or any Web3 wallet</p>
            </div>
            <div className="relative">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-accent">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Payment</h3>
              <p className="text-muted">Use AI to parse invoices or create manually</p>
            </div>
            <div className="relative">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-secondary">
                <span className="text-2xl font-bold text-secondary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Send Instantly</h3>
              <p className="text-muted">Payments processed on Arc blockchain in seconds</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-surface rounded-2xl p-12 text-center border border-accent/30">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers and teams managing payments with SwiftSplit
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            size="lg"
            className="px-12 py-4 text-lg"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-accent/20 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted">
          <p>&copy; 2025 SwiftSplit. Powered by Arc Blockchain & Circle USDC</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
