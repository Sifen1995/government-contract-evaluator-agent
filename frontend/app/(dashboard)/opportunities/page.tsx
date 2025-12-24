'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getEvaluations, getStats } from '@/lib/opportunities'
import { EvaluationWithOpportunity, OpportunityStats } from '@/types/opportunity'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Grid,
  Badge,
  Flex,
  Metric,
  ProgressBar,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react'
import {
  Search,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  Clock,
  ExternalLink,
  Filter,
  Sparkles,
} from 'lucide-react'

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [evaluations, setEvaluations] = useState<EvaluationWithOpportunity[]>([])
  const [stats, setStats] = useState<OpportunityStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [filter, setFilter] = useState<'ALL' | 'BID' | 'NO_BID' | 'RESEARCH'>('ALL')
  const [sourceFilter, setSourceFilter] = useState<number>(0) // 0 = Live, 1 = Forecast

  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Check for filter from URL
  useEffect(() => {
    const urlFilter = searchParams.get('filter')
    if (urlFilter === 'BID' || urlFilter === 'NO_BID' || urlFilter === 'RESEARCH') {
      setFilter(urlFilter)
    }
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [filter, page, sourceFilter, user])

  const loadData = async () => {
    if (!user) return

    try {
      setLoadingData(true)

      const params: any = {
        skip: page * limit,
        limit,
        is_forecast: sourceFilter === 1,
      }

      if (filter !== 'ALL') {
        params.recommendation = filter
      }

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

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'BID':
        return <Badge color="emerald" size="lg">BID</Badge>
      case 'NO_BID':
        return <Badge color="rose" size="lg">NO BID</Badge>
      case 'RESEARCH':
        return <Badge color="amber" size="lg">RESEARCH</Badge>
      default:
        return <Badge color="gray" size="lg">{rec}</Badge>
    }
  }

  const getScoreColor = (score: number): "emerald" | "amber" | "rose" => {
    if (score >= 70) return 'emerald'
    if (score >= 50) return 'amber'
    return 'rose'
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
    if (!value) return 'TBD'
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const filteredEvaluations = evaluations.filter(e =>
    searchQuery === '' ||
    e.opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.opportunity.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.opportunity.naics_code?.includes(searchQuery)
  )

  if (!user) return null

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Title className="text-3xl font-bold text-gray-900">
            Contract Opportunities
          </Title>
          <Text className="mt-1 text-gray-600">
            AI-evaluated opportunities matched to your company profile
          </Text>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
            <Card decoration="top" decorationColor="blue">
              <Text>Total Evaluated</Text>
              <Metric>{stats?.total_evaluations || 0}</Metric>
            </Card>
            <Card decoration="top" decorationColor="emerald">
              <Flex alignItems="start">
                <div>
                  <Text>BID Recommendations</Text>
                  <Metric className="text-emerald-600">{stats?.bid_recommendations || 0}</Metric>
                </div>
                <Badge color="emerald" size="sm">
                  {stats?.total_evaluations ?
                    `${((stats.bid_recommendations / stats.total_evaluations) * 100).toFixed(0)}%` :
                    '0%'}
                </Badge>
              </Flex>
            </Card>
            <Card decoration="top" decorationColor="violet">
              <Text>Avg Fit Score</Text>
              <Metric className="text-violet-600">
                {stats?.avg_fit_score?.toFixed(0) || 'N/A'}%
              </Metric>
              {stats?.avg_fit_score && (
                <ProgressBar value={stats.avg_fit_score} color="violet" className="mt-2" />
              )}
            </Card>
            <Card decoration="top" decorationColor="amber">
              <Text>Avg Win Probability</Text>
              <Metric className="text-amber-600">
                {stats?.avg_win_probability?.toFixed(0) || 'N/A'}%
              </Metric>
              {stats?.avg_win_probability && (
                <ProgressBar value={stats.avg_win_probability} color="amber" className="mt-2" />
              )}
            </Card>
          </Grid>
        </motion.div>

        {/* Filters & Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <Flex justifyContent="between" alignItems="center" className="flex-wrap gap-4">
              <TabGroup index={sourceFilter} onIndexChange={setSourceFilter}>
                <TabList variant="solid">
                  <Tab icon={TrendingUp}>Live Opportunities</Tab>
                  <Tab icon={Calendar}>Forecasts</Tab>
                </TabList>
              </TabGroup>

              <Flex className="gap-4 flex-wrap">
                <TextInput
                  icon={Search}
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Select
                  value={filter}
                  onValueChange={(v) => setFilter(v as any)}
                  icon={Filter}
                  className="max-w-[180px]"
                >
                  <SelectItem value="ALL">All Recommendations</SelectItem>
                  <SelectItem value="BID">BID Only</SelectItem>
                  <SelectItem value="RESEARCH">RESEARCH Only</SelectItem>
                  <SelectItem value="NO_BID">NO BID Only</SelectItem>
                </Select>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {loadingData ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            </Card>
          ) : filteredEvaluations.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <Title>No opportunities found</Title>
                <Text className="text-gray-500 mt-2">
                  Try adjusting your filters or trigger a new discovery
                </Text>
              </div>
            </Card>
          ) : (
            filteredEvaluations.map((evaluation, index) => {
              const daysLeft = getDaysUntilDeadline(evaluation.opportunity.response_deadline)
              const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
              const isPast = daysLeft !== null && daysLeft < 0

              return (
                <motion.div
                  key={evaluation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(index, 10) }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                      isUrgent ? 'ring-2 ring-amber-400' : ''
                    } ${isPast ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (!evaluation.opportunity.is_forecast) {
                        router.push(`/opportunities/${evaluation.opportunity.id}`)
                      }
                    }}
                  >
                    <Flex alignItems="start" className="gap-6">
                      {/* Score Section */}
                      <div className="flex-shrink-0 w-24 text-center">
                        <div className={`text-3xl font-bold text-${getScoreColor(evaluation.fit_score)}-600`}>
                          {evaluation.fit_score}%
                        </div>
                        <Text className="text-xs text-gray-500 mb-2">Fit Score</Text>
                        {getRecommendationBadge(evaluation.recommendation)}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <Flex alignItems="start" justifyContent="between" className="mb-2">
                          <div className="flex-1 min-w-0">
                            <Title className="text-lg truncate pr-4">
                              {evaluation.opportunity.title}
                            </Title>
                          </div>
                          <Flex className="gap-2 flex-shrink-0">
                            {evaluation.opportunity.is_forecast ? (
                              <Badge color="orange" size="sm">Forecast</Badge>
                            ) : (
                              <Badge color="blue" size="sm">Federal</Badge>
                            )}
                            {isUrgent && (
                              <Badge color="amber" size="sm">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysLeft}d left
                              </Badge>
                            )}
                          </Flex>
                        </Flex>

                        <Flex className="gap-4 mb-3 flex-wrap">
                          {evaluation.opportunity.department && (
                            <Flex className="gap-1">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <Text className="text-sm">{evaluation.opportunity.department}</Text>
                            </Flex>
                          )}
                          {evaluation.opportunity.naics_code && (
                            <Badge color="gray" size="sm">
                              NAICS {evaluation.opportunity.naics_code}
                            </Badge>
                          )}
                          {evaluation.opportunity.set_aside && (
                            <Badge color="violet" size="sm">
                              {evaluation.opportunity.set_aside}
                            </Badge>
                          )}
                        </Flex>

                        <Text className="text-gray-600 line-clamp-2 text-sm">
                          {evaluation.opportunity.description || 'No description available'}
                        </Text>

                        {/* Strengths Preview */}
                        {evaluation.strengths && evaluation.strengths.length > 0 && (
                          <Flex className="mt-3 gap-2 flex-wrap">
                            {evaluation.strengths.slice(0, 2).map((strength, i) => (
                              <Badge key={i} color="emerald" size="xs">
                                ✓ {strength.length > 30 ? strength.slice(0, 30) + '...' : strength}
                              </Badge>
                            ))}
                            {evaluation.strengths.length > 2 && (
                              <Badge color="gray" size="xs">
                                +{evaluation.strengths.length - 2} more
                              </Badge>
                            )}
                          </Flex>
                        )}
                      </div>

                      {/* Meta Section */}
                      <div className="flex-shrink-0 w-36 space-y-3 text-right">
                        <div>
                          <Text className="text-xs text-gray-500">Deadline</Text>
                          <Text className={`font-medium ${isPast ? 'text-red-500' : isUrgent ? 'text-amber-600' : ''}`}>
                            {formatDate(evaluation.opportunity.response_deadline)}
                          </Text>
                        </div>
                        <div>
                          <Text className="text-xs text-gray-500">Est. Value</Text>
                          <Text className="font-medium text-emerald-600">
                            {formatCurrency(evaluation.opportunity.contract_value)}
                          </Text>
                        </div>
                        <div>
                          <Text className="text-xs text-gray-500">Win Prob</Text>
                          <Text className="font-medium">
                            {evaluation.win_probability}%
                          </Text>
                        </div>
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card>
              <Flex justifyContent="between" alignItems="center">
                <Text>
                  Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
                </Text>
                <Flex className="gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * limit >= total}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </Flex>
              </Flex>
            </Card>
          </motion.div>
        )}
    </main>
  )
}
