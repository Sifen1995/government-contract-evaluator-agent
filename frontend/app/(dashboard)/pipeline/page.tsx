'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getEvaluations, updateEvaluation } from '@/lib/opportunities'
import { EvaluationWithOpportunity } from '@/types/opportunity'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Grid,
  Badge,
  Flex,
  Metric,
  ProgressBar,
  Button,
} from '@tremor/react'
import {
  Eye,
  FileEdit,
  Trophy,
  XCircle,
  Trash2,
  Clock,
  DollarSign,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

type PipelineStatus = 'WATCHING' | 'BIDDING' | 'WON' | 'LOST'

interface PipelineColumn {
  status: PipelineStatus
  title: string
  icon: typeof Eye
  color: 'blue' | 'violet' | 'emerald' | 'slate'
  bgClass: string
  borderClass: string
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    status: 'WATCHING',
    title: 'Watching',
    icon: Eye,
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  {
    status: 'BIDDING',
    title: 'Bidding',
    icon: FileEdit,
    color: 'violet',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
  },
  {
    status: 'WON',
    title: 'Won',
    icon: Trophy,
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  {
    status: 'LOST',
    title: 'Lost',
    icon: XCircle,
    color: 'slate',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
  },
]

export default function PipelinePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<EvaluationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const loadPipeline = async () => {
      if (!user) return

      try {
        const data = await getEvaluations({ limit: 100 })
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
      setEvaluations(prev =>
        prev.map(e =>
          e.id === evaluationId ? { ...e, user_saved: newStatus } : e
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveFromPipeline = async (evaluationId: string) => {
    try {
      setUpdating(evaluationId)
      await updateEvaluation(evaluationId, { user_saved: null })
      setEvaluations(prev => prev.filter(e => e.id !== evaluationId))
    } catch (error) {
      console.error('Error removing from pipeline:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getEvaluationsByStatus = (status: PipelineStatus) => {
    return evaluations.filter(e => e.user_saved === status)
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'TBD'
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  const getDaysUntilDeadline = (deadline: string | undefined) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (!user) return null

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <Text className="text-gray-600">Loading your pipeline...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  const totalInPipeline = evaluations.length
  const stats = {
    watching: getEvaluationsByStatus('WATCHING').length,
    bidding: getEvaluationsByStatus('BIDDING').length,
    won: getEvaluationsByStatus('WON').length,
    lost: getEvaluationsByStatus('LOST').length,
  }
  const winRate = stats.won + stats.lost > 0
    ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(0)
    : null

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Flex justifyContent="between" alignItems="end">
            <div>
              <Title className="text-3xl font-bold text-gray-900">
                Pipeline Management
              </Title>
              <Text className="mt-1 text-gray-600">
                Track your opportunities through the bidding process
              </Text>
            </div>
            {winRate && (
              <Card className="px-4 py-2" decoration="left" decorationColor="emerald">
                <Flex className="gap-2" alignItems="center">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                  <div>
                    <Text className="text-xs">Win Rate</Text>
                    <Text className="font-bold text-emerald-600">{winRate}%</Text>
                  </div>
                </Flex>
              </Card>
            )}
          </Flex>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Grid numItemsSm={2} numItemsLg={5} className="gap-4">
            <Card decoration="top" decorationColor="gray">
              <Text>Total in Pipeline</Text>
              <Metric>{totalInPipeline}</Metric>
            </Card>
            {PIPELINE_COLUMNS.map((col) => (
              <Card key={col.status} decoration="top" decorationColor={col.color}>
                <Flex alignItems="start">
                  <div>
                    <Text>{col.title}</Text>
                    <Metric className={`text-${col.color}-600`}>
                      {getEvaluationsByStatus(col.status).length}
                    </Metric>
                  </div>
                  <col.icon className={`h-6 w-6 text-${col.color}-500`} />
                </Flex>
              </Card>
            ))}
          </Grid>
        </motion.div>

        {totalInPipeline === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center py-16">
              <div className="text-6xl mb-6">📋</div>
              <Title>Your pipeline is empty</Title>
              <Text className="text-gray-500 mt-2 mb-6">
                Start by browsing opportunities and saving them to your pipeline
              </Text>
              <Button
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => router.push('/opportunities')}
              >
                Browse Opportunities
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
              {PIPELINE_COLUMNS.map((column, columnIndex) => (
                <motion.div
                  key={column.status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * columnIndex }}
                  className={`rounded-xl border-2 ${column.bgClass} ${column.borderClass} p-4 min-h-[400px]`}
                >
                  <Flex alignItems="center" className="mb-4 gap-2">
                    <column.icon className={`h-5 w-5 text-${column.color}-600`} />
                    <Title className={`text-${column.color}-700`}>
                      {column.title}
                    </Title>
                    <Badge color={column.color} size="sm">
                      {getEvaluationsByStatus(column.status).length}
                    </Badge>
                  </Flex>

                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {getEvaluationsByStatus(column.status).map((evaluation) => {
                        const daysLeft = getDaysUntilDeadline(evaluation.opportunity.response_deadline)
                        const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
                        const isPast = daysLeft !== null && daysLeft < 0

                        return (
                          <motion.div
                            key={evaluation.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            whileHover={{ scale: 1.02 }}
                            className={updating === evaluation.id ? 'opacity-50' : ''}
                          >
                            <Card
                              className={`cursor-pointer transition-shadow hover:shadow-lg ${
                                isUrgent ? 'ring-2 ring-amber-400' : ''
                              } ${isPast ? 'opacity-60' : ''}`}
                            >
                              <div
                                onClick={() => router.push(`/opportunities/${evaluation.opportunity_id}`)}
                              >
                                <Text className="font-medium line-clamp-2 mb-2">
                                  {evaluation.opportunity.title}
                                </Text>

                                <Flex className="gap-2 mb-2">
                                  <Badge
                                    color={
                                      evaluation.recommendation === 'BID' ? 'emerald' :
                                      evaluation.recommendation === 'RESEARCH' ? 'amber' : 'rose'
                                    }
                                    size="xs"
                                  >
                                    {evaluation.recommendation}
                                  </Badge>
                                  <Badge color="gray" size="xs">
                                    {evaluation.fit_score}%
                                  </Badge>
                                </Flex>

                                <div className="space-y-1 text-xs">
                                  {evaluation.opportunity.department && (
                                    <Flex className="gap-1">
                                      <Building2 className="h-3 w-3 text-gray-400" />
                                      <Text className="truncate text-gray-600">
                                        {evaluation.opportunity.department}
                                      </Text>
                                    </Flex>
                                  )}
                                  <Flex className="gap-1">
                                    <Clock className={`h-3 w-3 ${isPast ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-gray-400'}`} />
                                    <Text className={isPast ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'}>
                                      {formatDate(evaluation.opportunity.response_deadline)}
                                      {isPast && ' (Passed)'}
                                      {isUrgent && !isPast && ` (${daysLeft}d left)`}
                                    </Text>
                                  </Flex>
                                  <Flex className="gap-1">
                                    <DollarSign className="h-3 w-3 text-emerald-500" />
                                    <Text className="text-emerald-600 font-medium">
                                      {formatCurrency(evaluation.opportunity.contract_value)}
                                    </Text>
                                  </Flex>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <Flex justifyContent="between">
                                  <Flex className="gap-1">
                                    {PIPELINE_COLUMNS.filter(c => c.status !== column.status).slice(0, 2).map((targetCol) => (
                                      <button
                                        key={targetCol.status}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStatusChange(evaluation.id, targetCol.status)
                                        }}
                                        disabled={updating === evaluation.id}
                                        className={`p-1.5 rounded-lg hover:bg-${targetCol.color}-100 transition-colors`}
                                        title={`Move to ${targetCol.title}`}
                                      >
                                        <targetCol.icon className={`h-4 w-4 text-${targetCol.color}-600`} />
                                      </button>
                                    ))}
                                  </Flex>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveFromPipeline(evaluation.id)
                                    }}
                                    disabled={updating === evaluation.id}
                                    className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Remove from pipeline"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                </Flex>
                              </div>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {getEvaluationsByStatus(column.status).length === 0 && (
                      <div className="text-center py-8">
                        <Text className="text-gray-400 text-sm">
                          No opportunities
                        </Text>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </Grid>
          </motion.div>
        )}
    </main>
  )
}
