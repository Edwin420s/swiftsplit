import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider, useWallet } from './contexts/WalletContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import PaymentRequest from './pages/PaymentRequest'
import TeamManagement from './pages/TeamManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/payments" element={<Layout><PaymentRequest /></Layout>} />
          <Route path="/team" element={<Layout><TeamManagement /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<Layout><Dashboard /></Layout>} />
        </Routes>
        <ToastContainer />
      </Router>
    </WalletProvider>
  )
}

export default App