'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAgencies, getRecommendedAgencies } from '@/lib/agencies'
import { AgencyWithStats, AgencyWithMatch } from '@/types/agency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AgenciesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [recommendedAgencies, setRecommendedAgencies] = useState<AgencyWithMatch[]>([])
  const [allAgencies, setAllAgencies] = useState<AgencyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadAgencies = async () => {
      if (!user) return

      try {
        setLoading(true)
        const [recommended, all] = await Promise.all([
          getRecommendedAgencies({ limit: 20 }).catch(() => ({ agencies: [] })),
          getAgencies({ limit: 50 }).catch(() => ({ agencies: [], total: 0 })),
        ])

        setRecommendedAgencies(recommended.agencies || [])
        setAllAgencies(all.agencies || [])
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load agencies')
      } finally {
        setLoading(false)
      }
    }

    loadAgencies()
  }, [user])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const filteredAgencies = allAgencies.filter(agency =>
    agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agency.abbreviation && agency.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
                <Button variant="ghost" className="font-semibold">
                  Agencies
                </Button>
                <Button variant="ghost" onClick={() => router.push('/settings')}>
                  Settings
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" onClick={() => {
                localStorage.removeItem('token')
                router.push('/login')
              }}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Agency Matching</h2>
          <p className="text-gray-600">Find agencies that match your company's capabilities</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'recommended' ? 'default' : 'outline'}
            onClick={() => setActiveTab('recommended')}
          >
            Recommended for You
          </Button>
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
          >
            All Agencies
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activeTab === 'recommended' ? (
          <>
            {recommendedAgencies.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedAgencies.map((agency) => (
                  <Card
                    key={agency.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/agencies/${agency.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {agency.abbreviation || agency.name}
                          </CardTitle>
                          {agency.abbreviation && (
                            <CardDescription className="text-sm">
                              {agency.name}
                            </CardDescription>
                          )}
                        </div>
                        {agency.match_score !== undefined && (
                          <div className={`px-3 py-1 rounded-lg ${getScoreColor(agency.match_score)}`}>
                            <span className="font-bold">{agency.match_score}%</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agency.level && (
                          <Badge variant="outline" className="capitalize">
                            {agency.level}
                          </Badge>
                        )}
                        {agency.opportunity_count !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Active Opportunities</span>
                            <span className="font-medium">{agency.opportunity_count}</span>
                          </div>
                        )}
                        {agency.avg_contract_value !== undefined && agency.avg_contract_value > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Avg. Contract Value</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(agency.avg_contract_value)}
                            </span>
                          </div>
                        )}
                        {agency.match_reason && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {agency.match_reason}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-4xl mb-4">🏛️</div>
                  <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Complete your company profile to get personalized agency recommendations based on your NAICS codes, certifications, and capabilities.
                  </p>
                  <Button onClick={() => router.push('/settings')}>
                    Complete Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search agencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {filteredAgencies.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgencies.map((agency) => (
                  <Card
                    key={agency.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/agencies/${agency.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {agency.abbreviation || agency.name}
                      </CardTitle>
                      {agency.abbreviation && (
                        <CardDescription className="text-sm">
                          {agency.name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agency.level && (
                          <Badge variant="outline" className="capitalize">
                            {agency.level}
                          </Badge>
                        )}
                        {agency.opportunity_count !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Active Opportunities</span>
                            <span className="font-medium">{agency.opportunity_count}</span>
                          </div>
                        )}
                        {agency.avg_contract_value !== undefined && agency.avg_contract_value > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Avg. Contract Value</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(agency.avg_contract_value)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {searchQuery ? 'No agencies match your search' : 'No agencies available'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
