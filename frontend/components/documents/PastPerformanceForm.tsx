'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PastPerformance, PastPerformanceCreate, PerformanceRating } from '@/types/document'
import { createPastPerformance, deletePastPerformance } from '@/lib/documents'

const PERFORMANCE_RATINGS: { value: PerformanceRating; label: string }[] = [
  { value: 'exceptional', label: 'Exceptional' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'satisfactory', label: 'Satisfactory' },
  { value: 'marginal', label: 'Marginal' },
  { value: 'unsatisfactory', label: 'Unsatisfactory' },
]

interface PastPerformanceFormProps {
  records: PastPerformance[];
  onRecordChange?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getRatingColor(rating: PerformanceRating): string {
  switch (rating) {
    case 'exceptional':
      return 'bg-green-100 text-green-800'
    case 'very_good':
      return 'bg-blue-100 text-blue-800'
    case 'satisfactory':
      return 'bg-gray-100 text-gray-800'
    case 'marginal':
      return 'bg-yellow-100 text-yellow-800'
    case 'unsatisfactory':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function PastPerformanceForm({ records, onRecordChange }: PastPerformanceFormProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newRecord, setNewRecord] = useState<PastPerformanceCreate>({
    contract_number: '',
    agency_name: '',
    contract_value: undefined,
    pop_start: '',
    pop_end: '',
    naics_codes: [],
    performance_rating: undefined,
    description: '',
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecord.agency_name) {
      setError('Please enter the agency name')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createPastPerformance({
        ...newRecord,
        naics_codes: newRecord.naics_codes?.length ? newRecord.naics_codes : undefined,
      })
      setNewRecord({
        contract_number: '',
        agency_name: '',
        contract_value: undefined,
        pop_start: '',
        pop_end: '',
        naics_codes: [],
        performance_rating: undefined,
        description: '',
      })
      setShowAddForm(false)
      onRecordChange?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add past performance')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this past performance record?')) {
      return
    }

    setDeleting(id)
    try {
      await deletePastPerformance(id)
      onRecordChange?.()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete record')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Performance</CardTitle>
        <CardDescription>
          Add your previous contract history to improve AI scoring accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length > 0 && (
          <div className="space-y-3 mb-6">
            {records.map((record) => (
              <div key={record.id} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{record.agency_name}</h4>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {record.contract_number && (
                        <div>Contract #: {record.contract_number}</div>
                      )}
                      {record.contract_value && (
                        <div>Value: {formatCurrency(record.contract_value)}</div>
                      )}
                      {(record.pop_start || record.pop_end) && (
                        <div>
                          Period: {record.pop_start && new Date(record.pop_start).toLocaleDateString()}
                          {record.pop_start && record.pop_end && ' - '}
                          {record.pop_end && new Date(record.pop_end).toLocaleDateString()}
                        </div>
                      )}
                      {record.naics_codes && record.naics_codes.length > 0 && (
                        <div>NAICS: {record.naics_codes.join(', ')}</div>
                      )}
                      {record.description && (
                        <div className="mt-2 text-gray-700">{record.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {record.performance_rating && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(record.performance_rating)}`}>
                        {PERFORMANCE_RATINGS.find(r => r.value === record.performance_rating)?.label}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      disabled={deleting === record.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deleting === record.id ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <form onSubmit={handleAdd} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency_name">Agency Name *</Label>
                <Input
                  id="agency_name"
                  value={newRecord.agency_name}
                  onChange={(e) => setNewRecord({ ...newRecord, agency_name: e.target.value })}
                  placeholder="e.g., Department of Defense"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_number">Contract Number</Label>
                <Input
                  id="contract_number"
                  value={newRecord.contract_number}
                  onChange={(e) => setNewRecord({ ...newRecord, contract_number: e.target.value })}
                  placeholder="e.g., FA8532-20-C-0001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_value">Contract Value ($)</Label>
                <Input
                  id="contract_value"
                  type="number"
                  value={newRecord.contract_value || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, contract_value: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g., 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performance_rating">Performance Rating</Label>
                <NativeSelect
                  id="performance_rating"
                  value={newRecord.performance_rating || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, performance_rating: e.target.value as PerformanceRating || undefined })}
                >
                  <option value="">Select rating...</option>
                  {PERFORMANCE_RATINGS.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pop_start">Period Start</Label>
                <Input
                  id="pop_start"
                  type="date"
                  value={newRecord.pop_start || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, pop_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pop_end">Period End</Label>
                <Input
                  id="pop_end"
                  type="date"
                  value={newRecord.pop_end || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, pop_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="naics_codes">NAICS Codes (comma-separated)</Label>
              <Input
                id="naics_codes"
                value={newRecord.naics_codes?.join(', ') || ''}
                onChange={(e) => setNewRecord({
                  ...newRecord,
                  naics_codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="e.g., 541512, 541511"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRecord.description || ''}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                placeholder="Brief description of work performed..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Past Performance'}
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
            + Add Past Performance
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
