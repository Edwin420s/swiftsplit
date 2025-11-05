import React, { useState } from 'react'
import Button from '../ui/Button'

const InvoiceUpload = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    // Check if file is PDF or image
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPEG, or PNG file')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
  }

  const processInvoice = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      alert('Invoice processed successfully! AI detected: Pay Jane Doe 120 USDC for website design')
    }, 3000)
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary bg-opacity-5' 
              : 'border-gray-300 hover:border-primary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          
          <h3 className="text-lg font-semibold text-secondary mb-2">
            Upload Invoice
          </h3>
          
          <p className="text-gray-600 mb-4">
            Drag and drop your invoice file here, or click to browse
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Supports PDF, JPG, PNG (Max 10MB)
          </p>
          
          <input
            type="file"
            id="invoice-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
          />
          
          <label htmlFor="invoice-upload">
            <Button as="span" variant="outline">
              Choose File
            </Button>
          </label>
        </div>
      ) : (
        /* File Preview */
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-lg">📄</span>
              </div>
              <div>
                <div className="font-medium text-secondary">{uploadedFile.name}</div>
                <div className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-error transition-colors"
            >
              ✕
            </button>
          </div>
          
          <Button 
            onClick={processInvoice} 
            loading={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'AI Processing Invoice...' : 'Process with AI'}
          </Button>
        </div>
      )}

      {/* AI Features Info */}
      <div className="bg-background rounded-lg p-6">
        <h4 className="font-semibold text-secondary mb-3">
          AI-Powered Invoice Processing
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-primary">🔍</span>
            <span>Automatically extracts amounts and recipients</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-primary">✅</span>
            <span>Verifies payment details</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-primary">💬</span>
            <span>Understands natural language invoices</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-primary">⚡</span>
            <span>Processes in seconds</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceUpload