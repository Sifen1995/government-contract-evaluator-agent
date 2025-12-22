'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error')
      setMessage('No unsubscribe token provided')
      return
    }

    setStatus('loading')

    try {
      await api.get(`/auth/unsubscribe/${token}`)
      setStatus('success')
      setMessage('You have been successfully unsubscribed from all GovAI emails.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Unsubscribe failed. The link may be invalid.')
    }
  }

  // Auto-unsubscribe if token is present (for one-click unsubscribe)
  useEffect(() => {
    if (token && status === 'idle') {
      handleUnsubscribe()
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unsubscribe from Emails</CardTitle>
          <CardDescription>
            {status === 'idle' && 'Click below to unsubscribe from GovAI emails'}
            {status === 'loading' && 'Processing your request...'}
            {status === 'success' && 'Unsubscribe successful'}
            {status === 'error' && 'Unsubscribe failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to unsubscribe from all GovAI email notifications?
              </p>
              <p className="text-sm text-gray-500">
                You will no longer receive daily digests or deadline reminders.
              </p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Successfully unsubscribed</p>
              <p className="text-sm mt-1">{message}</p>
              <p className="text-sm mt-2">
                You can re-enable notifications anytime from your account settings.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Unsubscribe failed</p>
              <p className="text-sm mt-1">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === 'idle' && (
            <>
              <Button
                onClick={handleUnsubscribe}
                variant="destructive"
                className="w-full"
              >
                Yes, unsubscribe me
              </Button>
              <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
                Cancel and go back
              </Link>
            </>
          )}

          {status === 'success' && (
            <div className="w-full space-y-2">
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  Manage Email Preferences
                </Button>
              </Link>
              <p className="text-sm text-center text-gray-600">
                <Link href="/" className="text-blue-600 hover:underline">
                  Go to homepage
                </Link>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full space-y-2">
              <Button onClick={handleUnsubscribe} className="w-full">
                Try again
              </Button>
              <p className="text-sm text-center text-gray-600">
                <Link href="/" className="text-blue-600 hover:underline">
                  Go to homepage
                </Link>
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
