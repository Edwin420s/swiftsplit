import React, { useEffect } from 'react'

const Toast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`fixed top-20 right-6 z-50 border rounded-lg p-4 shadow-lg ${typeStyles[type]}`}>
      <div className="flex items-center space-x-3">
        <span className="text-lg">{typeIcons[type]}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Toast