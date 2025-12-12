'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            GovAI
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            AI-Powered Government Contract Discovery
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Automatically find, evaluate, and track government contracting opportunities
            tailored to your business
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Discovery</h3>
              <p className="text-gray-600">
                Automatically finds opportunities from SAM.gov matching your NAICS codes and certifications
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI Evaluation</h3>
              <p className="text-gray-600">
                GPT-4 analyzes each opportunity and recommends BID/NO_BID with win probability
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2">Daily Digests</h3>
              <p className="text-gray-600">
                Get top matches delivered to your inbox with deadline reminders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
