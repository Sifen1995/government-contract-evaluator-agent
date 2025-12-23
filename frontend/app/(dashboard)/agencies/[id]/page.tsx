'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAgency, getAgencyContacts, getAgencyMatchDetail } from '@/lib/agencies'
import { AgencyWithStats, GovernmentContact, MatchScoreBreakdown } from '@/types/agency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AgencyProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [agency, setAgency] = useState<AgencyWithStats | null>(null)
  const [contacts, setContacts] = useState<GovernmentContact[]>([])
  const [matchBreakdown, setMatchBreakdown] = useState<MatchScoreBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadAgencyData = async () => {
      if (!user || !id) return

      try {
        setLoading(true)
        const [agencyData, contactsData, matchData] = await Promise.all([
          getAgency(id),
          getAgencyContacts(id).catch(() => []),
          getAgencyMatchDetail(id).catch(() => null),
        ])

        setAgency(agencyData)
        setContacts(contactsData)
        setMatchBreakdown(matchData)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load agency')
      } finally {
        setLoading(false)
      }
    }

    loadAgencyData()
  }, [user, id])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'osdbu': return 'Small Business Liaison (OSDBU)'
      case 'contracting_officer': return 'Contracting Officer'
      case 'industry_liaison': return 'Industry Liaison'
      case 'small_business_specialist': return 'Small Business Specialist'
      default: return type
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || 'Agency not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>

        {/* Agency Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900">
                  {agency.abbreviation || agency.name}
                </h2>
                {agency.level && (
                  <Badge variant="outline" className="capitalize">
                    {agency.level}
                  </Badge>
                )}
              </div>
              {agency.abbreviation && (
                <p className="text-lg text-gray-600 mt-1">{agency.name}</p>
              )}
            </div>
            {matchBreakdown && (
              <div className={`text-center px-4 py-2 rounded-lg ${getScoreColor(matchBreakdown.score)}`}>
                <div className="text-3xl font-bold">{matchBreakdown.score}%</div>
                <div className="text-sm">Match Score</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Match Score Breakdown */}
            {matchBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Score Breakdown</CardTitle>
                  <CardDescription>How your company matches this agency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>NAICS Alignment</span>
                        <span className="font-medium">{matchBreakdown.factors.naics_alignment}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${matchBreakdown.factors.naics_alignment}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Set-Aside Alignment</span>
                        <span className="font-medium">{matchBreakdown.factors.set_aside_alignment}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${matchBreakdown.factors.set_aside_alignment}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Geographic Fit</span>
                        <span className="font-medium">{matchBreakdown.factors.geographic_fit}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${matchBreakdown.factors.geographic_fit}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Award History Fit</span>
                        <span className="font-medium">{matchBreakdown.factors.award_history_fit}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${matchBreakdown.factors.award_history_fit}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {matchBreakdown.reasoning && (
                    <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {matchBreakdown.reasoning}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Small Business Goals */}
            {(agency.small_business_goal_pct || agency.eight_a_goal_pct || agency.wosb_goal_pct || agency.sdvosb_goal_pct || agency.hubzone_goal_pct) && (
              <Card>
                <CardHeader>
                  <CardTitle>Small Business Goals</CardTitle>
                  <CardDescription>Agency contracting goals for small businesses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {agency.small_business_goal_pct && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{agency.small_business_goal_pct}%</div>
                        <div className="text-xs text-gray-600">Small Business</div>
                      </div>
                    )}
                    {agency.eight_a_goal_pct && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{agency.eight_a_goal_pct}%</div>
                        <div className="text-xs text-gray-600">8(a)</div>
                      </div>
                    )}
                    {agency.wosb_goal_pct && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{agency.wosb_goal_pct}%</div>
                        <div className="text-xs text-gray-600">WOSB</div>
                      </div>
                    )}
                    {agency.sdvosb_goal_pct && (
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{agency.sdvosb_goal_pct}%</div>
                        <div className="text-xs text-gray-600">SDVOSB</div>
                      </div>
                    )}
                    {agency.hubzone_goal_pct && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{agency.hubzone_goal_pct}%</div>
                        <div className="text-xs text-gray-600">HUBZone</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Key Contacts</CardTitle>
                <CardDescription>Agency contacts for small business opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="p-4 border rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">
                          {getContactTypeLabel(contact.contact_type)}
                        </div>
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        {contact.title && (
                          <div className="text-sm text-gray-600">{contact.title}</div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a href={`tel:${contact.phone}`} className="text-gray-600">
                              {contact.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No contacts available for this agency
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agency Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agency.opportunity_count !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500">Active Opportunities</div>
                    <div className="text-2xl font-bold">{agency.opportunity_count}</div>
                  </div>
                )}
                {agency.avg_contract_value !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500">Avg. Contract Value</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(agency.avg_contract_value)}
                    </div>
                  </div>
                )}
                {agency.top_naics_codes && agency.top_naics_codes.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Top NAICS Codes</div>
                    <div className="flex flex-wrap gap-2">
                      {agency.top_naics_codes.map((naics) => (
                        <Badge key={naics} variant="secondary">{naics}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/opportunities?agency=${encodeURIComponent(agency.name)}`)}
                >
                  View Opportunities →
                </Button>
                {agency.small_business_url && (
                  <a
                    href={agency.small_business_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      Small Business Page →
                    </Button>
                  </a>
                )}
                {agency.forecast_url && (
                  <a
                    href={agency.forecast_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      Forecast Page →
                    </Button>
                  </a>
                )}
                {agency.vendor_portal_url && (
                  <a
                    href={agency.vendor_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      Vendor Portal →
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
