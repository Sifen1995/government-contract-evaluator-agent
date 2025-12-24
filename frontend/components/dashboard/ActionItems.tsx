'use client'

import { Card, Title, Text, Flex, Badge, Button, Color } from '@tremor/react'
import { motion } from 'framer-motion'
import { AlertCircle, Clock, RefreshCw, FileText, Zap } from 'lucide-react'

interface ActionItemsProps {
  staleCount?: number
  upcomingDeadlines?: number
  newOpportunities?: number
  onTriggerDiscovery?: () => void
  onRescore?: () => void
  isDiscovering?: boolean
}

export function ActionItems({
  staleCount = 0,
  upcomingDeadlines = 0,
  newOpportunities = 0,
  onTriggerDiscovery,
  onRescore,
  isDiscovering = false,
}: ActionItemsProps) {
  const allActions = [
    {
      id: 'stale',
      icon: RefreshCw,
      title: 'Stale Evaluations',
      description: 'Profile changed - evaluations need refresh',
      count: staleCount,
      color: 'amber' as Color,
      action: onRescore,
      actionLabel: 'Rescore All',
      show: staleCount > 0,
    },
    {
      id: 'deadlines',
      icon: Clock,
      title: 'Upcoming Deadlines',
      description: 'Opportunities closing soon',
      count: upcomingDeadlines,
      color: 'rose' as Color,
      action: undefined,
      actionLabel: 'View',
      show: upcomingDeadlines > 0,
    },
    {
      id: 'new',
      icon: Zap,
      title: 'New Opportunities',
      description: 'Recently discovered matches',
      count: newOpportunities,
      color: 'emerald' as Color,
      action: undefined,
      actionLabel: 'Review',
      show: newOpportunities > 0,
    },
  ]

  const actions = allActions.filter(a => a.show)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <Flex alignItems="center" justifyContent="between">
          <div>
            <Title>Action Items</Title>
            <Text className="text-tremor-content">Things that need your attention</Text>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            loading={isDiscovering}
            onClick={onTriggerDiscovery}
          >
            {isDiscovering ? 'Discovering...' : 'Discover Now'}
          </Button>
        </Flex>

        <div className="mt-6 space-y-4">
          {actions.length > 0 ? (
            actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  action.color === 'amber' ? 'border-amber-500 bg-amber-50' :
                  action.color === 'rose' ? 'border-rose-500 bg-rose-50' :
                  action.color === 'emerald' ? 'border-emerald-500 bg-emerald-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <Flex alignItems="start" justifyContent="between">
                  <Flex alignItems="start" className="gap-3">
                    <action.icon className={`h-5 w-5 mt-0.5 ${
                      action.color === 'amber' ? 'text-amber-600' :
                      action.color === 'rose' ? 'text-rose-600' :
                      action.color === 'emerald' ? 'text-emerald-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <Flex alignItems="center" className="gap-2">
                        <Text className="font-medium">{action.title}</Text>
                        <Badge color={action.color} size="xs">
                          {action.count}
                        </Badge>
                      </Flex>
                      <Text className="text-tremor-content-subtle text-sm">
                        {action.description}
                      </Text>
                    </div>
                  </Flex>
                  {action.action && (
                    <Button
                      size="xs"
                      variant="light"
                      color={action.color}
                      onClick={action.action}
                    >
                      {action.actionLabel}
                    </Button>
                  )}
                </Flex>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎉</div>
              <Text className="text-tremor-content font-medium">All caught up!</Text>
              <Text className="text-tremor-content-subtle text-sm">
                No pending actions at the moment
              </Text>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-tremor-border">
          <Text className="text-xs text-tremor-content-subtle">
            Discovery runs automatically every 15 minutes
          </Text>
        </div>
      </Card>
    </motion.div>
  )
}
