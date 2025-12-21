'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/* ---------------- TYPES ---------------- */

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

/* ---------------- PAGE ---------------- */

export default function AnalyticsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<AwardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  /* ---------------- DATA LOAD ---------------- */
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

  /* ---------------- HELPERS ---------------- */
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  /* ---------------- LOADING ---------------- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !stats) return null

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
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
                  Analytics
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Award Analytics</h2>
          <p className="text-gray-600">
            Competitive intelligence powered by USA Spending data
          </p>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Awards</CardDescription>
              <CardTitle className="text-3xl">{stats.total_awards}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Awarded Value</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {formatCurrency(stats.total_value)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Average Award Size</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {formatCurrency(stats.avg_award_value)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* TOP AGENCIES */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Awarding Agencies</CardTitle>
            <CardDescription>Agencies issuing the most contract value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_agencies.map((agency, index) => (
                <div
                  key={agency.agency}
                  className="flex justify-between items-center p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">
                      #{index + 1} {agency.agency}
                    </div>
                    <div className="text-sm text-gray-500">
                      {agency.total_awards} awards
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {formatCurrency(agency.total_value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TOP VENDORS */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
            <CardDescription>Most successful vendors by total award value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_vendors.map((vendor, index) => (
                <div
                  key={vendor.vendor}
                  className="flex justify-between items-center p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">
                      #{index + 1} {vendor.vendor}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vendor.total_awards} awards
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {formatCurrency(vendor.total_value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
