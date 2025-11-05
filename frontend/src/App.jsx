import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider, useWallet } from './contexts/WalletContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import PaymentRequest from './pages/PaymentRequest'
import TeamManagement from './pages/TeamManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Toast from './components/ui/Toast'

// Toast Container Component
const ToastContainer = () => {
  const { toasts, addToast } = useWallet()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => addToast(toast.id)}
        />
      ))}
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/payments" element={<PaymentRequest />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </Router>
    </WalletProvider>
  )
}

export default App