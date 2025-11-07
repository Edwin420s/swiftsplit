// SwiftSplit API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Axios-like fetch wrapper
const request = async (url, options = {}) => {
  try {
    const isFormData = options.body instanceof FormData
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
    const headers = isFormData
      ? { ...authHeader, ...(options.headers || {}) }
      : { 'Content-Type': 'application/json', ...authHeader, ...(options.headers || {}) }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers,
      ...options
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed')
    }

    return data
  } catch (error) {
    console.error(`API request failed: ${url}`, error)
    throw error
  }
}

export const api = {
  // Payment endpoints
  payments: {
    create: async (paymentData) => {
      return await request('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })
    },
    
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString()
      return await request(`/payments${query ? '?' + query : ''}`)
    },

    getById: async (paymentId) => {
      return await request(`/payments/${paymentId}`)
    },

    execute: async (paymentId) => {
      return await request(`/payments/${paymentId}/execute`, {
        method: 'POST'
      })
    },

    cancel: async (paymentId) => {
      return await request(`/payments/${paymentId}/cancel`, {
        method: 'POST'
      })
    }
  },

  // AI endpoints
  ai: {
    processInvoice: async (file) => {
      const formData = new FormData()
      formData.append('invoice', file)

      return await request('/ai/parse-invoice', {
        method: 'POST',
        headers: {},
        body: formData
      })
    },
    
    processChat: async (message) => {
      return await request('/ai/parse-chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      })
    },

    processVoice: async (audioBlob) => {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      return await request('/voice/process', {
        method: 'POST',
        headers: {},
        body: formData
      })
    }
  },

  // Team endpoints
  team: {
    list: async () => {
      return await request('/teams')
    },
    
    create: async (teamData) => {
      return await request('/teams', {
        method: 'POST',
        body: JSON.stringify(teamData)
      })
    },

    update: async (teamId, teamData) => {
      return await request(`/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(teamData)
      })
    },

    delete: async (teamId) => {
      return await request(`/teams/${teamId}`, {
        method: 'DELETE'
      })
    }
  },

  // Wallet endpoints
  wallet: {
    getBalance: async (walletAddress) => {
      return await request(`/wallets/${walletAddress}/balance`)
    },

    create: async (userData) => {
      return await request('/wallets/create', {
        method: 'POST',
        body: JSON.stringify(userData)
      })
    }
  },

  // Analytics endpoints
  analytics: {
    getOverview: async (params = {}) => {
      const query = new URLSearchParams(params).toString()
      return await request(`/analytics/overview${query ? '?' + query : ''}`)
    },

    getPaymentStats: async (params = {}) => {
      const query = new URLSearchParams(params).toString()
      return await request(`/analytics/payments${query ? '?' + query : ''}`)
    }
  }
}

export default api