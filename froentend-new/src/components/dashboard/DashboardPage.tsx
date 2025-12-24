import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileSearch,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Building2,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaleEvaluationAlert } from "@/components/dashboard/StaleEvaluationAlert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getStats, getEvaluations, triggerDiscovery } from "@/lib/opportunities";
import type { OpportunityStats, EvaluationWithOpportunity } from "@/types/opportunity";
import { isEvaluationStale } from "@/types/opportunity";
import { useState } from "react";

function getRecommendationBadge(recommendation: string) {
  switch (recommendation) {
    case "BID":
      return <Badge variant="bid">BID</Badge>;
    case "NO_BID":
      return <Badge variant="no-bid">NO BID</Badge>;
    case "RESEARCH":
      return <Badge variant="research">RESEARCH</Badge>;
    default:
      return null;
  }
}

function formatCurrency(value: number | undefined) {
  if (!value) return "N/A";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatDate(date: string | undefined) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  // Fetch recent evaluations
  const { data: evaluationsData, isLoading: evaluationsLoading, refetch: refetchEvaluations } = useQuery({
    queryKey: ["evaluations", { limit: 4 }],
    queryFn: () => getEvaluations({ limit: 4 }),
  });

  // Fetch pipeline counts
  const { data: watchingData } = useQuery({
    queryKey: ["evaluations", "watching"],
    queryFn: () => getEvaluations({ user_saved: "WATCHING", limit: 100 }),
  });

  const { data: biddingData } = useQuery({
    queryKey: ["evaluations", "bidding"],
    queryFn: () => getEvaluations({ user_saved: "BIDDING", limit: 100 }),
  });

  const { data: wonData } = useQuery({
    queryKey: ["evaluations", "won"],
    queryFn: () => getEvaluations({ user_saved: "WON", limit: 100 }),
  });

  const { data: lostData } = useQuery({
    queryKey: ["evaluations", "lost"],
    queryFn: () => getEvaluations({ user_saved: "LOST", limit: 100 }),
  });

  const handleTriggerDiscovery = async () => {
    setIsDiscovering(true);
    try {
      await triggerDiscovery(false);
      toast({
        title: "Discovery started",
        description: "New opportunities are being discovered. Check back shortly.",
      });
      // Refetch data after a delay
      setTimeout(() => {
        refetchStats();
        refetchEvaluations();
      }, 5000);
    } catch (err: any) {
      toast({
        title: "Discovery failed",
        description: err.response?.data?.detail || "Failed to trigger discovery",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const pipelineItems = [
    { status: "Watching", count: watchingData?.total || 0, color: "watching" },
    { status: "Bidding", count: biddingData?.total || 0, color: "bidding" },
    { status: "Won", count: wonData?.total || 0, color: "won" },
    { status: "Lost", count: lostData?.total || 0, color: "lost" },
  ];

  const winRate =
    (wonData?.total || 0) + (lostData?.total || 0) > 0
      ? Math.round(((wonData?.total || 0) / ((wonData?.total || 0) + (lostData?.total || 0))) * 100)
      : 0;

  const statCards = [
    {
      name: "Total Opportunities",
      value: stats?.total_opportunities?.toString() || "0",
      change: `${stats?.active_opportunities || 0} active`,
      icon: FileSearch,
    },
    {
      name: "BID Recommendations",
      value: stats?.bid_recommendations?.toString() || "0",
      change: stats?.total_evaluations
        ? `${Math.round((stats.bid_recommendations / stats.total_evaluations) * 100)}% of evaluated`
        : "0%",
      icon: ThumbsUp,
    },
    {
      name: "Avg Fit Score",
      value: stats?.avg_fit_score ? `${Math.round(stats.avg_fit_score)}%` : "N/A",
      change: `${stats?.total_evaluations || 0} evaluated`,
      icon: TrendingUp,
    },
    {
      name: "Pipeline Value",
      value: formatCurrency(
        evaluationsData?.evaluations
          ?.filter((e) => e.user_saved === "BIDDING" || e.user_saved === "WATCHING")
          ?.reduce((sum, e) => sum + (e.opportunity.contract_value || 0), 0)
      ),
      change: `${(biddingData?.total || 0) + (watchingData?.total || 0)} in pipeline`,
      icon: DollarSign,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ""}! Here's your contract discovery overview.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleTriggerDiscovery}
            disabled={isDiscovering}
          >
            {isDiscovering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Discover New
              </>
            )}
          </Button>
        </div>

        {/* Stale Evaluation Alert */}
        <StaleEvaluationAlert />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="stat" className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </CardTitle>
                  <stat.icon className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-3xl font-display font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Opportunities */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Opportunities</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/opportunities">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {evaluationsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))
                ) : evaluationsData?.evaluations?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No opportunities evaluated yet.</p>
                    <p className="text-sm">Click "Discover New" to find opportunities.</p>
                  </div>
                ) : (
                  evaluationsData?.evaluations?.map((evaluation, index) => {
                    const stale = isEvaluationStale(evaluation.updated_at);
                    return (
                      <motion.div
                        key={evaluation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link to={`/opportunities/${evaluation.opportunity.id}`}>
                          <Card variant="interactive" className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {getRecommendationBadge(evaluation.recommendation)}
                                  <Badge variant="score" className="font-mono">
                                    {evaluation.fit_score}%
                                  </Badge>
                                  {stale && (
                                    <Badge
                                      variant="outline"
                                      className="text-warning border-warning flex items-center gap-1"
                                    >
                                      <Clock className="w-3 h-3" />
                                      Stale
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold truncate">
                                  {evaluation.opportunity.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    {evaluation.opportunity.department || "Unknown Agency"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-primary">
                                  {formatCurrency(evaluation.opportunity.contract_value)}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(evaluation.opportunity.response_deadline)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Overview */}
          <div>
            <Card variant="elevated" className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pipeline</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/pipeline">
                    Manage
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineItems.map((item, index) => (
                  <motion.div
                    key={item.status}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: `hsl(var(--${item.color}))`,
                        }}
                      />
                      <span className="font-medium">{item.status}</span>
                    </div>
                    <span className="text-2xl font-display font-bold">{item.count}</span>
                  </motion.div>
                ))}

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-semibold text-success">{winRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card variant="glass">
          <CardContent className="py-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="hero" asChild>
                <Link to="/opportunities">
                  <FileSearch className="w-5 h-5 mr-2" />
                  Browse Opportunities
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/agencies">
                  <Building2 className="w-5 h-5 mr-2" />
                  Explore Agencies
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Update Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
