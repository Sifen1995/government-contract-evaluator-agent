'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Document, DocumentType } from '@/types/document'
import { getDocumentDownloadUrl, deleteDocument } from '@/lib/documents'

interface DocumentListProps {
  documents: Document[];
  onDocumentDeleted?: (documentId: string) => void;
  onViewVersions?: (document: Document) => void;
  showActions?: boolean;
}

const documentTypeLabels: Record<DocumentType, string> = {
  capability_statement: 'Capability Statement',
  certification: 'Certification',
  past_performance: 'Past Performance',
  other: 'Other Document',
}

const extractionStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Extracted', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DocumentList({
  documents,
  onDocumentDeleted,
  onViewVersions,
  showActions = true,
}: DocumentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDownload = async (doc: Document) => {
    try {
      setDownloading(doc.id)
      const { download_url } = await getDocumentDownloadUrl(doc.id)
      window.open(download_url, '_blank')
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      return
    }

    try {
      setDeleting(doc.id)
      await deleteDocument(doc.id)
      onDocumentDeleted?.(doc.id)
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const statusInfo = extractionStatusLabels[doc.extraction_status] || extractionStatusLabels.pending

        return (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-3xl">
                    {doc.file_type === 'pdf' ? '📕' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{documentTypeLabels[doc.document_type]}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {showActions && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                    >
                      {downloading === doc.id ? 'Loading...' : 'Download'}
                    </Button>
                    {onViewVersions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewVersions(doc)}
                      >
                        Versions
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleting === doc.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
