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
import { OpportunityContacts } from '@/components/agencies'
import { StaleEvaluationBanner } from '@/components/rescoring'

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
    if (!loading && !user) router.push('/login')
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
    } catch (err) {
      console.error('Error loading opportunity:', err)
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
        user_notes: userNotes,
      })
      alert('Changes saved successfully!')
    } catch {
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => router.push('/opportunities')}>Back to Opportunities</Button>
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

  const getSourceBadge = () => {
    if (opportunity.is_forecast) {
      return <Badge className="border-orange-400 text-orange-600" variant="outline">Forecast</Badge>
    }
    switch (opportunity.source) {
      case 'sam.gov':
        return <Badge className="bg-blue-100 text-blue-800">Federal</Badge>
      case 'dc_ocp':
        return <Badge className="bg-purple-100 text-purple-800">DC</Badge>
      default:
        return <Badge variant="secondary">Other</Badge>
    }
  }

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'

  const formatCurrency = (v?: number) =>
    v
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(v)
      : 'N/A'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GovAI</h1>
          <Button variant="ghost" onClick={() => router.push('/opportunities')}>
            Opportunities
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/opportunities')}>
          ← Back
        </Button>

        {/* AI Evaluation */}
        {evaluation && (
          <>
            <StaleEvaluationBanner
              evaluationId={evaluation.id}
              isStale={(evaluation as any).is_stale || false}
              onRefreshComplete={() => loadOpportunity()}
            />
            <Card className="my-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>AI Evaluation</CardTitle>
                    <CardDescription>Automated scoring</CardDescription>
                  </div>
                  <Badge className={getRecommendationColor(evaluation.recommendation)}>
                    {evaluation.recommendation}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Fit Score</div>
                    <div className="text-4xl font-bold">{evaluation.fit_score}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Win Probability</div>
                    <div className="text-4xl font-bold">{evaluation.win_probability}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{opportunity.title}</CardTitle>
                <div className="mt-2 flex gap-2">{getSourceBadge()}</div>
                <CardDescription>Notice ID: {opportunity.notice_id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">{opportunity.description}</p>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div><dt>Department</dt><dd>{opportunity.department || 'N/A'}</dd></div>
                  <div><dt>NAICS</dt><dd>{opportunity.naics_code || 'N/A'}</dd></div>
                  {opportunity.issuing_agency && (
                    <div><dt>Issuing Agency</dt><dd>{opportunity.issuing_agency}</dd></div>
                  )}
                </dl>

                {opportunity.link && (
                  <a
                    href={opportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full justify-center rounded-md border px-4 py-2 text-sm"
                  >
                    View Source →
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Posted: {formatDate(opportunity.posted_date)}</div>
                <div className="text-red-600">
                  Deadline: {formatDate(opportunity.response_deadline)}
                </div>
              </CardContent>
            </Card>

            {opportunity.contract_value && (
              <Card>
                <CardHeader><CardTitle>Contract Value</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold text-green-600">
                  {formatCurrency(opportunity.contract_value)}
                </CardContent>
              </Card>
            )}

            {/* PIPELINE */}
            {!opportunity.is_forecast && evaluation && (
              <Card>
                <CardHeader><CardTitle>Pipeline</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={userSaved || 'NONE'} onValueChange={(v) => setUserSaved(v === 'NONE' ? null : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Not Saved</SelectItem>
                      <SelectItem value="WATCHING">Watching</SelectItem>
                      <SelectItem value="BIDDING">Bidding</SelectItem>
                      <SelectItem value="PASSED">Passed</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Notes..."
                  />

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {opportunity.is_forecast && (
              <Card className="bg-orange-50 border-orange-300">
                <CardContent className="text-sm text-orange-800">
                  This is a forecast opportunity and cannot be added to the pipeline.
                </CardContent>
              </Card>
            )}

            {/* Recommended Contacts */}
            <OpportunityContacts
              opportunityId={id}
              contractingOfficer={{
                name: opportunity.primary_contact_name,
                email: opportunity.primary_contact_email,
                phone: opportunity.primary_contact_phone,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
