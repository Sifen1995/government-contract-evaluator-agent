'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadDocument, getDocument } from '@/lib/documents'
import { Document, DocumentType } from '@/types/document'

interface DocumentUploadProps {
  documentType: DocumentType;
  title: string;
  description: string;
  onUploadComplete?: (document: Document) => void;
  onExtractionComplete?: (document: Document) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function DocumentUpload({
  documentType,
  title,
  description,
  onUploadComplete,
  onExtractionComplete,
  accept = '.pdf,.docx,.doc',
  maxSizeMB = 10,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [extractionStatus, setExtractionStatus] = useState<{
    documentId: string;
    status: string;
  } | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // Poll for extraction status
  const startExtractionPolling = (documentId: string) => {
    setExtractionStatus({ documentId, status: 'pending' })

    pollingRef.current = setInterval(async () => {
      try {
        const doc = await getDocument(documentId)
        setExtractionStatus({ documentId, status: doc.extraction_status })

        if (doc.extraction_status === 'completed' || doc.extraction_status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          if (doc.extraction_status === 'completed') {
            onExtractionComplete?.(doc)
          }
        }
      } catch (err) {
        console.error('Error polling extraction status:', err)
      }
    }, 5000) // Poll every 5 seconds
  }

  const dismissExtractionStatus = () => {
    setExtractionStatus(null)
  }

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      return 'Only PDF, DOC, and DOCX files are allowed'
    }

    return null
  }

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const document = await uploadDocument(file, documentType)
      onUploadComplete?.(document)
      // Start polling for extraction status
      startExtractionPolling(document.id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                id={`file-upload-${documentType}`}
              />
              <label
                htmlFor={`file-upload-${documentType}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
              >
                Choose File
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Accepted formats: PDF, DOC, DOCX (max {maxSizeMB}MB)
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Extraction Status Notification */}
        {extractionStatus && (
          <div className={`mt-4 p-3 rounded flex items-center justify-between ${
            extractionStatus.status === 'completed'
              ? 'bg-green-50 border border-green-200'
              : extractionStatus.status === 'failed'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              {extractionStatus.status === 'pending' && (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800">Document queued for AI extraction...</span>
                </>
              )}
              {extractionStatus.status === 'processing' && (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800">AI is extracting entities from your document...</span>
                </>
              )}
              {extractionStatus.status === 'completed' && (
                <>
                  <span className="text-2xl">✅</span>
                  <span className="text-green-800">
                    Extraction complete! Review extracted suggestions to auto-populate your profile.
                  </span>
                </>
              )}
              {extractionStatus.status === 'failed' && (
                <>
                  <span className="text-2xl">❌</span>
                  <span className="text-red-800">Extraction failed. Please try uploading again.</span>
                </>
              )}
            </div>
            {(extractionStatus.status === 'completed' || extractionStatus.status === 'failed') && (
              <button
                onClick={dismissExtractionStatus}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
