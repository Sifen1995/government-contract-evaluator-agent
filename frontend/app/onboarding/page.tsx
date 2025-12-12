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
import { NAICSCode, SetAside, ContractRange, USState } from '@/types/reference'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  // Reference data
  const [naicsCodes, setNaicsCodes] = useState<NAICSCode[]>([])
  const [setAsides, setSetAsides] = useState<SetAside[]>([])
  const [contractRanges, setContractRanges] = useState<ContractRange[]>([])
  const [states, setStates] = useState<USState[]>([])
  const [legalStructures, setLegalStructures] = useState<string[]>([])

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    legal_structure: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    uei: '',
    naics_codes: [] as string[],
    set_asides: [] as string[],
    capabilities: '',
    contract_value_min: 0,
    contract_value_max: 0,
    geographic_preferences: [] as string[],
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Load reference data
    const loadReferenceData = async () => {
      try {
        const response = await api.get('/reference/all')
        setNaicsCodes(response.data.naics_codes)
        setSetAsides(response.data.set_asides)
        setContractRanges(response.data.contract_ranges)
        setStates(response.data.states)
        setLegalStructures(response.data.legal_structures)
      } catch (err) {
        console.error('Failed to load reference data:', err)
      }
    }

    loadReferenceData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/company/', formData)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create company profile')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const naicsOptions = naicsCodes.map(n => ({ value: n.code, label: `${n.code} - ${n.title}` }))
  const setAsideOptions = setAsides.map(s => ({ value: s.code, label: s.name }))
  const stateOptions = states.map(s => ({ value: s.code, label: s.name }))

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Company Profile</h1>
          <p className="text-gray-600">Step {step} of 3</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Company Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300">
              <div className={`h-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">NAICS & Certifications</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-300">
              <div className={`h-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
            </div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Capabilities</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && 'Company Information'}
                {step === 2 && 'NAICS Codes & Certifications'}
                {step === 3 && 'Capabilities & Preferences'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Tell us about your company'}
                {step === 2 && 'Select your NAICS codes and certifications'}
                {step === 3 && 'Describe your capabilities and preferences'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_structure">Legal Structure</Label>
                    <NativeSelect
                      id="legal_structure"
                      value={formData.legal_structure}
                      onChange={(e) => setFormData({ ...formData, legal_structure: e.target.value })}
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
                      value={formData.uei}
                      onChange={(e) => setFormData({ ...formData, uei: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Your SAM.gov Unique Entity Identifier (optional)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_street">Street Address</Label>
                      <Input
                        id="address_street"
                        type="text"
                        value={formData.address_street}
                        onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_city">City</Label>
                      <Input
                        id="address_city"
                        type="text"
                        value={formData.address_city}
                        onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_state">State</Label>
                      <NativeSelect
                        id="address_state"
                        value={formData.address_state}
                        onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
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
                        placeholder="12345"
                        value={formData.address_zip}
                        onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>NAICS Codes * (Select up to 10)</Label>
                    <MultiSelect
                      options={naicsOptions}
                      selected={formData.naics_codes}
                      onChange={(values) => setFormData({ ...formData, naics_codes: values })}
                      placeholder="Search and select NAICS codes..."
                      maxItems={10}
                    />
                    <p className="text-xs text-gray-500">
                      Selected: {formData.naics_codes.length}/10 - Choose the codes that best describe your business
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Set-Aside Certifications</Label>
                    <MultiSelect
                      options={setAsideOptions}
                      selected={formData.set_asides}
                      onChange={(values) => setFormData({ ...formData, set_asides: values })}
                      placeholder="Select your certifications..."
                    />
                    <p className="text-xs text-gray-500">
                      Select all that apply (8(a), WOSB, SDVOSB, HUBZone, etc.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_range">Typical Contract Value Range</Label>
                    <NativeSelect
                      id="contract_range"
                      onChange={(e) => {
                        const range = contractRanges[parseInt(e.target.value)]
                        if (range) {
                          setFormData({
                            ...formData,
                            contract_value_min: range.min,
                            contract_value_max: range.max
                          })
                        }
                      }}
                    >
                      <option value="">Select range...</option>
                      {contractRanges.map((range, index) => (
                        <option key={range.label} value={index}>
                          {range.label}
                        </option>
                      ))}
                    </NativeSelect>
                    <p className="text-xs text-gray-500">
                      What size contracts do you typically pursue?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Geographic Preferences</Label>
                    <MultiSelect
                      options={[
                        { value: 'Nationwide', label: 'Nationwide' },
                        ...stateOptions
                      ]}
                      selected={formData.geographic_preferences}
                      onChange={(values) => setFormData({ ...formData, geographic_preferences: values })}
                      placeholder="Select states or Nationwide..."
                    />
                    <p className="text-xs text-gray-500">
                      Where are you willing to work?
                    </p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="capabilities">Capabilities Statement * (Max 500 words)</Label>
                    <Textarea
                      id="capabilities"
                      rows={12}
                      placeholder="Describe your company's core competencies, past performance, differentiators, and key strengths..."
                      value={formData.capabilities}
                      onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      {formData.capabilities?.split(/\s+/).filter(Boolean).length || 0}/500 words
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Review Your Information</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Company:</strong> {formData.name}</p>
                      <p><strong>NAICS Codes:</strong> {formData.naics_codes.length} selected</p>
                      <p><strong>Certifications:</strong> {formData.set_asides.length || 'None'}</p>
                      <p><strong>Location:</strong> {formData.address_city}, {formData.address_state || 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <div className="p-6 bg-gray-50 border-t flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !formData.name) ||
                    (step === 2 && formData.naics_codes.length === 0)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading || !formData.capabilities}>
                  {loading ? 'Creating Profile...' : 'Complete Onboarding'}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
