'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAgency, getAgencyContacts, getAgencyMatchDetail } from '@/lib/agencies'
import { AgencyWithStats, GovernmentContact, MatchScoreBreakdown } from '@/types/agency'
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
  Button,
} from '@tremor/react'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Users,
  Target,
  MapPin,
  Award,
  FileText,
  DollarSign,
  Sparkles,
} from 'lucide-react'

export default function AgencyProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [agency, setAgency] = useState<AgencyWithStats | null>(null)
  const [contacts, setContacts] = useState<GovernmentContact[]>([])
  const [matchBreakdown, setMatchBreakdown] = useState<MatchScoreBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgencyData = async () => {
      if (!user || !id) return

      try {
        setLoading(true)
        const [agencyData, contactsData, matchData] = await Promise.all([
          getAgency(id),
          getAgencyContacts(id).catch(() => []),
          getAgencyMatchDetail(id).catch(() => null),
        ])

        setAgency(agencyData)
        setContacts(contactsData)
        setMatchBreakdown(matchData)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load agency')
      } finally {
        setLoading(false)
      }
    }

    loadAgencyData()
  }, [user, id])

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getScoreColor = (score: number): 'emerald' | 'blue' | 'amber' | 'gray' => {
    if (score >= 80) return 'emerald'
    if (score >= 60) return 'blue'
    if (score >= 40) return 'amber'
    return 'gray'
  }

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'osdbu': return 'Small Business Liaison (OSDBU)'
      case 'contracting_officer': return 'Contracting Officer'
      case 'industry_liaison': return 'Industry Liaison'
      case 'small_business_specialist': return 'Small Business Specialist'
      default: return type
    }
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
            <Text className="text-gray-600">Loading agency details...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  if (error || !agency) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Text className="text-red-600">{error || 'Agency not found'}</Text>
          <Button onClick={() => router.push('/agencies')}>Back to Agencies</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agencies
        </motion.button>

        {/* Agency Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6" decoration="top" decorationColor="blue">
            <Flex alignItems="start" justifyContent="between">
              <div>
                <Flex alignItems="center" className="gap-3 mb-2">
                  <Title className="text-3xl">{agency.abbreviation || agency.name}</Title>
                  {agency.level && (
                    <Badge color="gray" size="lg" className="capitalize">
                      {agency.level}
                    </Badge>
                  )}
                </Flex>
                {agency.abbreviation && (
                  <Text className="text-lg text-gray-600">{agency.name}</Text>
                )}
              </div>
              {matchBreakdown && (
                <div className="text-center">
                  <div className={`px-6 py-4 rounded-xl bg-${getScoreColor(matchBreakdown.score)}-100`}>
                    <Metric className={`text-${getScoreColor(matchBreakdown.score)}-600`}>
                      {matchBreakdown.score}%
                    </Metric>
                    <Text className="text-sm">Match Score</Text>
                  </div>
                </div>
              )}
            </Flex>
          </Card>
        </motion.div>

        <Grid numItemsMd={3} className="gap-6">
          {/* Main Content - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Match Score Breakdown */}
            {matchBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <Flex alignItems="center" className="gap-2 mb-4">
                    <Target className="h-5 w-5 text-blue-600" />
                    <Title>Match Score Breakdown</Title>
                  </Flex>
                  <Text className="text-gray-500 mb-6">How your company matches this agency</Text>

                  <div className="space-y-5">
                    <div>
                      <Flex justifyContent="between" className="mb-2">
                        <Text>NAICS Alignment</Text>
                        <Text className="font-semibold">{matchBreakdown.factors.naics_alignment}%</Text>
                      </Flex>
                      <ProgressBar value={matchBreakdown.factors.naics_alignment} color="blue" />
                    </div>
                    <div>
                      <Flex justifyContent="between" className="mb-2">
                        <Text>Set-Aside Alignment</Text>
                        <Text className="font-semibold">{matchBreakdown.factors.set_aside_alignment}%</Text>
                      </Flex>
                      <ProgressBar value={matchBreakdown.factors.set_aside_alignment} color="emerald" />
                    </div>
                    <div>
                      <Flex justifyContent="between" className="mb-2">
                        <Text>Geographic Fit</Text>
                        <Text className="font-semibold">{matchBreakdown.factors.geographic_fit}%</Text>
                      </Flex>
                      <ProgressBar value={matchBreakdown.factors.geographic_fit} color="violet" />
                    </div>
                    <div>
                      <Flex justifyContent="between" className="mb-2">
                        <Text>Award History Fit</Text>
                        <Text className="font-semibold">{matchBreakdown.factors.award_history_fit}%</Text>
                      </Flex>
                      <ProgressBar value={matchBreakdown.factors.award_history_fit} color="amber" />
                    </div>
                  </div>

                  {matchBreakdown.reasoning && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <Text className="text-blue-800">{matchBreakdown.reasoning}</Text>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Small Business Goals */}
            {(agency.small_business_goal_pct || agency.eight_a_goal_pct || agency.wosb_goal_pct || agency.sdvosb_goal_pct || agency.hubzone_goal_pct) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <Flex alignItems="center" className="gap-2 mb-4">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <Title>Small Business Goals</Title>
                  </Flex>
                  <Text className="text-gray-500 mb-6">Agency contracting goals for small businesses</Text>

                  <Grid numItemsSm={2} numItemsMd={5} className="gap-4">
                    {agency.small_business_goal_pct !== undefined && (
                      <Card decoration="top" decorationColor="blue" className="text-center">
                        <Metric className="text-blue-600">{agency.small_business_goal_pct}%</Metric>
                        <Text className="text-xs">Small Business</Text>
                      </Card>
                    )}
                    {agency.eight_a_goal_pct !== undefined && (
                      <Card decoration="top" decorationColor="emerald" className="text-center">
                        <Metric className="text-emerald-600">{agency.eight_a_goal_pct}%</Metric>
                        <Text className="text-xs">8(a)</Text>
                      </Card>
                    )}
                    {agency.wosb_goal_pct !== undefined && (
                      <Card decoration="top" decorationColor="violet" className="text-center">
                        <Metric className="text-violet-600">{agency.wosb_goal_pct}%</Metric>
                        <Text className="text-xs">WOSB</Text>
                      </Card>
                    )}
                    {agency.sdvosb_goal_pct !== undefined && (
                      <Card decoration="top" decorationColor="amber" className="text-center">
                        <Metric className="text-amber-600">{agency.sdvosb_goal_pct}%</Metric>
                        <Text className="text-xs">SDVOSB</Text>
                      </Card>
                    )}
                    {agency.hubzone_goal_pct !== undefined && (
                      <Card decoration="top" decorationColor="rose" className="text-center">
                        <Metric className="text-rose-600">{agency.hubzone_goal_pct}%</Metric>
                        <Text className="text-xs">HUBZone</Text>
                      </Card>
                    )}
                  </Grid>
                </Card>
              </motion.div>
            )}

            {/* Key Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <Flex alignItems="center" className="gap-2 mb-4">
                  <Users className="h-5 w-5 text-violet-600" />
                  <Title>Key Contacts</Title>
                </Flex>
                <Text className="text-gray-500 mb-6">Agency contacts for small business opportunities</Text>

                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <Badge color="gray" size="sm" className="mb-2">
                            {getContactTypeLabel(contact.contact_type)}
                          </Badge>
                          <Title className="text-lg">
                            {contact.first_name} {contact.last_name}
                          </Title>
                          {contact.title && (
                            <Text className="text-gray-600">{contact.title}</Text>
                          )}
                          <Flex className="mt-3 gap-4 flex-wrap">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                              >
                                <Mail className="h-4 w-4" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-1 text-gray-600 text-sm"
                              >
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                              </a>
                            )}
                          </Flex>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Text className="text-gray-500">No contacts available for this agency</Text>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agency Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <Title className="mb-4">Statistics</Title>
                <div className="space-y-4">
                  {agency.opportunity_count !== undefined && (
                    <div>
                      <Flex className="gap-2 mb-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <Text className="text-gray-500">Active Opportunities</Text>
                      </Flex>
                      <Metric>{agency.opportunity_count}</Metric>
                    </div>
                  )}
                  {agency.avg_contract_value !== undefined && agency.avg_contract_value > 0 && (
                    <div>
                      <Flex className="gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <Text className="text-gray-500">Avg. Contract Value</Text>
                      </Flex>
                      <Metric className="text-emerald-600">
                        {formatCurrency(agency.avg_contract_value)}
                      </Metric>
                    </div>
                  )}
                  {agency.top_naics_codes && agency.top_naics_codes.length > 0 && (
                    <div>
                      <Text className="text-gray-500 mb-2">Top NAICS Codes</Text>
                      <Flex className="gap-2 flex-wrap">
                        {agency.top_naics_codes.map((naics) => (
                          <Badge key={naics} color="gray">{naics}</Badge>
                        ))}
                      </Flex>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <Title className="mb-4">Quick Links</Title>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-between"
                    onClick={() => router.push(`/opportunities?agency=${encodeURIComponent(agency.name)}`)}
                  >
                    View Opportunities
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {agency.small_business_url && (
                    <a href={agency.small_business_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full justify-between">
                        Small Business Page
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {agency.forecast_url && (
                    <a href={agency.forecast_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full justify-between">
                        Forecast Page
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {agency.vendor_portal_url && (
                    <a href={agency.vendor_portal_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full justify-between">
                        Vendor Portal
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </Grid>
    </main>
  )
}
