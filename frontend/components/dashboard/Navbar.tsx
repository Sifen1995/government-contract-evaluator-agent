'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Text } from '@tremor/react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Search,
  Kanban,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Bell,
  Menu,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface NavbarProps {
  user: {
    email: string
    first_name?: string
  }
  onLogout: () => void
  notificationCount?: number
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/agencies', label: 'Agencies', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar({ user, onLogout, notificationCount = 0 }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GovAI
                </span>
              </motion.div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </motion.button>

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <Text className="text-sm font-medium text-gray-900">
                  {user.first_name || 'User'}
                </Text>
                <Text className="text-xs text-gray-500">{user.email}</Text>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="text-white font-semibold text-sm">
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </span>
              </motion.div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 mt-2 border-t"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
