'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { refreshEvaluation } from '@/lib/rescoring'
import { RefreshEvaluationResponse } from '@/types/rescoring'

interface StaleEvaluationBannerProps {
  evaluationId: string;
  isStale: boolean;
  onRefreshComplete?: (newEvaluation: RefreshEvaluationResponse) => void;
}

export function StaleEvaluationBanner({
  evaluationId,
  isStale,
  onRefreshComplete,
}: StaleEvaluationBannerProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isStale) {
    return null
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const newEvaluation = await refreshEvaluation(evaluationId)
      onRefreshComplete?.(newEvaluation)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to refresh evaluation')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 text-xl">⚠️</div>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800">
            Evaluation Based on Old Profile
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Your company profile has changed since this evaluation was created.
            The scores and recommendations may no longer be accurate.
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white hover:bg-yellow-100 border-yellow-300"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Evaluation'}
        </Button>
      </div>
    </div>
  )
}
