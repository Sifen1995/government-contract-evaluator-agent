'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { getStats, triggerDiscovery } from '@/lib/opportunities'
import { OpportunityStats } from '@/types/opportunity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const [checkingCompany, setCheckingCompany] = useState(true)
  const [stats, setStats] = useState<OpportunityStats | null>(null)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const checkCompanyProfile = async () => {
      if (!user) return

      try {
        await api.get('/company/me')
        setHasCompany(true)

        // Load stats
        try {
          const statsData = await getStats()
          setStats(statsData)
        } catch (err) {
          console.error('Error loading stats:', err)
        }
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
      alert('Discovery triggered! Check back in a few minutes for new opportunities.')

      // Reload stats after a delay
      setTimeout(async () => {
        const statsData = await getStats()
        setStats(statsData)
      }, 2000)
    } catch (error) {
      console.error('Error triggering discovery:', error)
      alert('Failed to trigger discovery. Please try again.')
    } finally {
      setTriggering(false)
    }
  }

  if (loading || checkingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !hasCompany) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">GovAI</h1>
              <div className="flex gap-4">
                <Button variant="ghost" className="text-blue-600">
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                  Opportunities
                </Button>
                <Button variant="ghost" onClick={() => router.push('/pipeline')}>
                  Pipeline
                </Button>
                <Button variant="ghost" onClick={() => router.push('/analytics')}>
                 Analytics
               </Button>

                <Button variant="ghost" onClick={() => router.push('/settings')}>
                  Settings
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user.email}
              </span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome{user.first_name ? `, ${user.first_name}` : ''}!
          </h2>
          <p className="text-gray-600">
            Your AI-powered government contract discovery dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/opportunities')}>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-blue-600">
                {stats?.total_evaluations || 0}
              </CardTitle>
              <CardDescription>Total Opportunities Evaluated</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/opportunities?filter=BID')}>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-green-600">
                {stats?.bid_recommendations || 0}
              </CardTitle>
              <CardDescription>BID Recommendations</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-purple-600">
                {stats?.avg_fit_score ? `${stats.avg_fit_score.toFixed(0)}%` : 'N/A'}
              </CardTitle>
              <CardDescription>Average Fit Score</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-orange-600">
                {stats?.avg_win_probability ? `${stats.avg_win_probability.toFixed(0)}%` : 'N/A'}
              </CardTitle>
              <CardDescription>Average Win Probability</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push('/opportunities')}
                className="w-full"
                variant="default"
              >
                View All Opportunities →
              </Button>
              <Button
                onClick={handleTriggerDiscovery}
                disabled={triggering}
                className="w-full"
                variant="outline"
              >
                {triggering ? 'Triggering Discovery...' : '🔄 Trigger Manual Discovery'}
              </Button>
              <p className="text-xs text-gray-500">
                Discovery runs automatically every 15 minutes. Use manual trigger to search immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Your setup journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Create your account</p>
                    <p className="text-sm text-gray-600">You've successfully registered!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Complete company profile</p>
                    <p className="text-sm text-gray-600">Update anytime in Settings</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">AI-powered discovery active</p>
                    <p className="text-sm text-gray-600">Opportunities evaluated automatically</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Week 5 Complete! 🎉</CardTitle>
            <CardDescription>Pipeline management and email notifications are live</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              You now have access to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Automated SAM.gov opportunity discovery (every 15 minutes)</li>
              <li>AI-powered evaluation using GPT-4</li>
              <li>BID/NO_BID/RESEARCH recommendations</li>
              <li>Fit scores and win probability estimates</li>
              <li>Detailed analysis with strengths and weaknesses</li>
              <li>Pipeline management with Kanban-style board (WATCHING → BIDDING → WON/LOST)</li>
              <li>Filter and sort by AI scores</li>
              <li>View opportunity details and SAM.gov links</li>
              <li>Daily email digest with new BID recommendations</li>
              <li>Deadline reminder emails (1, 3, and 7 days before)</li>
              <li>Email notification preferences (real-time, daily, weekly, or none)</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4">
              Coming in Week 6: Bug fixes, optimization, and production deployment
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
