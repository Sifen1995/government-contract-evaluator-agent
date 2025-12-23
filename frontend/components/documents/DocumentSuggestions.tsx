'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getDocumentSuggestions,
  applyDocumentSuggestions,
  markSuggestionsReviewed,
  DocumentSuggestionsResponse,
  ApplySuggestionsRequest,
} from '@/lib/documents'

interface DocumentSuggestionsProps {
  documentId: string
  onApplied?: () => void
  onDismiss?: () => void
}

export function DocumentSuggestions({ documentId, onApplied, onDismiss }: DocumentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<DocumentSuggestionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Selected items
  const [selectedNaics, setSelectedNaics] = useState<Set<string>>(new Set())
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set())
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [includeCapabilities, setIncludeCapabilities] = useState(true)
  const [appendCapabilities, setAppendCapabilities] = useState(true)

  useEffect(() => {
    loadSuggestions()
  }, [documentId])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDocumentSuggestions(documentId)
      setSuggestions(data)

      // Pre-select all items
      setSelectedNaics(new Set(data.naics_codes.map(n => n.code)))
      setSelectedCerts(new Set(data.certifications.map(c => c.certification_type)))
      setSelectedLocations(new Set(data.locations))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!suggestions) return

    try {
      setApplying(true)
      setError(null)

      const request: ApplySuggestionsRequest = {}

      if (selectedNaics.size > 0) {
        request.naics_codes = Array.from(selectedNaics)
      }

      if (selectedCerts.size > 0) {
        request.certifications = Array.from(selectedCerts)
      }

      if (includeCapabilities && suggestions.capabilities) {
        request.capabilities = suggestions.capabilities
        request.append_capabilities = appendCapabilities
      }

      if (selectedLocations.size > 0) {
        request.geographic_preferences = Array.from(selectedLocations)
      }

      const result = await applyDocumentSuggestions(documentId, request)
      setSuccess(result.message)
      onApplied?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to apply suggestions')
    } finally {
      setApplying(false)
    }
  }

  const handleDismiss = async () => {
    try {
      await markSuggestionsReviewed(documentId)
      onDismiss?.()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dismiss')
    }
  }

  const toggleNaics = (code: string) => {
    const newSet = new Set(selectedNaics)
    if (newSet.has(code)) {
      newSet.delete(code)
    } else {
      newSet.add(code)
    }
    setSelectedNaics(newSet)
  }

  const toggleCert = (type: string) => {
    const newSet = new Set(selectedCerts)
    if (newSet.has(type)) {
      newSet.delete(type)
    } else {
      newSet.add(type)
    }
    setSelectedCerts(newSet)
  }

  const toggleLocation = (state: string) => {
    const newSet = new Set(selectedLocations)
    if (newSet.has(state)) {
      newSet.delete(state)
    } else {
      newSet.add(state)
    }
    setSelectedLocations(newSet)
  }

  const selectAll = () => {
    if (!suggestions) return
    setSelectedNaics(new Set(suggestions.naics_codes.map(n => n.code)))
    setSelectedCerts(new Set(suggestions.certifications.map(c => c.certification_type)))
    setSelectedLocations(new Set(suggestions.locations))
    setIncludeCapabilities(true)
  }

  const selectNone = () => {
    setSelectedNaics(new Set())
    setSelectedCerts(new Set())
    setSelectedLocations(new Set())
    setIncludeCapabilities(false)
  }

  const getOcrQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'bg-green-100 text-green-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-500">Loading suggestions...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !suggestions) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadSuggestions} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.extraction_status !== 'completed') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">
            {suggestions?.extraction_status === 'pending' && 'Document extraction is pending...'}
            {suggestions?.extraction_status === 'processing' && 'Document is being processed...'}
            {suggestions?.extraction_status === 'failed' && 'Document extraction failed'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasSuggestions =
    suggestions.naics_codes.length > 0 ||
    suggestions.certifications.length > 0 ||
    suggestions.capabilities ||
    suggestions.locations.length > 0

  if (!hasSuggestions) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No suggestions extracted from this document</p>
          <Button variant="outline" onClick={handleDismiss} className="mt-4">
            Dismiss
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Extracted Suggestions</CardTitle>
            <CardDescription>Review and apply to your company profile</CardDescription>
          </div>
          <div className="flex gap-2">
            {suggestions.is_scanned && suggestions.ocr_quality && (
              <Badge className={getOcrQualityColor(suggestions.ocr_quality)}>
                OCR: {suggestions.ocr_quality}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">{success}</div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 text-sm">
          <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
          <Button variant="outline" size="sm" onClick={selectNone}>Select None</Button>
        </div>

        {/* NAICS Codes */}
        {suggestions.naics_codes.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">NAICS Codes ({suggestions.naics_codes.length})</h4>
            <div className="space-y-2">
              {suggestions.naics_codes.map((naics) => (
                <label key={naics.code} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedNaics.has(naics.code)}
                    onCheckedChange={() => toggleNaics(naics.code)}
                  />
                  <span className="font-mono text-sm">{naics.code}</span>
                  {naics.description && (
                    <span className="text-gray-500 text-sm">- {naics.description}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {suggestions.certifications.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Certifications ({suggestions.certifications.length})</h4>
            <div className="space-y-2">
              {suggestions.certifications.map((cert) => (
                <label key={cert.certification_type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedCerts.has(cert.certification_type)}
                    onCheckedChange={() => toggleCert(cert.certification_type)}
                  />
                  <Badge variant="secondary">{cert.certification_type}</Badge>
                  {cert.expiration_date && (
                    <span className="text-gray-500 text-sm">Expires: {cert.expiration_date}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities */}
        {suggestions.capabilities && (
          <div>
            <h4 className="font-medium mb-2">Capabilities</h4>
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={includeCapabilities}
                onCheckedChange={(checked) => setIncludeCapabilities(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {suggestions.capabilities}
                </p>
                {includeCapabilities && (
                  <label className="flex items-center gap-2 mt-2 text-sm">
                    <Checkbox
                      checked={appendCapabilities}
                      onCheckedChange={(checked) => setAppendCapabilities(!!checked)}
                    />
                    <span>Append to existing capabilities (vs. replace)</span>
                  </label>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Locations */}
        {suggestions.locations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Geographic Locations ({suggestions.locations.length})</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.locations.map((state) => (
                <label key={state} className="flex items-center gap-1 cursor-pointer">
                  <Checkbox
                    checked={selectedLocations.has(state)}
                    onCheckedChange={() => toggleLocation(state)}
                  />
                  <Badge variant="outline">{state}</Badge>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* OCR Warning */}
        {suggestions.is_scanned && suggestions.ocr_quality === 'poor' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
            <strong>Low OCR Quality:</strong> The document appears to be a scanned image with low text quality.
            Consider re-uploading a clearer scan or a text-based PDF for better results.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button
            onClick={handleApply}
            disabled={applying || (selectedNaics.size === 0 && selectedCerts.size === 0 && !includeCapabilities && selectedLocations.size === 0)}
          >
            {applying ? 'Applying...' : 'Apply Selected'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DocumentSuggestions
