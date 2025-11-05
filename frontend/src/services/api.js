// Mock API service for demonstration
const API_BASE_URL = 'https://api.swiftsplit.com'

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const api = {
  // Payment endpoints
  payments: {
    create: async (paymentData) => {
      await delay(1000)
      return {
        success: true,
        data: {
          id: Date.now(),
          ...paymentData,
          status: 'pending',
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: new Date().toISOString()
        }
      }
    },
    
    list: async () => {
      await delay(500)
      return {
        success: true,
        data: [
          {
            id: 1,
            amount: 120,
            currency: 'USDC',
            status: 'completed',
            recipient: 'Jane Designer',
            date: '2024-01-15',
            type: 'single'
          }
        ]
      }
    }
  },

  // AI endpoints
  ai: {
    processInvoice: async (file) => {
      await delay(2000)
      return {
        success: true,
        data: {
          recipient: 'Jane Designer',
          amount: 120,
          currency: 'USDC',
          description: 'Website design services',
          confidence: 0.95
        }
      }
    },
    
    processVoice: async (audioBlob) => {
      await delay(1500)
      return {
        success: true,
        data: {
          intent: 'payment',
          recipient: 'Mike Developer',
          amount: 200,
          currency: 'USDC',
          description: 'Backend development',
          confidence: 0.92
        }
      }
    }
  },

  // Team endpoints
  team: {
    list: async () => {
      await delay(500)
      return {
        success: true,
        data: [
          {
            id: 1,
            name: 'Jane Designer',
            email: 'jane@example.com',
            wallet: '0x742d35Cc6634C893292',
            role: 'Designer',
            defaultSplit: 40
          }
        ]
      }
    },
    
    add: async (member) => {
      await delay(800)
      return {
        success: true,
        data: {
          id: Date.now(),
          ...member,
          joined: new Date().toISOString()
        }
      }
    }
  }
}

export default api