import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStats, getEvaluations } from "@/lib/opportunities";
import type { EvaluationWithOpportunity, Recommendation } from "@/types/opportunity";

function getRecommendationBadge(recommendation: Recommendation) {
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
    year: "numeric",
  });
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

const ITEMS_PER_PAGE = 20;

export function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Recommendation | null>(null);
  const [page, setPage] = useState(0);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  // Fetch evaluations with pagination and filters
  const { data: evaluationsData, isLoading: evaluationsLoading } = useQuery({
    queryKey: ["evaluations", { skip: page * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE, recommendation: filter }],
    queryFn: () =>
      getEvaluations({
        skip: page * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        recommendation: filter || undefined,
      }),
  });

  const evaluations = evaluationsData?.evaluations || [];
  const totalPages = Math.ceil((evaluationsData?.total || 0) / ITEMS_PER_PAGE);

  // Client-side search filter
  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      evaluation.opportunity.title.toLowerCase().includes(query) ||
      evaluation.opportunity.department?.toLowerCase().includes(query) ||
      evaluation.opportunity.naics_code?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Opportunities</h1>
            <p className="text-muted-foreground">
              AI-evaluated government contracts matching your profile
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card
            variant="stat"
            className={`cursor-pointer hover:border-primary/50 ${!filter ? "border-primary" : ""}`}
            onClick={() => {
              setFilter(null);
              setPage(0);
            }}
          >
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-display font-bold">
                  {stats?.total_evaluations || 0}
                </div>
              )}
              <p className="text-sm text-muted-foreground">Total Evaluated</p>
            </CardContent>
          </Card>
          <Card
            variant="stat"
            className={`cursor-pointer hover:border-bid/50 ${filter === "BID" ? "border-bid" : ""}`}
            onClick={() => {
              setFilter("BID");
              setPage(0);
            }}
          >
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-display font-bold text-bid">
                  {stats?.bid_recommendations || 0}
                </div>
              )}
              <p className="text-sm text-muted-foreground">Recommended to Bid</p>
            </CardContent>
          </Card>
          <Card
            variant="stat"
            className={`cursor-pointer hover:border-research/50 ${filter === "RESEARCH" ? "border-research" : ""}`}
            onClick={() => {
              setFilter("RESEARCH");
              setPage(0);
            }}
          >
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-display font-bold text-research">
                  {stats?.research_recommendations || 0}
                </div>
              )}
              <p className="text-sm text-muted-foreground">Needs Research</p>
            </CardContent>
          </Card>
          <Card
            variant="stat"
            className={`cursor-pointer hover:border-no-bid/50 ${filter === "NO_BID" ? "border-no-bid" : ""}`}
            onClick={() => {
              setFilter("NO_BID");
              setPage(0);
            }}
          >
            <CardContent className="pt-6">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-display font-bold text-no-bid">
                  {stats?.no_bid_recommendations || 0}
                </div>
              )}
              <p className="text-sm text-muted-foreground">Not Recommended</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {filter || "All Recommendations"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => { setFilter(null); setPage(0); }}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFilter("BID"); setPage(0); }}>
                BID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFilter("RESEARCH"); setPage(0); }}>
                RESEARCH
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFilter("NO_BID"); setPage(0); }}>
                NO BID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {evaluationsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))
          ) : filteredEvaluations.length === 0 ? (
            <Card variant="glass" className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filter
                  ? "Try adjusting your search or filter criteria"
                  : "No opportunities have been evaluated yet. Check back after discovery runs."}
              </p>
            </Card>
          ) : (
            filteredEvaluations.map((evaluation, index) => (
              <motion.div
                key={evaluation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/opportunities/${evaluation.opportunity.id}`}>
                  <Card variant="interactive" className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getRecommendationBadge(evaluation.recommendation)}
                          <Badge variant="score" className={getScoreColor(evaluation.fit_score)}>
                            Fit: {evaluation.fit_score}%
                          </Badge>
                          {evaluation.opportunity.solicitation_number && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {evaluation.opportunity.solicitation_number}
                            </Badge>
                          )}
                          {evaluation.user_saved && (
                            <Badge variant="outline" className="text-xs">
                              {evaluation.user_saved}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                          {evaluation.opportunity.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {evaluation.opportunity.department || "Unknown Agency"}
                          </span>
                          {evaluation.opportunity.naics_code && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>NAICS: {evaluation.opportunity.naics_code}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Value, deadline, score */}
                      <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 lg:gap-2 lg:text-right shrink-0">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-lg font-semibold text-primary">
                            {formatCurrency(evaluation.opportunity.contract_value)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(evaluation.opportunity.response_deadline)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Win Prob: </span>
                          <span className={getScoreColor(evaluation.win_probability)}>
                            {evaluation.win_probability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
