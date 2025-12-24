'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAgencies, getRecommendedAgencies } from '@/lib/agencies'
import { AgencyWithStats, AgencyWithMatch } from '@/types/agency'
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
  TextInput,
} from '@tremor/react'
import {
  Building2,
  Search,
  Star,
  TrendingUp,
  DollarSign,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export default function AgenciesPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [recommendedAgencies, setRecommendedAgencies] = useState<AgencyWithMatch[]>([])
  const [allAgencies, setAllAgencies] = useState<AgencyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

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

  const getScoreColor = (score: number): 'emerald' | 'blue' | 'amber' | 'gray' => {
    if (score >= 80) return 'emerald'
    if (score >= 60) return 'blue'
    if (score >= 40) return 'amber'
    return 'gray'
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
            <Text className="text-gray-600">Loading agencies...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Title className="text-3xl font-bold text-gray-900">
            Agency Matching
          </Title>
          <Text className="mt-1 text-gray-600">
            Find agencies that match your company's capabilities
          </Text>
        </motion.div>

        {/* Tabs & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <Flex justifyContent="between" alignItems="center" className="flex-wrap gap-4">
              <TabGroup index={activeTab} onIndexChange={setActiveTab}>
                <TabList variant="solid">
                  <Tab icon={Star}>Recommended for You</Tab>
                  <Tab icon={Building2}>All Agencies</Tab>
                </TabList>
              </TabGroup>

              {activeTab === 1 && (
                <TextInput
                  icon={Search}
                  placeholder="Search agencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              )}
            </Flex>
          </Card>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Recommended Agencies Tab */}
        {activeTab === 0 && (
          <>
            {recommendedAgencies.length > 0 ? (
              <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
                {recommendedAgencies.map((agency, index) => (
                  <motion.div
                    key={agency.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                      onClick={() => router.push(`/agencies/${agency.id}`)}
                    >
                      <Flex justifyContent="between" alignItems="start" className="mb-4">
                        <div className="flex-1">
                          <Title className="text-lg">
                            {agency.abbreviation || agency.name}
                          </Title>
                          {agency.abbreviation && (
                            <Text className="text-sm text-gray-500 truncate">
                              {agency.name}
                            </Text>
                          )}
                        </div>
                        {agency.match_score !== undefined && (
                          <div className="flex flex-col items-end">
                            <Badge color={getScoreColor(agency.match_score)} size="lg">
                              {agency.match_score}% Match
                            </Badge>
                          </div>
                        )}
                      </Flex>

                      {agency.match_score !== undefined && (
                        <ProgressBar
                          value={agency.match_score}
                          color={getScoreColor(agency.match_score)}
                          className="mb-4"
                        />
                      )}

                      <div className="space-y-3">
                        {agency.level && (
                          <Badge color="gray" size="sm" className="capitalize">
                            {agency.level}
                          </Badge>
                        )}

                        <Flex justifyContent="between" className="text-sm">
                          <Flex className="gap-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <Text>Active Opportunities</Text>
                          </Flex>
                          <Text className="font-semibold">
                            {agency.opportunity_count ?? 0}
                          </Text>
                        </Flex>

                        {agency.avg_contract_value !== undefined && agency.avg_contract_value > 0 && (
                          <Flex justifyContent="between" className="text-sm">
                            <Flex className="gap-1">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              <Text>Avg. Contract</Text>
                            </Flex>
                            <Text className="font-semibold text-emerald-600">
                              {formatCurrency(agency.avg_contract_value)}
                            </Text>
                          </Flex>
                        )}

                        {agency.match_reason && (
                          <Text className="text-xs text-gray-500 line-clamp-2 mt-2 pt-2 border-t">
                            {agency.match_reason}
                          </Text>
                        )}
                      </div>

                      <Flex className="mt-4 pt-3 border-t" justifyContent="end">
                        <Text className="text-sm text-blue-600 flex items-center gap-1">
                          View Details <ArrowRight className="h-4 w-4" />
                        </Text>
                      </Flex>
                    </Card>
                  </motion.div>
                ))}
              </Grid>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="text-center py-16">
                  <div className="text-6xl mb-6">🏛️</div>
                  <Title>No Recommendations Yet</Title>
                  <Text className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
                    Complete your company profile to get personalized agency recommendations
                    based on your NAICS codes, certifications, and capabilities.
                  </Text>
                  <button
                    onClick={() => router.push('/settings')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Complete Profile
                  </button>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* All Agencies Tab */}
        {activeTab === 1 && (
          <>
            {filteredAgencies.length > 0 ? (
              <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
                {filteredAgencies.map((agency, index) => (
                  <motion.div
                    key={agency.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * Math.min(index, 15) }}
                  >
                    <Card
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                      onClick={() => router.push(`/agencies/${agency.id}`)}
                    >
                      <div className="mb-4">
                        <Title className="text-lg">
                          {agency.abbreviation || agency.name}
                        </Title>
                        {agency.abbreviation && (
                          <Text className="text-sm text-gray-500 truncate">
                            {agency.name}
                          </Text>
                        )}
                      </div>

                      <div className="space-y-3">
                        {agency.level && (
                          <Badge color="gray" size="sm" className="capitalize">
                            {agency.level}
                          </Badge>
                        )}

                        <Flex justifyContent="between" className="text-sm">
                          <Flex className="gap-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <Text>Active Opportunities</Text>
                          </Flex>
                          <Text className="font-semibold">
                            {agency.opportunity_count ?? 0}
                          </Text>
                        </Flex>

                        {agency.avg_contract_value !== undefined && agency.avg_contract_value > 0 && (
                          <Flex justifyContent="between" className="text-sm">
                            <Flex className="gap-1">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              <Text>Avg. Contract</Text>
                            </Flex>
                            <Text className="font-semibold text-emerald-600">
                              {formatCurrency(agency.avg_contract_value)}
                            </Text>
                          </Flex>
                        )}
                      </div>

                      <Flex className="mt-4 pt-3 border-t" justifyContent="end">
                        <Text className="text-sm text-blue-600 flex items-center gap-1">
                          View Details <ArrowRight className="h-4 w-4" />
                        </Text>
                      </Flex>
                    </Card>
                  </motion.div>
                ))}
              </Grid>
            ) : (
              <Card className="text-center py-12">
                <Text className="text-gray-500">
                  {searchQuery ? 'No agencies match your search' : 'No agencies available'}
                </Text>
              </Card>
            )}
          </>
        )}
    </main>
  )
}
