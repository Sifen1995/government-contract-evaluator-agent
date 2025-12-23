'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStaleCount, rescoreAll } from '@/lib/rescoring'
import { StaleCountResponse, RescoreAllResponse } from '@/types/rescoring'

interface BulkRescoreButtonProps {
  onRescoreComplete?: (result: RescoreAllResponse) => void;
}

export function BulkRescoreButton({ onRescoreComplete }: BulkRescoreButtonProps) {
  const [staleInfo, setStaleInfo] = useState<StaleCountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [rescoring, setRescoring] = useState(false)
  const [result, setResult] = useState<RescoreAllResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStaleCount = async () => {
      try {
        const data = await getStaleCount()
        setStaleInfo(data)
      } catch (err) {
        console.error('Error loading stale count:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStaleCount()
  }, [])

  const handleRescore = async () => {
    if (!staleInfo || staleInfo.stale_count === 0) return

    const confirmed = confirm(
      `This will re-evaluate ${staleInfo.stale_count} opportunities using your current profile. ` +
      `This may take a few minutes. Continue?`
    )

    if (!confirmed) return

    setRescoring(true)
    setError(null)
    setResult(null)

    try {
      const rescoreResult = await rescoreAll()
      setResult(rescoreResult)
      onRescoreComplete?.(rescoreResult)

      // Refresh stale count
      const newStaleInfo = await getStaleCount()
      setStaleInfo(newStaleInfo)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to re-score evaluations')
    } finally {
      setRescoring(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Re-evaluate Opportunities</CardTitle>
          <CardDescription>Keep your evaluations up to date with your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasStaleEvaluations = staleInfo && staleInfo.stale_count > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Re-evaluate Opportunities</CardTitle>
        <CardDescription>Keep your evaluations up to date with your profile</CardDescription>
      </CardHeader>
      <CardContent>
        {hasStaleEvaluations ? (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">{staleInfo.stale_count}</span> of{' '}
                <span className="font-medium">{staleInfo.total_evaluations}</span> evaluations
                were created using an older version of your profile.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Re-evaluating will update scores to reflect your current capabilities and certifications.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            {result && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">
                Successfully re-scored {result.rescored_count} evaluations.
                {result.error_count > 0 && (
                  <span className="text-yellow-700"> ({result.error_count} errors)</span>
                )}
              </div>
            )}

            <Button
              onClick={handleRescore}
              disabled={rescoring}
              className="w-full"
            >
              {rescoring ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Re-evaluating...
                </span>
              ) : (
                `Re-evaluate ${staleInfo.stale_count} Opportunities`
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="text-3xl mb-2">✓</div>
            <p>All your evaluations are up to date!</p>
            {staleInfo && staleInfo.total_evaluations > 0 && (
              <p className="text-sm mt-1">
                {staleInfo.total_evaluations} evaluations using profile version {staleInfo.current_profile_version}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
