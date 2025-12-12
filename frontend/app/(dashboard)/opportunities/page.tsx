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
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    loadData()
  }, [filter, minFitScore, page, user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      // Load evaluations
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

      const evalResponse = await getEvaluations(params)
      setEvaluations(evalResponse.evaluations)
      setTotal(evalResponse.total)

      // Load stats
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading opportunities:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
      year: 'numeric'
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
                <Button variant="ghost" className="text-blue-600">
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
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Contract Opportunities</h2>
          <p className="text-gray-600">
            AI-evaluated opportunities matched to your company profile
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Evaluated</CardDescription>
                <CardTitle className="text-3xl">{stats.total_evaluations}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>BID Recommendations</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.bid_recommendations}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Fit Score</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {stats.avg_fit_score ? `${stats.avg_fit_score.toFixed(0)}%` : 'N/A'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg Win Probability</CardDescription>
                <CardTitle className="text-3xl text-purple-600">
                  {stats.avg_win_probability ? `${stats.avg_win_probability.toFixed(0)}%` : 'N/A'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation
                </label>
                <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Recommendations</SelectItem>
                    <SelectItem value="BID">BID</SelectItem>
                    <SelectItem value="RESEARCH">RESEARCH</SelectItem>
                    <SelectItem value="NO_BID">NO_BID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Fit Score
                </label>
                <Select value={minFitScore.toString()} onValueChange={(v) => setMinFitScore(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Score</SelectItem>
                    <SelectItem value="50">50% and above</SelectItem>
                    <SelectItem value="60">60% and above</SelectItem>
                    <SelectItem value="70">70% and above</SelectItem>
                    <SelectItem value="80">80% and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadData} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities List */}
        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500 mb-4">No opportunities found</p>
              <p className="text-sm text-gray-400">
                The AI will automatically discover and evaluate opportunities every 15 minutes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card
                key={evaluation.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/opportunities/${evaluation.opportunity.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-6">
                    {/* Left: Scores */}
                    <div className="flex-shrink-0 w-32 space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Fit Score</div>
                        <div className={`text-3xl font-bold ${getScoreColor(evaluation.fit_score)}`}>
                          {evaluation.fit_score}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Win Prob</div>
                        <div className={`text-2xl font-semibold ${getScoreColor(evaluation.win_probability)}`}>
                          {evaluation.win_probability}%
                        </div>
                      </div>
                      <Badge className={getRecommendationColor(evaluation.recommendation)}>
                        {evaluation.recommendation}
                      </Badge>
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {evaluation.opportunity.title}
                      </h3>

                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        {evaluation.opportunity.department && (
                          <span>🏛️ {evaluation.opportunity.department}</span>
                        )}
                        {evaluation.opportunity.naics_code && (
                          <span>📊 NAICS {evaluation.opportunity.naics_code}</span>
                        )}
                        {evaluation.opportunity.set_aside && (
                          <span>🎯 {evaluation.opportunity.set_aside}</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {evaluation.opportunity.description}
                      </p>

                      {evaluation.strengths && evaluation.strengths.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-green-600">Strengths: </span>
                          <span className="text-xs text-gray-600">
                            {evaluation.strengths.slice(0, 2).join(' • ')}
                            {evaluation.strengths.length > 2 && ` +${evaluation.strengths.length - 2} more`}
                          </span>
                        </div>
                      )}

                      {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-red-600">Weaknesses: </span>
                          <span className="text-xs text-gray-600">
                            {evaluation.weaknesses.slice(0, 2).join(' • ')}
                            {evaluation.weaknesses.length > 2 && ` +${evaluation.weaknesses.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Metadata */}
                    <div className="flex-shrink-0 w-48 text-sm">
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500">Deadline</div>
                          <div className="font-medium">
                            {formatDate(evaluation.opportunity.response_deadline)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Location</div>
                          <div>
                            {evaluation.opportunity.place_of_performance_city}, {evaluation.opportunity.place_of_performance_state || 'N/A'}
                          </div>
                        </div>
                        {evaluation.opportunity.contract_value && (
                          <div>
                            <div className="text-xs text-gray-500">Contract Value</div>
                            <div className="font-medium">
                              {formatCurrency(evaluation.opportunity.contract_value)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {page + 1} of {Math.ceil(total / limit)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
