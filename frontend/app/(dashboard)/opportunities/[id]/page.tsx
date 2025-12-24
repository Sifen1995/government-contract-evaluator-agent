'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getOpportunity, updateEvaluation } from '@/lib/opportunities'
import { OpportunityWithEvaluation } from '@/types/opportunity'
import { OpportunityContacts } from '@/components/agencies'
import { StaleEvaluationBanner } from '@/components/rescoring'
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
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react'
import {
  Calendar,
  DollarSign,
  Building2,
  FileText,
  ExternalLink,
  ArrowLeft,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Save,
} from 'lucide-react'

export default function OpportunityDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [opportunity, setOpportunity] = useState<OpportunityWithEvaluation | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userSaved, setUserSaved] = useState<string>('NONE')
  const [userNotes, setUserNotes] = useState('')

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
        setUserSaved(data.evaluation.user_saved || 'NONE')
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
        user_saved: userSaved === 'NONE' ? null : userSaved as any,
        user_notes: userNotes,
      })
    } catch {
      console.error('Failed to save changes')
    } finally {
      setSaving(false)
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

  const getScoreColor = (score: number): 'emerald' | 'amber' | 'rose' => {
    if (score >= 70) return 'emerald'
    if (score >= 50) return 'amber'
    return 'rose'
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
      : 'TBD'

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (!user) return null

  if (loadingData) {
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
            <Text className="text-gray-600">Loading opportunity details...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  if (!opportunity) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-24">
          <Card className="text-center py-12 px-8">
            <div className="text-6xl mb-4">🔍</div>
            <Title>Opportunity Not Found</Title>
            <Text className="text-gray-500 mt-2 mb-6">
              The opportunity you're looking for doesn't exist or has been removed.
            </Text>
            <button
              onClick={() => router.push('/opportunities')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Opportunities
            </button>
          </Card>
        </div>
      </main>
    )
  }

  const evaluation = opportunity.evaluation
  const daysLeft = getDaysUntilDeadline(opportunity.response_deadline)
  const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isPast = daysLeft !== null && daysLeft < 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => router.push('/opportunities')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Opportunities</span>
          </button>
        </motion.div>

        {/* Stale Evaluation Banner */}
        {evaluation && (
          <StaleEvaluationBanner
            evaluationId={evaluation.id}
            isStale={(evaluation as any).is_stale || false}
            onRefreshComplete={() => loadOpportunity()}
          />
        )}

        {/* AI Evaluation Card */}
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card decoration="left" decorationColor={getScoreColor(evaluation.fit_score)} className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <Flex justifyContent="between" alignItems="start" className="flex-wrap gap-4">
                <div>
                  <Flex className="gap-2" alignItems="center">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <Title>AI Evaluation</Title>
                  </Flex>
                  <Text className="text-gray-500 mt-1">Automated scoring based on your company profile</Text>
                </div>
                {getRecommendationBadge(evaluation.recommendation)}
              </Flex>

              <Grid numItemsMd={3} className="gap-6 mt-6">
                <div>
                  <Text className="text-gray-500">Fit Score</Text>
                  <Metric className={`text-${getScoreColor(evaluation.fit_score)}-600`}>
                    {evaluation.fit_score}%
                  </Metric>
                  <ProgressBar value={evaluation.fit_score} color={getScoreColor(evaluation.fit_score)} className="mt-2" />
                </div>
                <div>
                  <Text className="text-gray-500">Win Probability</Text>
                  <Metric className="text-violet-600">{evaluation.win_probability}%</Metric>
                  <ProgressBar value={evaluation.win_probability} color="violet" className="mt-2" />
                </div>
                <div>
                  <Text className="text-gray-500">Status</Text>
                  <Flex className="gap-2 mt-2">
                    {isPast ? (
                      <Badge color="rose" size="lg">
                        <XCircle className="h-4 w-4 mr-1" />
                        Deadline Passed
                      </Badge>
                    ) : isUrgent ? (
                      <Badge color="amber" size="lg">
                        <Clock className="h-4 w-4 mr-1" />
                        {daysLeft} Days Left
                      </Badge>
                    ) : (
                      <Badge color="blue" size="lg">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Active
                      </Badge>
                    )}
                  </Flex>
                </div>
              </Grid>

              {/* Strengths & Weaknesses */}
              {((evaluation.strengths && evaluation.strengths.length > 0) || (evaluation.weaknesses && evaluation.weaknesses.length > 0)) && (
                <Grid numItemsMd={2} className="gap-6 mt-6 pt-6 border-t border-blue-100">
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div>
                      <Flex className="gap-2 mb-3" alignItems="center">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <Text className="font-medium text-emerald-700">Strengths</Text>
                      </Flex>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                    <div>
                      <Flex className="gap-2 mb-3" alignItems="center">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <Text className="font-medium text-amber-700">Areas to Address</Text>
                      </Flex>
                      <ul className="space-y-2">
                        {evaluation.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-amber-500 mt-0.5">!</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Grid>
              )}
            </Card>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <Grid numItemsMd={3} className="gap-6">
          {/* Left Column - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            {/* Opportunity Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <Flex justifyContent="between" alignItems="start" className="mb-4 flex-wrap gap-4">
                  <div className="flex-1">
                    <Title className="text-xl">{opportunity.title}</Title>
                    <Text className="text-gray-500 mt-1">Notice ID: {opportunity.notice_id}</Text>
                  </div>
                  <Flex className="gap-2">
                    {opportunity.is_forecast ? (
                      <Badge color="orange" size="lg">Forecast</Badge>
                    ) : (
                      <Badge color="blue" size="lg">Federal</Badge>
                    )}
                    {opportunity.set_aside && (
                      <Badge color="violet" size="lg">{opportunity.set_aside}</Badge>
                    )}
                  </Flex>
                </Flex>

                <div className="prose prose-sm max-w-none">
                  <Text className="text-gray-700 whitespace-pre-wrap">
                    {opportunity.description || 'No description available.'}
                  </Text>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Grid numItemsSm={2} numItemsLg={3} className="gap-4">
                    {opportunity.department && (
                      <div>
                        <Flex className="gap-2 mb-1" alignItems="center">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <Text className="text-xs text-gray-500">Department</Text>
                        </Flex>
                        <Text className="font-medium">{opportunity.department}</Text>
                      </div>
                    )}
                    {opportunity.naics_code && (
                      <div>
                        <Flex className="gap-2 mb-1" alignItems="center">
                          <Target className="h-4 w-4 text-gray-400" />
                          <Text className="text-xs text-gray-500">NAICS Code</Text>
                        </Flex>
                        <Text className="font-medium">{opportunity.naics_code}</Text>
                      </div>
                    )}
                    {opportunity.issuing_agency && (
                      <div>
                        <Flex className="gap-2 mb-1" alignItems="center">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <Text className="text-xs text-gray-500">Issuing Agency</Text>
                        </Flex>
                        <Text className="font-medium">{opportunity.issuing_agency}</Text>
                      </div>
                    )}
                  </Grid>
                </div>

                {opportunity.link && (
                  <div className="mt-6">
                    <a
                      href={opportunity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Source on SAM.gov
                    </a>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Key Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <Flex className="gap-2 mb-4" alignItems="center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <Title>Key Dates</Title>
                </Flex>
                <div className="space-y-4">
                  <div>
                    <Text className="text-xs text-gray-500">Posted Date</Text>
                    <Text className="font-medium">{formatDate(opportunity.posted_date)}</Text>
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500">Response Deadline</Text>
                    <Text className={`font-medium ${isPast ? 'text-red-600' : isUrgent ? 'text-amber-600' : ''}`}>
                      {formatDate(opportunity.response_deadline)}
                    </Text>
                    {daysLeft !== null && !isPast && (
                      <Badge color={isUrgent ? 'amber' : 'gray'} size="sm" className="mt-1">
                        {daysLeft} days remaining
                      </Badge>
                    )}
                    {isPast && (
                      <Badge color="rose" size="sm" className="mt-1">
                        Deadline passed
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Contract Value */}
            {opportunity.contract_value && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card decoration="top" decorationColor="emerald">
                  <Flex className="gap-2 mb-2" alignItems="center">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <Title>Contract Value</Title>
                  </Flex>
                  <Metric className="text-emerald-600">
                    {formatCurrency(opportunity.contract_value)}
                  </Metric>
                </Card>
              </motion.div>
            )}

            {/* Pipeline Management */}
            {!opportunity.is_forecast && evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <Flex className="gap-2 mb-4" alignItems="center">
                    <TrendingUp className="h-5 w-5 text-violet-600" />
                    <Title>Pipeline</Title>
                  </Flex>
                  <div className="space-y-4">
                    <div>
                      <Text className="text-xs text-gray-500 mb-2">Status</Text>
                      <Select value={userSaved} onValueChange={setUserSaved}>
                        <SelectItem value="NONE">Not Saved</SelectItem>
                        <SelectItem value="WATCHING">Watching</SelectItem>
                        <SelectItem value="BIDDING">Bidding</SelectItem>
                        <SelectItem value="PASSED">Passed</SelectItem>
                        <SelectItem value="WON">Won</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Text className="text-xs text-gray-500 mb-2">Notes</Text>
                      <textarea
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder="Add your notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Forecast Notice */}
            {opportunity.is_forecast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="bg-orange-50 border-orange-200">
                  <Flex className="gap-2" alignItems="center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <Text className="text-orange-800 font-medium">Forecast Opportunity</Text>
                  </Flex>
                  <Text className="text-sm text-orange-700 mt-2">
                    This is a forecasted opportunity and cannot be added to your pipeline until it becomes active.
                  </Text>
                </Card>
              </motion.div>
            )}

            {/* Recommended Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <OpportunityContacts
                opportunityId={id}
                contractingOfficer={{
                  name: opportunity.primary_contact_name,
                  email: opportunity.primary_contact_email,
                  phone: opportunity.primary_contact_phone,
                }}
              />
            </motion.div>
          </div>
        </Grid>
    </main>
  )
}
