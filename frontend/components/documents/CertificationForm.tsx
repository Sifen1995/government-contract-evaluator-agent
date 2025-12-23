'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CertificationDocument, CertificationCreate } from '@/types/document'
import { createCertification, updateCertification, deleteCertification } from '@/lib/documents'

const CERTIFICATION_TYPES = [
  { value: '8(a)', label: '8(a) Business Development Program' },
  { value: 'WOSB', label: 'Women-Owned Small Business (WOSB)' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB (EDWOSB)' },
  { value: 'SDVOSB', label: 'Service-Disabled Veteran-Owned SB (SDVOSB)' },
  { value: 'VOSB', label: 'Veteran-Owned Small Business (VOSB)' },
  { value: 'HUBZone', label: 'HUBZone Certified' },
  { value: 'SDB', label: 'Small Disadvantaged Business (SDB)' },
  { value: 'Other', label: 'Other Certification' },
]

interface CertificationFormProps {
  certifications: CertificationDocument[];
  onCertificationChange?: () => void;
}

function getDaysUntilExpiration(expirationDate: string): number {
  const expiry = new Date(expirationDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getStatusColor(status: string, expirationDate?: string): string {
  if (status === 'expired') return 'bg-red-100 text-red-800 border-red-200'
  if (status === 'pending_renewal') return 'bg-yellow-100 text-yellow-800 border-yellow-200'

  if (expirationDate) {
    const daysUntil = getDaysUntilExpiration(expirationDate)
    if (daysUntil <= 30) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (daysUntil <= 90) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  return 'bg-green-100 text-green-800 border-green-200'
}

function getStatusLabel(status: string, expirationDate?: string): string {
  if (status === 'expired') return 'Expired'
  if (status === 'pending_renewal') return 'Pending Renewal'

  if (expirationDate) {
    const daysUntil = getDaysUntilExpiration(expirationDate)
    if (daysUntil <= 30) return `Expires in ${daysUntil} days`
    if (daysUntil <= 90) return `Expires ${new Date(expirationDate).toLocaleDateString()}`
  }

  return 'Active'
}

export function CertificationForm({ certifications, onCertificationChange }: CertificationFormProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newCert, setNewCert] = useState<CertificationCreate>({
    certification_type: '',
    issued_date: '',
    expiration_date: '',
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCert.certification_type) {
      setError('Please select a certification type')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createCertification(newCert)
      setNewCert({ certification_type: '', issued_date: '', expiration_date: '' })
      setShowAddForm(false)
      onCertificationChange?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add certification')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this certification?')) {
      return
    }

    setDeleting(id)
    try {
      await deleteCertification(id)
      onCertificationChange?.()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete certification')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
        <CardDescription>
          Manage your small business certifications and track expiration dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {certifications.length > 0 && (
          <div className="space-y-3 mb-6">
            {certifications.map((cert) => {
              const typeLabel = CERTIFICATION_TYPES.find(t => t.value === cert.certification_type)?.label || cert.certification_type
              const statusColor = getStatusColor(cert.status, cert.expiration_date)
              const statusLabel = getStatusLabel(cert.status, cert.expiration_date)

              return (
                <div
                  key={cert.id}
                  className={`p-4 rounded-lg border ${statusColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{typeLabel}</h4>
                      <div className="text-sm opacity-75 mt-1">
                        {cert.issued_date && (
                          <span>Issued: {new Date(cert.issued_date).toLocaleDateString()}</span>
                        )}
                        {cert.issued_date && cert.expiration_date && <span> | </span>}
                        {cert.expiration_date && (
                          <span>Expires: {new Date(cert.expiration_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{statusLabel}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert.id)}
                        disabled={deleting === cert.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deleting === cert.id ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showAddForm ? (
          <form onSubmit={handleAdd} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="certification_type">Certification Type *</Label>
              <NativeSelect
                id="certification_type"
                value={newCert.certification_type}
                onChange={(e) => setNewCert({ ...newCert, certification_type: e.target.value })}
              >
                <option value="">Select certification...</option>
                {CERTIFICATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issued_date">Issue Date</Label>
                <Input
                  id="issued_date"
                  type="date"
                  value={newCert.issued_date || ''}
                  onChange={(e) => setNewCert({ ...newCert, issued_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={newCert.expiration_date || ''}
                  onChange={(e) => setNewCert({ ...newCert, expiration_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Certification'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            + Add Certification
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
