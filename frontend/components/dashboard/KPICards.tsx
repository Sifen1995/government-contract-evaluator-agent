'use client'

import {
  Card,
  Metric,
  Text,
  Flex,
  BadgeDelta,
  Grid,
  ProgressBar,
} from '@tremor/react'
import { motion } from 'framer-motion'
import { TrendingUp, Target, Zap, Trophy } from 'lucide-react'

interface KPICardsProps {
  stats: {
    total_evaluations: number
    bid_recommendations: number
    no_bid_recommendations: number
    research_recommendations: number
    avg_fit_score?: number
    avg_win_probability?: number
  } | null
  onCardClick?: (filter: string) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  }),
}

export function KPICards({ stats, onCardClick }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Evaluated',
      metric: stats?.total_evaluations || 0,
      icon: Zap,
      color: 'blue' as const,
      delta: '+12%',
      deltaType: 'increase' as const,
      filter: 'all',
      description: 'Opportunities analyzed by AI',
    },
    {
      title: 'BID Recommendations',
      metric: stats?.bid_recommendations || 0,
      icon: TrendingUp,
      color: 'emerald' as const,
      delta: '+8%',
      deltaType: 'increase' as const,
      filter: 'BID',
      description: 'High-potential matches',
    },
    {
      title: 'Avg Fit Score',
      metric: stats?.avg_fit_score ? `${stats.avg_fit_score.toFixed(0)}%` : 'N/A',
      icon: Target,
      color: 'violet' as const,
      progress: stats?.avg_fit_score || 0,
      filter: '',
      description: 'Profile match quality',
    },
    {
      title: 'Win Probability',
      metric: stats?.avg_win_probability ? `${stats.avg_win_probability.toFixed(0)}%` : 'N/A',
      icon: Trophy,
      color: 'amber' as const,
      progress: stats?.avg_win_probability || 0,
      filter: '',
      description: 'Estimated success rate',
    },
  ]

  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card
            className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
              kpi.filter ? 'hover:ring-2 hover:ring-blue-500' : ''
            }`}
            decoration="top"
            decorationColor={kpi.color}
            onClick={() => kpi.filter && onCardClick?.(kpi.filter)}
          >
            <Flex alignItems="start">
              <div className="truncate">
                <Text className="text-tremor-default text-tremor-content">
                  {kpi.title}
                </Text>
                <Metric className="mt-1 text-tremor-metric">
                  {kpi.metric}
                </Metric>
              </div>
              <div className={`p-2 rounded-lg ${
                kpi.color === 'blue' ? 'bg-blue-100' :
                kpi.color === 'emerald' ? 'bg-emerald-100' :
                kpi.color === 'violet' ? 'bg-violet-100' :
                kpi.color === 'amber' ? 'bg-amber-100' :
                'bg-gray-100'
              }`}>
                <kpi.icon className={`h-6 w-6 ${
                  kpi.color === 'blue' ? 'text-blue-600' :
                  kpi.color === 'emerald' ? 'text-emerald-600' :
                  kpi.color === 'violet' ? 'text-violet-600' :
                  kpi.color === 'amber' ? 'text-amber-600' :
                  'text-gray-600'
                }`} />
              </div>
            </Flex>

            {kpi.delta && (
              <Flex className="mt-4 space-x-2">
                <BadgeDelta deltaType={kpi.deltaType} size="xs">
                  {kpi.delta}
                </BadgeDelta>
                <Text className="text-tremor-default text-tremor-content truncate">
                  vs last month
                </Text>
              </Flex>
            )}

            {kpi.progress !== undefined && (
              <div className="mt-4">
                <ProgressBar value={kpi.progress} color={kpi.color} className="mt-2" />
              </div>
            )}

            <Text className="mt-2 text-xs text-tremor-content-subtle">
              {kpi.description}
            </Text>
          </Card>
        </motion.div>
      ))}
    </Grid>
  )
}
