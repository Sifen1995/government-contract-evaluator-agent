import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Eye,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Building2,
  ArrowRight,
  Gavel,
  Trophy,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getEvaluations, updateEvaluation } from "@/lib/opportunities";
import type { EvaluationWithOpportunity, UserSavedStatus } from "@/types/opportunity";

type PipelineStatus = "WATCHING" | "BIDDING" | "WON" | "LOST";

const columns: { status: PipelineStatus; label: string; color: string; icon: any }[] = [
  { status: "WATCHING", label: "Watching", color: "watching", icon: Eye },
  { status: "BIDDING", label: "Bidding", color: "bidding", icon: Gavel },
  { status: "WON", label: "Won", color: "won", icon: Trophy },
  { status: "LOST", label: "Lost", color: "lost", icon: XCircle },
];

function formatCurrency(value: number | undefined) {
  if (!value) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PipelinePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch evaluations for each pipeline status
  const { data: watchingData, isLoading: watchingLoading } = useQuery({
    queryKey: ["evaluations", "pipeline", "WATCHING"],
    queryFn: () => getEvaluations({ user_saved: "WATCHING", limit: 100 }),
  });

  const { data: biddingData, isLoading: biddingLoading } = useQuery({
    queryKey: ["evaluations", "pipeline", "BIDDING"],
    queryFn: () => getEvaluations({ user_saved: "BIDDING", limit: 100 }),
  });

  const { data: wonData, isLoading: wonLoading } = useQuery({
    queryKey: ["evaluations", "pipeline", "WON"],
    queryFn: () => getEvaluations({ user_saved: "WON", limit: 100 }),
  });

  const { data: lostData, isLoading: lostLoading } = useQuery({
    queryKey: ["evaluations", "pipeline", "LOST"],
    queryFn: () => getEvaluations({ user_saved: "LOST", limit: 100 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ evaluationId, status }: { evaluationId: string; status: UserSavedStatus }) =>
      updateEvaluation(evaluationId, { user_saved: status }),
    onMutate: ({ evaluationId }) => {
      setUpdatingId(evaluationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations", "pipeline"] });
      toast({
        title: "Pipeline updated",
        description: "Opportunity status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const moveItem = (evaluationId: string, newStatus: UserSavedStatus) => {
    statusMutation.mutate({ evaluationId, status: newStatus });
  };

  const getColumnData = (status: PipelineStatus) => {
    switch (status) {
      case "WATCHING":
        return { data: watchingData, loading: watchingLoading };
      case "BIDDING":
        return { data: biddingData, loading: biddingLoading };
      case "WON":
        return { data: wonData, loading: wonLoading };
      case "LOST":
        return { data: lostData, loading: lostLoading };
    }
  };

  const getColumnValue = (evaluations: EvaluationWithOpportunity[] | undefined) => {
    if (!evaluations) return 0;
    return evaluations.reduce((sum, e) => sum + (e.opportunity.contract_value || 0), 0);
  };

  const totalWon = wonData?.total || 0;
  const totalLost = lostData?.total || 0;
  const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Pipeline</h1>
            <p className="text-muted-foreground">
              Track your opportunities from discovery to outcome
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-lg px-4 py-2">
              <span className="text-sm text-muted-foreground">Win Rate: </span>
              <span className="font-display font-bold text-success">
                {winRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {columns.map((col) => {
            const { data, loading } = getColumnData(col.status);
            const count = data?.total || 0;
            const value = getColumnValue(data?.evaluations);

            return (
              <Card key={col.status} variant="stat">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      {loading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <div
                          className="text-2xl font-display font-bold"
                          style={{ color: `hsl(var(--${col.color}))` }}
                        >
                          {count}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">{col.label}</p>
                    </div>
                    <div className="text-right">
                      {loading ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <div className="text-sm font-semibold text-primary">
                          {formatCurrency(value)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => {
            const { data, loading } = getColumnData(column.status);
            const evaluations = data?.evaluations || [];

            return (
              <div key={column.status} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(var(--${column.color}))` }}
                    />
                    <h3 className="font-semibold">{column.label}</h3>
                    <Badge variant="secondary" className="ml-1">
                      {evaluations.length}
                    </Badge>
                  </div>
                </div>

                {/* Column Content */}
                <div className="space-y-3 min-h-[200px]">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))
                  ) : evaluations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                      No items
                    </div>
                  ) : (
                    evaluations.map((evaluation, index) => (
                      <motion.div
                        key={evaluation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <Card variant="pipeline" className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <Link to={`/opportunities/${evaluation.opportunity.id}`}>
                                <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                                  {evaluation.opportunity.title}
                                </h4>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0"
                                    disabled={updatingId === evaluation.id}
                                  >
                                    {updatingId === evaluation.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="w-4 h-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {columns
                                    .filter((c) => c.status !== column.status)
                                    .map((c) => (
                                      <DropdownMenuItem
                                        key={c.status}
                                        onClick={() => moveItem(evaluation.id, c.status)}
                                      >
                                        <c.icon className="w-4 h-4 mr-2" />
                                        Move to {c.label}
                                      </DropdownMenuItem>
                                    ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => moveItem(evaluation.id, null)}
                                    className="text-destructive"
                                  >
                                    Remove from Pipeline
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">
                                {evaluation.opportunity.department || "Unknown"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-primary">
                                {formatCurrency(evaluation.opportunity.contract_value)}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(evaluation.opportunity.response_deadline)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge variant="score" className="text-xs">
                                {evaluation.fit_score}% fit
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Add */}
        <Card variant="glass">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <p className="text-muted-foreground">
                Add opportunities to your pipeline from the opportunities page
              </p>
              <Button variant="hero" asChild>
                <Link to="/opportunities">
                  Browse Opportunities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
