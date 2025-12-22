'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getEvaluations, getStats } from '@/lib/opportunities'
import { EvaluationWithOpportunity, OpportunityStats } from '@/types/opportunity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OpportunitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [evaluations, setEvaluations] = useState<EvaluationWithOpportunity[]>([])
  const [stats, setStats] = useState<OpportunityStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const [filter, setFilter] = useState<'ALL' | 'BID' | 'NO_BID' | 'RESEARCH'>('ALL')
  const [minFitScore, setMinFitScore] = useState<number>(0)
  const [sourceFilter, setSourceFilter] = useState<'LIVE' | 'FORECAST'>('LIVE')

  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 20

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  /* ---------------- DATA LOADER ---------------- */
  useEffect(() => {
    loadData()
  }, [filter, minFitScore, page, sourceFilter, user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      const params: any = {
        skip: page * limit,
        limit,
      }

      if (filter !== 'ALL') {
        params.recommendation = filter
      }

      if (minFitScore > 0) {
        params.min_fit_score = minFitScore
      }

      // Forecast vs Live filtering
      params.is_forecast = sourceFilter === 'FORECAST'

      const evalResponse = await getEvaluations(params)
      setEvaluations(evalResponse.evaluations)
      setTotal(evalResponse.total)

      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading opportunities:', error)
    } finally {
      setLoadingData(false)
    }
  }

  /* ---------------- HELPERS ---------------- */
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getSourceBadge = (opportunity: any) => {
    if (opportunity.is_forecast) {
      return (
        <Badge variant="outline" className="border-orange-400 text-orange-600">
          Forecast
        </Badge>
      )
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

  /* ---------------- LOADING ---------------- */
  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold">GovAI</h1>
            <span className="text-sm text-gray-700">{user?.email}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Contract Opportunities</h2>
          <p className="text-gray-600">
            AI-evaluated opportunities matched to your company
          </p>
        </div>

        {/* SOURCE TABS */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={sourceFilter === 'LIVE' ? 'default' : 'outline'}
            onClick={() => setSourceFilter('LIVE')}
          >
            Live Opportunities
          </Button>
          <Button
            variant={sourceFilter === 'FORECAST' ? 'default' : 'outline'}
            onClick={() => setSourceFilter('FORECAST')}
          >
            Upcoming Forecasts
          </Button>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardDescription>Total Evaluated</CardDescription>
                <CardTitle className="text-3xl">{stats.total_evaluations}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>BID Recommendations</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.bid_recommendations}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Avg Fit Score</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {stats.avg_fit_score?.toFixed(0) || 'N/A'}%
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Avg Win Probability</CardDescription>
                <CardTitle className="text-3xl text-purple-600">
                  {stats.avg_win_probability?.toFixed(0) || 'N/A'}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* OPPORTUNITY LIST */}
        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              className="hover:shadow-lg transition cursor-pointer"
              onClick={() => {
                if (!evaluation.opportunity.is_forecast) {
                  router.push(`/opportunities/${evaluation.opportunity.id}`)
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex gap-6">
                  {/* SCORES */}
                  <div className="w-32 space-y-2">
                    <div className={`text-3xl font-bold ${getScoreColor(evaluation.fit_score)}`}>
                      {evaluation.fit_score}%
                    </div>
                    <Badge className={getRecommendationColor(evaluation.recommendation)}>
                      {evaluation.recommendation}
                    </Badge>
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {evaluation.opportunity.title}
                    </h3>

                    <div className="flex gap-3 flex-wrap mb-3 text-sm">
                      {getSourceBadge(evaluation.opportunity)}
                      {evaluation.opportunity.department && (
                        <span>🏛️ {evaluation.opportunity.department}</span>
                      )}
                      {evaluation.opportunity.naics_code && (
                        <span>📊 NAICS {evaluation.opportunity.naics_code}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {evaluation.opportunity.description}
                    </p>
                  </div>

                  {/* META */}
                  <div className="w-48 text-sm space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">Deadline</div>
                      {formatDate(evaluation.opportunity.response_deadline)}
                    </div>
                    {evaluation.opportunity.contract_value && (
                      <div>
                        <div className="text-xs text-gray-500">Value</div>
                        {formatCurrency(evaluation.opportunity.contract_value)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
