import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 p-6 ml-60 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout