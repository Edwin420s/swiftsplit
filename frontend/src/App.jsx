import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import PaymentRequest from './pages/PaymentRequest'
import TeamManagement from './pages/TeamManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

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
      </Router>
    </WalletProvider>
  )
}

export default App