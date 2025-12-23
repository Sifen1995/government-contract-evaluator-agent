'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AgencyWithMatch } from '@/types/agency'
import { getRecommendedAgencies } from '@/lib/agencies'

interface RecommendedAgenciesProps {
  limit?: number;
  showViewAll?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

function getMatchColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-gray-600'
}

export function RecommendedAgencies({ limit = 5, showViewAll = true }: RecommendedAgenciesProps) {
  const router = useRouter()
  const [agencies, setAgencies] = useState<AgencyWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgencies = async () => {
      try {
        const response = await getRecommendedAgencies({ limit })
        setAgencies(response.agencies)
      } catch (err: any) {
        // Silently handle errors - this is an optional feature
        console.error('Error loading recommended agencies:', err)
        setError('Unable to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    loadAgencies()
  }, [limit])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies for Your Business</CardTitle>
          <CardDescription>Based on your profile and capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || agencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies for Your Business</CardTitle>
          <CardDescription>Based on your profile and capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            {error || 'Complete your company profile to see agency recommendations'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Agencies for Your Business</CardTitle>
        <CardDescription>Based on your profile and capabilities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agencies.map((agency, index) => (
            <div
              key={agency.id}
              className="p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/agencies/${agency.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-400">
                    {index + 1}.
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {agency.abbreviation || agency.name}
                    </h4>
                    {agency.abbreviation && (
                      <p className="text-sm text-gray-600">{agency.name}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      {agency.opportunity_count !== undefined && (
                        <span>{agency.opportunity_count} active opportunities</span>
                      )}
                      {agency.opportunity_count !== undefined && agency.avg_contract_value !== undefined && (
                        <span>•</span>
                      )}
                      {agency.avg_contract_value !== undefined && (
                        <span>Avg. value: {formatCurrency(agency.avg_contract_value)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getMatchColor(agency.match_score || 0)}`}>
                    {agency.match_score || 0}%
                  </span>
                  <p className="text-xs text-gray-500">match</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showViewAll && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/agencies')}
            >
              View All Agencies
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
