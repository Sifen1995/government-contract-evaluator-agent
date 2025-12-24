'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { MultiSelect } from '@/components/ui/multi-select'
import { DocumentUpload, DocumentList, CertificationForm, PastPerformanceForm, DocumentSuggestions } from '@/components/documents'
import { BulkRescoreButton } from '@/components/rescoring'
import { Company } from '@/types/company'
import { Document, CertificationDocument, PastPerformance } from '@/types/document'
import { NAICSCode, SetAside, ContractRange, USState } from '@/types/reference'
import { getDocuments, getCertifications, getPastPerformances } from '@/lib/documents'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Grid,
  Badge,
  Flex,
  TextInput,
  Textarea,
  Select,
  SelectItem,
  TabGroup,
  TabList,
  Tab,
} from '@tremor/react'
import {
  Building2,
  FileText,
  Award,
  Briefcase,
  Bell,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle,
  Settings,
  Zap,
} from 'lucide-react'

type SettingsTab = 'profile' | 'documents' | 'certifications' | 'past-performance' | 'notifications' | 'ai-settings'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [company, setCompany] = useState<Company | null>(null)
  const [emailFrequency, setEmailFrequency] = useState<string>('daily')

  // Reference data
  const [naicsCodes, setNaicsCodes] = useState<NAICSCode[]>([])
  const [setAsides, setSetAsides] = useState<SetAside[]>([])
  const [contractRanges, setContractRanges] = useState<ContractRange[]>([])
  const [states, setStates] = useState<USState[]>([])
  const [legalStructures, setLegalStructures] = useState<string[]>([])

  // Document data
  const [documents, setDocuments] = useState<Document[]>([])
  const [certifications, setCertifications] = useState<CertificationDocument[]>([])
  const [pastPerformances, setPastPerformances] = useState<PastPerformance[]>([])

  // Suggestions review state
  const [selectedDocumentForSuggestions, setSelectedDocumentForSuggestions] = useState<Document | null>(null)

  const tabs: { id: SettingsTab; label: string; icon: typeof Building2; badge?: number }[] = [
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'past-performance', label: 'Past Performance', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai-settings', label: 'AI Settings', icon: Sparkles },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load reference data
        const refResponse = await api.get('/reference/all')
        setNaicsCodes(refResponse.data.naics_codes)
        setSetAsides(refResponse.data.set_asides)
        setContractRanges(refResponse.data.contract_ranges)
        setStates(refResponse.data.states)
        setLegalStructures(refResponse.data.legal_structures)

        // Load company profile
        const companyResponse = await api.get('/company/me')
        setCompany(companyResponse.data)

        // Load user's email preferences
        const userResponse = await api.get('/auth/me')
        setEmailFrequency(userResponse.data.email_frequency || 'daily')

        // Load documents data (optional - may fail if not implemented)
        try {
          const [docsResponse, certsResponse, ppResponse] = await Promise.all([
            getDocuments(),
            getCertifications(),
            getPastPerformances(),
          ])
          setDocuments(docsResponse.documents || [])
          setCertifications(certsResponse.certifications || [])
          setPastPerformances(ppResponse.past_performances || [])
        } catch (err) {
          // Silently fail - document features are optional
          console.log('Document features not yet available')
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.push('/onboarding')
        } else {
          setError('Failed to load company profile')
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await api.put('/company/', company)
      setCompany(response.data)
      setSuccess('Company profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update company profile')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailPreferencesSubmit = async () => {
    setError('')
    setSuccess('')
    setSavingEmail(true)

    try {
      await api.put('/auth/me', { email_frequency: emailFrequency })
      setSuccess('Email preferences updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update email preferences')
    } finally {
      setSavingEmail(false)
    }
  }

  const reloadDocuments = async () => {
    try {
      const response = await getDocuments()
      setDocuments(response.documents || [])
    } catch (err) {
      console.error('Error reloading documents:', err)
    }
  }

  const reloadCertifications = async () => {
    try {
      const response = await getCertifications()
      setCertifications(response.certifications || [])
    } catch (err) {
      console.error('Error reloading certifications:', err)
    }
  }

  const reloadPastPerformances = async () => {
    try {
      const response = await getPastPerformances()
      setPastPerformances(response.past_performances || [])
    } catch (err) {
      console.error('Error reloading past performances:', err)
    }
  }

  const handleViewSuggestions = (doc: Document) => {
    setSelectedDocumentForSuggestions(doc)
  }

  const handleSuggestionsApplied = async () => {
    await reloadDocuments()
    try {
      const companyResponse = await api.get('/company/me')
      setCompany(companyResponse.data)
    } catch (err) {
      console.error('Error reloading company:', err)
    }
    setSelectedDocumentForSuggestions(null)
    setSuccess('Suggestions applied to your company profile!')
  }

  const handleSuggestionsDismissed = async () => {
    await reloadDocuments()
    setSelectedDocumentForSuggestions(null)
  }

  const handleExtractionComplete = async (doc: Document) => {
    await reloadDocuments()
    setSelectedDocumentForSuggestions(doc)
  }

  const pendingSuggestionsCount = documents.filter(
    d => d.extraction_status === 'completed' && d.suggestions_reviewed === false
  ).length

  const getTabIndex = (tab: SettingsTab): number => {
    return tabs.findIndex(t => t.id === tab)
  }

  const handleTabChange = (index: number) => {
    setActiveTab(tabs[index].id)
  }

  if (!user || !company) return null

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <Text className="text-gray-600">Loading settings...</Text>
          </motion.div>
        </div>
      </main>
    )
  }

  const naicsOptions = naicsCodes.map(n => ({ value: n.code, label: `${n.code} - ${n.title}` }))
  const setAsideOptions = setAsides.map(s => ({ value: s.code, label: s.name }))
  const stateOptions = states.map(s => ({ value: s.code, label: s.name }))

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Flex alignItems="center" className="gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <Title className="text-3xl font-bold text-gray-900">Company Settings</Title>
              <Text className="text-gray-600">Manage your company profile and preferences</Text>
            </div>
          </Flex>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border-red-200">
              <Flex className="gap-3" alignItems="center">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <Text className="text-red-700">{error}</Text>
              </Flex>
            </Card>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-green-50 border-green-200">
              <Flex className="gap-3" alignItems="center">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Text className="text-green-700">{success}</Text>
              </Flex>
            </Card>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <TabGroup index={getTabIndex(activeTab)} onIndexChange={handleTabChange}>
              <TabList variant="solid" className="flex-wrap">
                {tabs.map((tab) => (
                  <Tab key={tab.id} icon={tab.icon} className="relative">
                    {tab.label}
                    {tab.id === 'documents' && pendingSuggestionsCount > 0 && (
                      <Badge color="blue" size="xs" className="absolute -top-1 -right-1">
                        {pendingSuggestionsCount}
                      </Badge>
                    )}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </Card>
        </motion.div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Company Information */}
              <Card>
                <Flex className="gap-2 mb-4" alignItems="center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <Title>Company Information</Title>
                </Flex>
                <Text className="text-gray-500 mb-6">Basic information about your company</Text>

                <Grid numItemsMd={2} className="gap-6">
                  <div className="md:col-span-2">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Company Name *</Text>
                    <TextInput
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Legal Structure</Text>
                    <Select
                      value={company.legal_structure || ''}
                      onValueChange={(v) => setCompany({ ...company, legal_structure: v })}
                    >
                      <SelectItem value="">Select structure...</SelectItem>
                      {legalStructures.map((structure) => (
                        <SelectItem key={structure} value={structure}>
                          {structure}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">UEI (Unique Entity Identifier)</Text>
                    <TextInput
                      value={company.uei || ''}
                      onChange={(e) => setCompany({ ...company, uei: e.target.value })}
                      placeholder="12-character SAM.gov UEI"
                      maxLength={12}
                    />
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Street Address</Text>
                    <TextInput
                      value={company.address_street || ''}
                      onChange={(e) => setCompany({ ...company, address_street: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">City</Text>
                    <TextInput
                      value={company.address_city || ''}
                      onChange={(e) => setCompany({ ...company, address_city: e.target.value })}
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">State</Text>
                    <Select
                      value={company.address_state || ''}
                      onValueChange={(v) => setCompany({ ...company, address_state: v })}
                    >
                      <SelectItem value="">Select state...</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">ZIP Code</Text>
                    <TextInput
                      value={company.address_zip || ''}
                      onChange={(e) => setCompany({ ...company, address_zip: e.target.value })}
                      placeholder="ZIP Code"
                    />
                  </div>
                </Grid>
              </Card>

              {/* NAICS & Certifications */}
              <Card>
                <Flex className="gap-2 mb-4" alignItems="center">
                  <Award className="h-5 w-5 text-violet-600" />
                  <Title>NAICS Codes & Certifications</Title>
                </Flex>
                <Text className="text-gray-500 mb-6">Your business classifications and certifications</Text>

                <div className="space-y-6">
                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">NAICS Codes (Up to 10)</Text>
                    <MultiSelect
                      options={naicsOptions}
                      selected={company.naics_codes}
                      onChange={(values) => setCompany({ ...company, naics_codes: values })}
                      placeholder="Search and select NAICS codes..."
                      maxItems={10}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Selected: {company.naics_codes.length}/10
                    </Text>
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Set-Aside Certifications</Text>
                    <MultiSelect
                      options={setAsideOptions}
                      selected={company.set_asides}
                      onChange={(values) => setCompany({ ...company, set_asides: values })}
                      placeholder="Select your certifications..."
                    />
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Typical Contract Value Range</Text>
                    <Select
                      value={contractRanges.findIndex(r =>
                        r.min === company.contract_value_min && r.max === company.contract_value_max
                      ).toString()}
                      onValueChange={(v) => {
                        const range = contractRanges[parseInt(v)]
                        if (range) {
                          setCompany({
                            ...company,
                            contract_value_min: range.min,
                            contract_value_max: range.max
                          })
                        }
                      }}
                    >
                      <SelectItem value="-1">Select range...</SelectItem>
                      {contractRanges.map((range, index) => (
                        <SelectItem key={range.label} value={index.toString()}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Geographic Preferences</Text>
                    <MultiSelect
                      options={[
                        { value: 'Nationwide', label: 'Nationwide' },
                        ...stateOptions
                      ]}
                      selected={company.geographic_preferences}
                      onChange={(values) => setCompany({ ...company, geographic_preferences: values })}
                      placeholder="Select states or Nationwide..."
                    />
                  </div>
                </div>
              </Card>

              {/* Capabilities Statement */}
              <Card>
                <Flex className="gap-2 mb-4" alignItems="center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <Title>Capabilities Statement</Title>
                </Flex>
                <Text className="text-gray-500 mb-6">Your company's core competencies and strengths</Text>

                <Textarea
                  rows={12}
                  value={company.capabilities || ''}
                  onChange={(e) => setCompany({ ...company, capabilities: e.target.value })}
                  placeholder="Describe your company's core competencies, key differentiators, and relevant experience..."
                />
                <Text className="text-xs text-gray-500 mt-2">
                  {company.capabilities?.split(/\s+/).filter(Boolean).length || 0}/500 words
                </Text>
              </Card>

              {/* Submit Buttons */}
              <Flex justifyContent="end" className="gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </Flex>
            </motion.div>
          </form>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Suggestions Review Panel */}
            {selectedDocumentForSuggestions && (
              <DocumentSuggestions
                documentId={selectedDocumentForSuggestions.id}
                onApplied={handleSuggestionsApplied}
                onDismiss={handleSuggestionsDismissed}
              />
            )}

            {/* Pending Suggestions Alert */}
            {pendingSuggestionsCount > 0 && !selectedDocumentForSuggestions && (
              <Card className="bg-blue-50 border-blue-200">
                <Flex className="gap-3" alignItems="center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <Text className="font-medium text-blue-900">Suggestions Available</Text>
                    <Text className="text-sm text-blue-700">
                      {pendingSuggestionsCount} document{pendingSuggestionsCount > 1 ? 's have' : ' has'} extracted suggestions ready to apply to your profile.
                    </Text>
                  </div>
                </Flex>
              </Card>
            )}

            <DocumentUpload
              documentType="capability_statement"
              title="Capability Statement"
              description="Upload your company's capability statement PDF for AI analysis"
              onUploadComplete={reloadDocuments}
              onExtractionComplete={handleExtractionComplete}
            />

            <Card>
              <Flex className="gap-2 mb-4" alignItems="center">
                <FileText className="h-5 w-5 text-blue-600" />
                <Title>Uploaded Documents</Title>
              </Flex>
              <Text className="text-gray-500 mb-6">Manage your uploaded documents</Text>

              <DocumentList
                documents={documents}
                onDocumentDeleted={reloadDocuments}
                onViewSuggestions={handleViewSuggestions}
              />
            </Card>
          </motion.div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CertificationForm
              certifications={certifications}
              onCertificationChange={reloadCertifications}
            />
          </motion.div>
        )}

        {/* Past Performance Tab */}
        {activeTab === 'past-performance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PastPerformanceForm
              records={pastPerformances}
              onRecordChange={reloadPastPerformances}
            />
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <Flex className="gap-2 mb-4" alignItems="center">
                <Bell className="h-5 w-5 text-amber-600" />
                <Title>Notification Preferences</Title>
              </Flex>
              <Text className="text-gray-500 mb-6">
                Choose how often you want to receive email notifications about new opportunities
              </Text>

              <div className="space-y-3">
                {[
                  { value: 'realtime', title: 'Real-time', description: 'Get notified immediately when new BID recommendations are found' },
                  { value: 'daily', title: 'Daily Digest', description: 'Receive a daily summary of new opportunities and upcoming deadlines at 8 AM', recommended: true },
                  { value: 'weekly', title: 'Weekly Summary', description: 'Get a weekly roundup of opportunities every Monday morning' },
                  { value: 'none', title: 'No Emails', description: 'Turn off all email notifications (you can still view opportunities in the app)' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      emailFrequency === option.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="emailFrequency"
                      value={option.value}
                      checked={emailFrequency === option.value}
                      onChange={(e) => setEmailFrequency(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Flex alignItems="center" className="gap-2">
                        <Text className="font-medium">{option.title}</Text>
                        {option.recommended && (
                          <Badge color="blue" size="xs">Recommended</Badge>
                        )}
                      </Flex>
                      <Text className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </Text>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleEmailPreferencesSubmit}
                  disabled={savingEmail}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {savingEmail ? 'Saving...' : 'Save Email Preferences'}
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* AI Settings Tab */}
        {activeTab === 'ai-settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <BulkRescoreButton />

            <Card>
              <Flex className="gap-2 mb-4" alignItems="center">
                <Zap className="h-5 w-5 text-violet-600" />
                <Title>AI Evaluation Settings</Title>
              </Flex>
              <Text className="text-gray-500 mb-6">
                Configure how AI evaluates opportunities for your company
              </Text>

              <Text className="text-gray-700">
                AI evaluations are automatically updated when you change your company profile.
                The AI considers your NAICS codes, certifications, capabilities, and past performance
                when scoring opportunities.
              </Text>

              <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Flex className="gap-3" alignItems="start">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Text className="font-medium text-blue-900">Pro Tip</Text>
                    <Text className="text-sm text-blue-700 mt-1">
                      Keep your profile up to date for the most accurate AI recommendations.
                      Upload your capability statement and past performance documents to improve scoring accuracy.
                    </Text>
                  </div>
                </Flex>
              </Card>
            </Card>
          </motion.div>
        )}
    </main>
  )
}
