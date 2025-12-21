'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getEvaluations, updateEvaluation } from '@/lib/opportunities'
import { EvaluationWithOpportunity } from '@/types/opportunity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PipelineStatus = 'WATCHING' | 'BIDDING' | 'WON' | 'LOST'

interface PipelineColumn {
  status: PipelineStatus
  title: string
  color: string
  bgColor: string
  icon: string
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  { status: 'WATCHING', title: 'Watching', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: '👀' },
  { status: 'BIDDING', title: 'Bidding', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', icon: '📝' },
  { status: 'WON', title: 'Won', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: '🎉' },
  { status: 'LOST', title: 'Lost', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', icon: '❌' },
]

export default function PipelinePage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<EvaluationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadPipeline = async () => {
      if (!user) return

      try {
        // Load all evaluations that have been saved to pipeline
        const data = await getEvaluations({ limit: 100 })
        // Filter to only show those in pipeline
        const pipelineItems = data.evaluations.filter(e => e.user_saved)
        setEvaluations(pipelineItems)
      } catch (error) {
        console.error('Error loading pipeline:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadPipeline()
    }
  }, [user])

  const handleStatusChange = async (evaluationId: string, newStatus: PipelineStatus) => {
    try {
      setUpdating(evaluationId)
      await updateEvaluation(evaluationId, { user_saved: newStatus })

      // Update local state
      setEvaluations(prev =>
        prev.map(e =>
          e.id === evaluationId ? { ...e, user_saved: newStatus } : e
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveFromPipeline = async (evaluationId: string) => {
    if (!confirm('Remove this opportunity from your pipeline?')) return

    try {
      setUpdating(evaluationId)
      await updateEvaluation(evaluationId, { user_saved: null })

      // Remove from local state
      setEvaluations(prev => prev.filter(e => e.id !== evaluationId))
    } catch (error) {
      console.error('Error removing from pipeline:', error)
      alert('Failed to remove from pipeline')
    } finally {
      setUpdating(null)
    }
  }

  const getEvaluationsByStatus = (status: PipelineStatus) => {
    return evaluations.filter(e => e.user_saved === status)
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const isDeadlineSoon = (deadline: string | undefined) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  }

  const isDeadlinePassed = (deadline: string | undefined) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  // Stats
  const totalInPipeline = evaluations.length
  const totalWatching = getEvaluationsByStatus('WATCHING').length
  const totalBidding = getEvaluationsByStatus('BIDDING').length
  const totalWon = getEvaluationsByStatus('WON').length
  const totalLost = getEvaluationsByStatus('LOST').length

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Button variant="ghost" className="text-blue-600">
                  Pipeline
                </Button>
                <Button variant="ghost" onClick={() => router.push('/settings')}>
                  Settings
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pipeline Management</h2>
          <p className="text-gray-600">Track your opportunities through the bidding process</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900">{totalInPipeline}</CardTitle>
              <CardDescription>Total in Pipeline</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">{totalWatching}</CardTitle>
              <CardDescription>Watching</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">{totalBidding}</CardTitle>
              <CardDescription>Bidding</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">{totalWon}</CardTitle>
              <CardDescription>Won</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-gray-600">{totalLost}</CardTitle>
              <CardDescription>Lost</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {totalInPipeline === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">Your pipeline is empty</h3>
              <p className="text-gray-600 mb-4">
                Start by browsing opportunities and saving them to your pipeline
              </p>
              <Button onClick={() => router.push('/opportunities')}>
                Browse Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Kanban Board */
          <div className="grid grid-cols-4 gap-4">
            {PIPELINE_COLUMNS.map((column) => (
              <div key={column.status} className={`rounded-lg border-2 ${column.bgColor} p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{column.icon}</span>
                  <h3 className={`font-semibold ${column.color}`}>
                    {column.title} ({getEvaluationsByStatus(column.status).length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {getEvaluationsByStatus(column.status).map((evaluation) => (
                    <Card
                      key={evaluation.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        updating === evaluation.id ? 'opacity-50' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/opportunities/${evaluation.opportunity_id}`)}
                        >
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {evaluation.opportunity.title}
                          </h4>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                evaluation.recommendation === 'BID'
                                  ? 'default'
                                  : evaluation.recommendation === 'RESEARCH'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {evaluation.recommendation}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {evaluation.fit_score}% fit
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1">
                            <div>{evaluation.opportunity.department}</div>
                            <div className="flex items-center gap-1">
                              <span>Deadline:</span>
                              <span
                                className={
                                  isDeadlinePassed(evaluation.opportunity.response_deadline)
                                    ? 'text-red-600 font-medium'
                                    : isDeadlineSoon(evaluation.opportunity.response_deadline)
                                    ? 'text-orange-600 font-medium'
                                    : ''
                                }
                              >
                                {formatDate(evaluation.opportunity.response_deadline)}
                                {isDeadlinePassed(evaluation.opportunity.response_deadline) && ' (Passed)'}
                                {isDeadlineSoon(evaluation.opportunity.response_deadline) &&
                                  !isDeadlinePassed(evaluation.opportunity.response_deadline) && ' (Soon!)'}
                              </span>
                            </div>
                            <div>Value: {formatCurrency(evaluation.opportunity.contract_value)}</div>
                          </div>

                          {evaluation.user_notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                              <strong>Notes:</strong> {evaluation.user_notes.substring(0, 50)}
                              {evaluation.user_notes.length > 50 && '...'}
                            </div>
                          )}
                        </div>

                        {/* Status Change Buttons */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap gap-1">
                            {column.status !== 'WATCHING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(evaluation.id, 'WATCHING')
                                }}
                                disabled={updating === evaluation.id}
                              >
                                👀
                              </Button>
                            )}
                            {column.status !== 'BIDDING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs px-2 py-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(evaluation.id, 'BIDDING')
                                }}
                                disabled={updating === evaluation.id}
                              >
                                📝
                              </Button>
                            )}
                            {column.status !== 'WON' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs px-2 py-1 h-auto text-green-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(evaluation.id, 'WON')
                                }}
                                disabled={updating === evaluation.id}
                              >
                                🎉
                              </Button>
                            )}
                            {column.status !== 'LOST' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs px-2 py-1 h-auto text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(evaluation.id, 'LOST')
                                }}
                                disabled={updating === evaluation.id}
                              >
                                ❌
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs px-2 py-1 h-auto text-red-600 ml-auto"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFromPipeline(evaluation.id)
                              }}
                              disabled={updating === evaluation.id}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {getEvaluationsByStatus(column.status).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No opportunities
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
