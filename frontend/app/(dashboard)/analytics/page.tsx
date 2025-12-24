'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Grid,
  Metric,
  Flex,
  BarList,
  DonutChart,
  Badge,
  ProgressBar,
} from '@tremor/react'
import {
  Trophy,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react'

interface AgencyStat {
  agency: string
  total_awards: number
  total_value: number
}

interface VendorStat {
  vendor: string
  total_awards: number
  total_value: number
}

interface AwardStatsResponse {
  top_agencies: AgencyStat[]
  top_vendors: VendorStat[]
  total_awards: number
  total_value: number
  avg_award_value: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()

  const [stats, setStats] = useState<AwardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return

      try {
        setLoading(true)
        const response = await api.get('/awards/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadAnalytics()
    }
  }, [user])

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '$0'
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
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
            <Text className="text-gray-600">Loading analytics...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  // Prepare chart data
  const agencyBarData = stats?.top_agencies.map((agency, index) => ({
    name: agency.agency.length > 40 ? agency.agency.substring(0, 40) + '...' : agency.agency,
    value: agency.total_value,
    icon: () => <span className="text-sm font-bold text-blue-600">#{index + 1}</span>,
  })) || []

  const vendorBarData = stats?.top_vendors.map((vendor, index) => ({
    name: vendor.vendor.length > 40 ? vendor.vendor.substring(0, 40) + '...' : vendor.vendor,
    value: vendor.total_value,
    icon: () => <span className="text-sm font-bold text-emerald-600">#{index + 1}</span>,
  })) || []

  const donutData = stats?.top_agencies.slice(0, 5).map(agency => ({
    name: agency.agency.length > 25 ? agency.agency.substring(0, 25) + '...' : agency.agency,
    value: agency.total_value,
  })) || []

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Title className="text-3xl font-bold text-gray-900">
            Award Analytics
          </Title>
          <Text className="mt-1 text-gray-600">
            Competitive intelligence powered by USA Spending data
          </Text>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Grid numItemsSm={1} numItemsLg={3} className="gap-6">
            <Card decoration="top" decorationColor="blue">
              <Flex alignItems="start">
                <div>
                  <Text>Total Awards</Text>
                  <Metric>{formatNumber(stats?.total_awards || 0)}</Metric>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
              </Flex>
              <Text className="mt-2 text-xs text-gray-500">
                Contract awards in database
              </Text>
            </Card>

            <Card decoration="top" decorationColor="emerald">
              <Flex alignItems="start">
                <div>
                  <Text>Total Awarded Value</Text>
                  <Metric className="text-emerald-600">
                    {formatCurrency(stats?.total_value)}
                  </Metric>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </Flex>
              <Text className="mt-2 text-xs text-gray-500">
                Combined contract value
              </Text>
            </Card>

            <Card decoration="top" decorationColor="violet">
              <Flex alignItems="start">
                <div>
                  <Text>Average Award Size</Text>
                  <Metric className="text-violet-600">
                    {formatCurrency(stats?.avg_award_value)}
                  </Metric>
                </div>
                <div className="p-3 bg-violet-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
              </Flex>
              <Text className="mt-2 text-xs text-gray-500">
                Mean contract value
              </Text>
            </Card>
          </Grid>
        </motion.div>

        {/* Charts Row */}
        <Grid numItemsMd={2} className="gap-6 mb-8">
          {/* Top Agencies Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <Flex alignItems="center" className="gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <Title>Top Awarding Agencies</Title>
              </Flex>
              <Text className="mb-4 text-gray-500">
                Agencies issuing the most contract value
              </Text>

              {stats?.top_agencies && stats.top_agencies.length > 0 ? (
                <div className="space-y-4">
                  {stats.top_agencies.slice(0, 8).map((agency, index) => {
                    const maxValue = stats.top_agencies[0]?.total_value || 1
                    const percentage = (agency.total_value / maxValue) * 100

                    return (
                      <motion.div
                        key={agency.agency}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <Flex justifyContent="between" className="mb-1">
                          <Flex className="gap-2 truncate flex-1">
                            <Badge color="blue" size="xs">#{index + 1}</Badge>
                            <Text className="truncate text-sm">
                              {agency.agency}
                            </Text>
                          </Flex>
                          <Text className="font-semibold text-blue-600 flex-shrink-0 ml-2">
                            {formatCurrency(agency.total_value)}
                          </Text>
                        </Flex>
                        <ProgressBar value={percentage} color="blue" className="h-2" />
                        <Text className="text-xs text-gray-500 mt-1">
                          {formatNumber(agency.total_awards)} awards
                        </Text>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Text className="text-gray-500">No agency data available</Text>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Top Vendors Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <Flex alignItems="center" className="gap-2 mb-4">
                <Users className="h-5 w-5 text-emerald-600" />
                <Title>Top Vendors</Title>
              </Flex>
              <Text className="mb-4 text-gray-500">
                Most successful vendors by total award value
              </Text>

              {stats?.top_vendors && stats.top_vendors.length > 0 ? (
                <div className="space-y-4">
                  {stats.top_vendors.slice(0, 8).map((vendor, index) => {
                    const maxValue = stats.top_vendors[0]?.total_value || 1
                    const percentage = (vendor.total_value / maxValue) * 100

                    return (
                      <motion.div
                        key={vendor.vendor}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <Flex justifyContent="between" className="mb-1">
                          <Flex className="gap-2 truncate flex-1">
                            <Badge color="emerald" size="xs">#{index + 1}</Badge>
                            <Text className="truncate text-sm">
                              {vendor.vendor}
                            </Text>
                          </Flex>
                          <Text className="font-semibold text-emerald-600 flex-shrink-0 ml-2">
                            {formatCurrency(vendor.total_value)}
                          </Text>
                        </Flex>
                        <ProgressBar value={percentage} color="emerald" className="h-2" />
                        <Text className="text-xs text-gray-500 mt-1">
                          {formatNumber(vendor.total_awards)} awards
                        </Text>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Text className="text-gray-500">No vendor data available</Text>
                </div>
              )}
            </Card>
          </motion.div>
        </Grid>

        {/* Distribution Chart */}
        {donutData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <Title>Award Distribution by Agency</Title>
              <Text className="text-gray-500 mb-6">
                Top 5 agencies by total contract value
              </Text>
              <DonutChart
                data={donutData}
                category="value"
                index="name"
                valueFormatter={formatCurrency}
                colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
                className="h-72"
                showAnimation
              />
            </Card>
          </motion.div>
        )}
    </main>
  )
}
