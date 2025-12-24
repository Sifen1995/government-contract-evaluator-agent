'use client'

import { Card, Title, DonutChart, Legend, Flex, Text, Bold } from '@tremor/react'
import { motion } from 'framer-motion'

interface PipelineChartProps {
  data: {
    watching: number
    bidding: number
    won: number
    lost: number
    passed: number
  } | null
  onSegmentClick?: (status: string) => void
}

export function PipelineChart({ data, onSegmentClick }: PipelineChartProps) {
  const chartData = [
    { name: 'Watching', value: data?.watching || 0, color: 'blue' },
    { name: 'Bidding', value: data?.bidding || 0, color: 'amber' },
    { name: 'Won', value: data?.won || 0, color: 'emerald' },
    { name: 'Lost', value: data?.lost || 0, color: 'rose' },
    { name: 'Passed', value: data?.passed || 0, color: 'slate' },
  ].filter(item => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  const winRate = data && (data.won + data.lost) > 0
    ? ((data.won / (data.won + data.lost)) * 100).toFixed(0)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="h-full">
        <Title>Pipeline Overview</Title>

        {total > 0 ? (
          <>
            <div className="mt-6">
              <DonutChart
                data={chartData}
                category="value"
                index="name"
                colors={['blue', 'amber', 'emerald', 'rose', 'slate']}
                className="h-52"
                showAnimation
                animationDuration={1000}
              />
            </div>

            <Legend
              categories={chartData.map(d => d.name)}
              colors={['blue', 'amber', 'emerald', 'rose', 'slate']}
              className="mt-4"
            />

            <Flex className="mt-6 pt-4 border-t border-tremor-border">
              <div>
                <Text className="text-tremor-default text-tremor-content">
                  Total in Pipeline
                </Text>
                <Text className="text-tremor-metric font-semibold">
                  {total}
                </Text>
              </div>
              {winRate && (
                <div className="text-right">
                  <Text className="text-tremor-default text-tremor-content">
                    Win Rate
                  </Text>
                  <Text className="text-tremor-metric font-semibold text-emerald-600">
                    {winRate}%
                  </Text>
                </div>
              )}
            </Flex>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-center">
            <div className="text-4xl mb-4">📊</div>
            <Text className="text-tremor-content">No opportunities in pipeline yet</Text>
            <Text className="text-tremor-content-subtle text-sm mt-1">
              Add opportunities from the Opportunities page
            </Text>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
