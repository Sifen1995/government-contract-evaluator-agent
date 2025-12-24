import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Award,
  PieChart,
  BarChart3,
  FileSearch,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { getAwardStats, getOpportunityStats, getPipelineStats } from "@/lib/analytics";

const COLORS = [
  "hsl(174, 72%, 46%)",
  "hsl(206, 100%, 60%)",
  "hsl(152, 76%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(215, 20%, 65%)",
  "hsl(340, 82%, 52%)",
  "hsl(280, 68%, 55%)",
  "hsl(200, 95%, 50%)",
];

function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  index,
  isPrimary,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  index: number;
  isPrimary?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="stat">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="w-5 h-5 text-primary" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className={`text-3xl font-display font-bold ${isPrimary ? "text-primary" : ""}`}>
              {value}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AnalyticsPage() {
  // Fetch all analytics data
  const { data: awardStats, isLoading: awardsLoading } = useQuery({
    queryKey: ["analytics", "awards"],
    queryFn: getAwardStats,
  });

  const { data: opportunityStats, isLoading: oppsLoading } = useQuery({
    queryKey: ["analytics", "opportunities"],
    queryFn: getOpportunityStats,
  });

  const { data: pipelineStats, isLoading: pipelineLoading } = useQuery({
    queryKey: ["analytics", "pipeline"],
    queryFn: getPipelineStats,
  });

  const isLoading = awardsLoading || oppsLoading || pipelineLoading;

  // Transform data for charts
  const topAgenciesData = awardStats?.top_agencies.slice(0, 5).map((a) => ({
    name: a.agency?.slice(0, 20) || "Unknown",
    value: a.count,
  })) || [];

  const naicsData = awardStats?.naics_breakdown.slice(0, 5).map((n, i) => ({
    name: n.naics || "Other",
    value: n.count,
    label: n.naics || "Other",
  })) || [];

  const recommendationData = opportunityStats
    ? [
        { name: "BID", value: opportunityStats.bid_recommendations, color: "hsl(152, 76%, 50%)" },
        { name: "NO_BID", value: opportunityStats.no_bid_recommendations, color: "hsl(0, 72%, 51%)" },
        { name: "RESEARCH", value: opportunityStats.research_recommendations, color: "hsl(38, 92%, 50%)" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Award insights and market intelligence
          </p>
        </div>

        {/* Top Stats - Awards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Awards Tracked"
            value={awardStats?.total_awards.toLocaleString() ?? 0}
            icon={Award}
            loading={awardsLoading}
            index={0}
          />
          <StatCard
            title="Total Award Value"
            value={awardStats ? formatCurrency(awardStats.total_award_value) : "$0"}
            icon={DollarSign}
            loading={awardsLoading}
            index={1}
            isPrimary
          />
          <StatCard
            title="Avg Award Value"
            value={awardStats ? formatCurrency(awardStats.avg_award_value) : "$0"}
            icon={TrendingUp}
            loading={awardsLoading}
            index={2}
          />
        </div>

        {/* Opportunity Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Opportunities"
            value={opportunityStats?.total_opportunities.toLocaleString() ?? 0}
            icon={FileSearch}
            loading={oppsLoading}
            index={0}
          />
          <StatCard
            title="Active Opportunities"
            value={opportunityStats?.active_opportunities.toLocaleString() ?? 0}
            icon={Target}
            loading={oppsLoading}
            index={1}
          />
          <StatCard
            title="Avg Fit Score"
            value={opportunityStats?.avg_fit_score ? `${opportunityStats.avg_fit_score.toFixed(0)}%` : "N/A"}
            icon={TrendingUp}
            loading={oppsLoading}
            index={2}
          />
          <StatCard
            title="Avg Win Probability"
            value={opportunityStats?.avg_win_probability ? `${opportunityStats.avg_win_probability.toFixed(0)}%` : "N/A"}
            icon={Award}
            loading={oppsLoading}
            index={3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Awards by Agency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Top Awarding Agencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {awardsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : topAgenciesData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Building2 className="w-12 h-12 mb-4 opacity-50" />
                    <p>No agency data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topAgenciesData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={120}
                        tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + "..." : v}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value, "Awards"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* NAICS Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  NAICS Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {awardsLoading ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : naicsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                    <PieChart className="w-12 h-12 mb-4 opacity-50" />
                    <p>No NAICS data available</p>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ResponsiveContainer width="50%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={naicsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {naicsData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {naicsData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-muted-foreground">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recommendation Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                AI Recommendation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oppsLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : recommendationData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                  <p>No recommendation data available</p>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="60%" height={300}>
                    <BarChart data={recommendationData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {recommendationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-4">
                    {recommendationData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-2xl font-display font-bold">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Evaluated</span>
                        <span className="text-xl font-semibold">
                          {opportunityStats?.total_evaluations.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Pipeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineLoading ? (
                <div className="flex items-center justify-center h-[100px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="text-center p-4 rounded-lg bg-blue-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Watching</p>
                    <p className="text-3xl font-display font-bold text-blue-400">
                      {pipelineStats?.watching ?? 0}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Bidding</p>
                    <p className="text-3xl font-display font-bold text-yellow-400">
                      {pipelineStats?.bidding ?? 0}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Won</p>
                    <p className="text-3xl font-display font-bold text-green-400">
                      {pipelineStats?.won ?? 0}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Lost</p>
                    <p className="text-3xl font-display font-bold text-red-400">
                      {pipelineStats?.lost ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
