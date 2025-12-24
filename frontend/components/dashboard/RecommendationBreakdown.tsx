'use client'

import { Card, Title, BarList, Flex, Text, Bold } from '@tremor/react'
import { motion } from 'framer-motion'

interface RecommendationBreakdownProps {
  stats: {
    bid_recommendations: number
    no_bid_recommendations: number
    research_recommendations: number
  } | null
}

export function RecommendationBreakdown({ stats }: RecommendationBreakdownProps) {
  const data = [
    {
      name: 'BID',
      value: stats?.bid_recommendations || 0,
      icon: () => <span className="mr-2">✅</span>,
      color: 'emerald',
    },
    {
      name: 'RESEARCH',
      value: stats?.research_recommendations || 0,
      icon: () => <span className="mr-2">🔍</span>,
      color: 'blue',
    },
    {
      name: 'NO BID',
      value: stats?.no_bid_recommendations || 0,
      icon: () => <span className="mr-2">⏭️</span>,
      color: 'slate',
    },
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="h-full">
        <Title>AI Recommendations</Title>
        <Text className="mt-1 text-tremor-content">
          How AI evaluated your opportunities
        </Text>

        <Flex className="mt-6">
          <Text>
            <Bold>Category</Bold>
          </Text>
          <Text>
            <Bold>Count</Bold>
          </Text>
        </Flex>

        <BarList
          data={data}
          className="mt-4"
          color="blue"
          showAnimation
        />

        <div className="mt-6 pt-4 border-t border-tremor-border">
          <Flex>
            <Text className="text-tremor-content">Total Analyzed</Text>
            <Text className="font-semibold">{total}</Text>
          </Flex>
          {total > 0 && (
            <Flex className="mt-2">
              <Text className="text-tremor-content">BID Rate</Text>
              <Text className="font-semibold text-emerald-600">
                {((stats?.bid_recommendations || 0) / total * 100).toFixed(0)}%
              </Text>
            </Flex>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
