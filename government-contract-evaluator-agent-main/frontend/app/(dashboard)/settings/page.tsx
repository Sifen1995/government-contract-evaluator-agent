'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelect } from '@/components/ui/multi-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Company } from '@/types/company'
import { NAICSCode, SetAside, ContractRange, USState } from '@/types/reference'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!company) return null

  const naicsOptions = naicsCodes.map(n => ({ value: n.code, label: `${n.code} - ${n.title}` }))
  const setAsideOptions = setAsides.map(s => ({ value: s.code, label: s.name }))
  const stateOptions = states.map(s => ({ value: s.code, label: s.name }))

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
                <Button variant="ghost" onClick={() => router.push('/pipeline')}>
                  Pipeline
                </Button>
                <Button variant="ghost" className="text-blue-600">
                  Settings
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Settings</h2>
          <p className="text-gray-600">Manage your company profile and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic information about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_structure">Legal Structure</Label>
                <NativeSelect
                  id="legal_structure"
                  value={company.legal_structure || ''}
                  onChange={(e) => setCompany({ ...company, legal_structure: e.target.value })}
                >
                  <option value="">Select structure...</option>
                  {legalStructures.map((structure) => (
                    <option key={structure} value={structure}>
                      {structure}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uei">UEI (Unique Entity Identifier)</Label>
                <Input
                  id="uei"
                  type="text"
                  placeholder="12-character SAM.gov UEI"
                  maxLength={12}
                  value={company.uei || ''}
                  onChange={(e) => setCompany({ ...company, uei: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    type="text"
                    value={company.address_street || ''}
                    onChange={(e) => setCompany({ ...company, address_street: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    type="text"
                    value={company.address_city || ''}
                    onChange={(e) => setCompany({ ...company, address_city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_state">State</Label>
                  <NativeSelect
                    id="address_state"
                    value={company.address_state || ''}
                    onChange={(e) => setCompany({ ...company, address_state: e.target.value })}
                  >
                    <option value="">Select state...</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_zip">ZIP Code</Label>
                  <Input
                    id="address_zip"
                    type="text"
                    value={company.address_zip || ''}
                    onChange={(e) => setCompany({ ...company, address_zip: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NAICS Codes & Certifications</CardTitle>
              <CardDescription>Your business classifications and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>NAICS Codes (Up to 10)</Label>
                <MultiSelect
                  options={naicsOptions}
                  selected={company.naics_codes}
                  onChange={(values) => setCompany({ ...company, naics_codes: values })}
                  placeholder="Search and select NAICS codes..."
                  maxItems={10}
                />
                <p className="text-xs text-gray-500">
                  Selected: {company.naics_codes.length}/10
                </p>
              </div>

              <div className="space-y-2">
                <Label>Set-Aside Certifications</Label>
                <MultiSelect
                  options={setAsideOptions}
                  selected={company.set_asides}
                  onChange={(values) => setCompany({ ...company, set_asides: values })}
                  placeholder="Select your certifications..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_range">Typical Contract Value Range</Label>
                <NativeSelect
                  id="contract_range"
                  value={contractRanges.findIndex(r =>
                    r.min === company.contract_value_min && r.max === company.contract_value_max
                  ).toString()}
                  onChange={(e) => {
                    const range = contractRanges[parseInt(e.target.value)]
                    if (range) {
                      setCompany({
                        ...company,
                        contract_value_min: range.min,
                        contract_value_max: range.max
                      })
                    }
                  }}
                >
                  <option value="-1">Select range...</option>
                  {contractRanges.map((range, index) => (
                    <option key={range.label} value={index}>
                      {range.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-2">
                <Label>Geographic Preferences</Label>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities Statement</CardTitle>
              <CardDescription>Your company's core competencies and strengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  rows={12}
                  value={company.capabilities || ''}
                  onChange={(e) => setCompany({ ...company, capabilities: e.target.value })}
                  placeholder="Describe your company's core competencies..."
                />
                <p className="text-xs text-gray-500">
                  {company.capabilities?.split(/\s+/).filter(Boolean).length || 0}/500 words
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Email Preferences Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h3>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how often you want to receive email notifications about new opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value="realtime"
                    checked={emailFrequency === 'realtime'}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Real-time</div>
                    <div className="text-sm text-gray-600">
                      Get notified immediately when new BID recommendations are found
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value="daily"
                    checked={emailFrequency === 'daily'}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Daily Digest (Recommended)</div>
                    <div className="text-sm text-gray-600">
                      Receive a daily summary of new opportunities and upcoming deadlines at 8 AM
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value="weekly"
                    checked={emailFrequency === 'weekly'}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Weekly Summary</div>
                    <div className="text-sm text-gray-600">
                      Get a weekly roundup of opportunities every Monday morning
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value="none"
                    checked={emailFrequency === 'none'}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">No Emails</div>
                    <div className="text-sm text-gray-600">
                      Turn off all email notifications (you can still view opportunities in the app)
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleEmailPreferencesSubmit}
                  disabled={savingEmail}
                >
                  {savingEmail ? 'Saving...' : 'Save Email Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
