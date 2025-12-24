'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { getStats, triggerDiscovery } from '@/lib/opportunities'
import { getStaleCount, rescoreAll } from '@/lib/rescoring'
import { OpportunityStats } from '@/types/opportunity'
import { motion } from 'framer-motion'
import { Title, Text, Grid, Card, Flex, Badge } from '@tremor/react'
import { Sparkles, ArrowRight, Clock, TrendingUp } from 'lucide-react'

import {
  KPICards,
  PipelineChart,
  RecommendationBreakdown,
  ActionItems,
} from '@/components/dashboard'
import { RecommendedAgencies } from '@/components/agencies'

interface PipelineStats {
  watching: number
  bidding: number
  won: number
  lost: number
  passed: number
  total: number
  win_rate?: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const [checkingCompany, setCheckingCompany] = useState(true)
  const [stats, setStats] = useState<OpportunityStats | null>(null)
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)
  const [staleCount, setStaleCount] = useState(0)
  const [triggering, setTriggering] = useState(false)
  const [rescoring, setRescoring] = useState(false)

  useEffect(() => {
    const checkCompanyProfile = async () => {
      if (!user) return

      try {
        await api.get('/company/me')
        setHasCompany(true)

        // Load all dashboard data in parallel
        const [statsData, pipelineData, staleData] = await Promise.all([
          getStats().catch(() => null),
          api.get('/pipeline/stats').then(r => r.data).catch(() => null),
          getStaleCount().catch(() => ({ stale_count: 0 })),
        ])

        setStats(statsData)
        setPipelineStats(pipelineData)
        setStaleCount(staleData?.stale_count || 0)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasCompany(false)
          router.push('/onboarding')
        }
      } finally {
        setCheckingCompany(false)
      }
    }

    if (user) {
      checkCompanyProfile()
    }
  }, [user, router])

  const handleTriggerDiscovery = async () => {
    try {
      setTriggering(true)
      await triggerDiscovery()
      // Reload stats after discovery
      setTimeout(async () => {
        const statsData = await getStats()
        setStats(statsData)
      }, 2000)
    } catch (error) {
      console.error('Error triggering discovery:', error)
    } finally {
      setTriggering(false)
    }
  }

  const handleRescore = async () => {
    try {
      setRescoring(true)
      await rescoreAll()
      setStaleCount(0)
      // Reload stats
      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error rescoring:', error)
    } finally {
      setRescoring(false)
    }
  }

  if (checkingCompany) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <Text className="text-gray-600">Loading your dashboard...</Text>
        </motion.div>
      </div>
    )
  }

  if (!user || !hasCompany) {
    return null
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Flex alignItems="end" justifyContent="between">
            <div>
              <Title className="text-3xl font-bold text-gray-900">
                Welcome back{user.first_name ? `, ${user.first_name}` : ''}! 👋
              </Title>
              <Text className="mt-1 text-gray-600">
                Here's what's happening with your government contract opportunities
              </Text>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </Flex>
        </motion.div>

        {/* KPI Cards */}
        <div className="mb-8">
          <KPICards
            stats={stats}
            onCardClick={(filter) => {
              if (filter === 'all') router.push('/opportunities')
              else router.push(`/opportunities?filter=${filter}`)
            }}
          />
        </div>

        {/* Action Items */}
        <div className="mb-8">
          <ActionItems
            staleCount={staleCount}
            upcomingDeadlines={0}
            newOpportunities={stats?.bid_recommendations || 0}
            onTriggerDiscovery={handleTriggerDiscovery}
            onRescore={handleRescore}
            isDiscovering={triggering}
          />
        </div>

        {/* Charts Row */}
        <Grid numItemsMd={2} className="gap-6 mb-8">
          <PipelineChart data={pipelineStats} />
          <RecommendationBreakdown stats={stats} />
        </Grid>

        {/* Bottom Section */}
        <Grid numItemsMd={2} className="gap-6 mb-8">
          {/* Recommended Agencies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <RecommendedAgencies limit={5} />
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="h-full">
              <Title>Quick Actions</Title>
              <Text className="text-tremor-content">
                Navigate to key features
              </Text>

              <div className="mt-6 space-y-3">
                <Link href="/opportunities">
                  <motion.div
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <Text className="font-medium text-gray-900">
                          View All Opportunities
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Browse AI-evaluated contracts
                        </Text>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </motion.div>
                </Link>

                <Link href="/pipeline">
                  <motion.div
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                        <Sparkles className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <Text className="font-medium text-gray-900">
                          Manage Pipeline
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Track your bid progress
                        </Text>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </motion.div>
                </Link>

                <Link href="/settings?tab=documents">
                  <motion.div
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
                        <svg
                          className="h-5 w-5 text-violet-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <Text className="font-medium text-gray-900">
                          Upload Documents
                        </Text>
                        <Text className="text-xs text-gray-500">
                          AI extracts capabilities
                        </Text>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-violet-600 transition-colors" />
                  </motion.div>
                </Link>
              </div>

              {/* Platform Stats */}
              <div className="mt-6 pt-4 border-t border-tremor-border">
                <Flex>
                  <Text className="text-xs text-tremor-content-subtle">
                    Platform Features
                  </Text>
                </Flex>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge color="blue" size="xs">SAM.gov Integration</Badge>
                  <Badge color="emerald" size="xs">GPT-4 AI</Badge>
                  <Badge color="violet" size="xs">Auto Discovery</Badge>
                  <Badge color="amber" size="xs">Email Alerts</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        </Grid>
    </main>
  )
}
