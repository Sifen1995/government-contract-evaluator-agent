'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getOpportunity, updateEvaluation } from '@/lib/opportunities'
import { OpportunityWithEvaluation } from '@/types/opportunity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OpportunityDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [opportunity, setOpportunity] = useState<OpportunityWithEvaluation | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userSaved, setUserSaved] = useState<string | null>(null)
  const [userNotes, setUserNotes] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    loadOpportunity()
  }, [id, user])

  const loadOpportunity = async () => {
    if (!user || !id) return

    try {
      setLoadingData(true)
      const data = await getOpportunity(id)
      setOpportunity(data)

      if (data.evaluation) {
        setUserSaved(data.evaluation.user_saved || null)
        setUserNotes(data.evaluation.user_notes || '')
      }
    } catch (error) {
      console.error('Error loading opportunity:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async () => {
    if (!opportunity?.evaluation) return

    try {
      setSaving(true)
      await updateEvaluation(opportunity.evaluation.id, {
        user_saved: userSaved as any,
        user_notes: userNotes
      })
      alert('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity not found</h2>
          <Button onClick={() => router.push('/opportunities')}>Back to Opportunities</Button>
        </div>
      </div>
    )
  }

  const evaluation = opportunity.evaluation

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BID':
        return 'bg-green-100 text-green-800'
      case 'NO_BID':
        return 'bg-red-100 text-red-800'
      case 'RESEARCH':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">GovAI</h1>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                  Opportunities
                </Button>
                <Button variant="ghost" onClick={() => router.push('/pipeline')}>
                  Pipeline
                </Button>
                <Button variant="ghost" onClick={() => router.push('/settings')}>
                  Settings
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/opportunities')}>
            ← Back to Opportunities
          </Button>
        </div>

        {/* AI Evaluation Summary */}
        {evaluation && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">AI Evaluation</CardTitle>
                  <CardDescription>Powered by GPT-4</CardDescription>
                </div>
                <Badge className={`${getRecommendationColor(evaluation.recommendation)} text-lg px-4 py-2`}>
                  {evaluation.recommendation}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Fit Score</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-blue-600">{evaluation.fit_score}</span>
                    <span className="text-2xl text-gray-500">/ 100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${evaluation.fit_score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Win Probability</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-purple-600">{evaluation.win_probability}</span>
                    <span className="text-2xl text-gray-500">%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${evaluation.win_probability}%` }}
                    />
                  </div>
                </div>
              </div>

              {evaluation.reasoning && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{evaluation.reasoning}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✓ Strengths</h4>
                    <ul className="space-y-1">
                      {evaluation.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-green-800">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">✗ Weaknesses</h4>
                    <ul className="space-y-1">
                      {evaluation.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm text-red-800">• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.key_requirements && evaluation.key_requirements.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Key Requirements</h4>
                    <ul className="space-y-1">
                      {evaluation.key_requirements.map((req, i) => (
                        <li key={i} className="text-sm text-blue-800">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.missing_capabilities && evaluation.missing_capabilities.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">⚠️ Missing Capabilities</h4>
                    <ul className="space-y-1">
                      {evaluation.missing_capabilities.map((cap, i) => (
                        <li key={i} className="text-sm text-orange-800">• {cap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.risk_factors && evaluation.risk_factors.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚡ Risk Factors</h4>
                    <ul className="space-y-1">
                      {evaluation.risk_factors.map((risk, i) => (
                        <li key={i} className="text-sm text-yellow-800">• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Opportunity Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
                <CardDescription>Notice ID: {opportunity.notice_id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{opportunity.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Agency Information</h4>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="text-gray-500 inline">Department: </dt>
                        <dd className="inline font-medium">{opportunity.department || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 inline">Sub-Tier: </dt>
                        <dd className="inline font-medium">{opportunity.sub_tier || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 inline">Office: </dt>
                        <dd className="inline font-medium">{opportunity.office || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Classification</h4>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="text-gray-500 inline">NAICS: </dt>
                        <dd className="inline font-medium">{opportunity.naics_code || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 inline">PSC: </dt>
                        <dd className="inline font-medium">{opportunity.psc_code || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 inline">Set-Aside: </dt>
                        <dd className="inline font-medium">{opportunity.set_aside || 'None'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 inline">Type: </dt>
                        <dd className="inline font-medium">{opportunity.type || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {opportunity.link && (
                  <div>
                    <a
                      href={opportunity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 w-full"
                    >
                      View on SAM.gov →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {opportunity.primary_contact_name && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium">{opportunity.primary_contact_name}</dd>
                    </div>
                    {opportunity.primary_contact_email && (
                      <div>
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium">{opportunity.primary_contact_email}</dd>
                      </div>
                    )}
                    {opportunity.primary_contact_phone && (
                      <div>
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium">{opportunity.primary_contact_phone}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Posted</div>
                  <div className="font-medium">{formatDate(opportunity.posted_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Response Deadline</div>
                  <div className="font-medium text-red-600">{formatDate(opportunity.response_deadline)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Place of Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {opportunity.place_of_performance_city && (
                    <div>{opportunity.place_of_performance_city}</div>
                  )}
                  {opportunity.place_of_performance_state && (
                    <div>{opportunity.place_of_performance_state}</div>
                  )}
                  {opportunity.place_of_performance_zip && (
                    <div>{opportunity.place_of_performance_zip}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Value */}
            {opportunity.contract_value && (
              <Card>
                <CardHeader>
                  <CardTitle>Contract Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(opportunity.contract_value)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pipeline Management */}
            {evaluation && (
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select value={userSaved || 'NONE'} onValueChange={(v) => setUserSaved(v === 'NONE' ? null : v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Not Saved</SelectItem>
                        <SelectItem value="WATCHING">👀 Watching</SelectItem>
                        <SelectItem value="BIDDING">📝 Bidding</SelectItem>
                        <SelectItem value="PASSED">✋ Passed</SelectItem>
                        <SelectItem value="WON">🎉 Won</SelectItem>
                        <SelectItem value="LOST">❌ Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <Textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Add your notes about this opportunity..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
