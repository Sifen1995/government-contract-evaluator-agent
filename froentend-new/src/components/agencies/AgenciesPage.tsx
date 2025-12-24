import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Building2, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecommendedAgencies, listAgencies } from "@/lib/agencies";
import type { AgencyMatchScore, Agency } from "@/types/agency";

function formatCurrency(value: number | null | undefined) {
  if (!value) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-warning";
  return "text-muted-foreground";
}

function RecommendedAgencyCard({ agency }: { agency: AgencyMatchScore }) {
  return (
    <Link to={`/agencies/${agency.agency_id}`}>
      <Card variant="interactive" className="h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{agency.agency_abbreviation || agency.agency_name.slice(0, 10)}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {agency.agency_name}
                </p>
              </div>
            </div>
            <Badge variant="score" className={getScoreColor(agency.match_score)}>
              {agency.match_score}% match
            </Badge>
          </div>

          {agency.match_reasons && agency.match_reasons.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {agency.match_reasons.join(", ")}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Opportunities</p>
              <p className="font-semibold">{agency.opportunity_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Value</p>
              <p className="font-semibold text-primary">
                {formatCurrency(agency.average_contract_value)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">NAICS Score</p>
              <p className="font-semibold">{agency.naics_match_score}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Set-Aside Score</p>
              <p className="font-semibold">{agency.set_aside_match_score}%</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-end text-sm text-primary">
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AgencyCard({ agency }: { agency: Agency }) {
  return (
    <Link to={`/agencies/${agency.id}`}>
      <Card variant="interactive" className="h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{agency.abbreviation || agency.name.slice(0, 10)}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {agency.name}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {agency.level.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              {agency.sam_code && (
                <p className="text-muted-foreground">
                  SAM: <span className="font-mono">{agency.sam_code}</span>
                </p>
              )}
              {agency.cgac_code && (
                <p className="text-muted-foreground">
                  CGAC: <span className="font-mono">{agency.cgac_code}</span>
                </p>
              )}
            </div>
            <span className="flex items-center text-primary">
              <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function AgenciesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recommended agencies
  const { data: recommendedData, isLoading: recommendedLoading } = useQuery({
    queryKey: ["agencies", "recommended"],
    queryFn: () => getRecommendedAgencies(10),
  });

  // Fetch all agencies (departments only for cleaner list)
  const { data: allAgenciesData, isLoading: allLoading } = useQuery({
    queryKey: ["agencies", "all"],
    queryFn: () => listAgencies({ level: "department", limit: 100 }),
  });

  const recommendedAgencies = recommendedData?.agencies || [];
  const allAgencies = allAgenciesData?.agencies || [];

  const filteredAgencies = allAgencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agency.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Agencies</h1>
          <p className="text-muted-foreground">
            Discover agencies that match your company profile
          </p>
        </div>

        <Tabs defaultValue="recommended" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="recommended">Recommended for You</TabsTrigger>
            <TabsTrigger value="all">All Agencies</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-6">
            {recommendedLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : recommendedAgencies.length === 0 ? (
              <Card variant="glass" className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground">
                  Complete your company profile to get personalized agency recommendations.
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {recommendedAgencies.map((agency, index) => (
                  <motion.div
                    key={agency.agency_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RecommendedAgencyCard agency={agency} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search agencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {allLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : filteredAgencies.length === 0 ? (
              <Card variant="glass" className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agencies found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search query" : "No agencies available yet."}
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgencies.map((agency, index) => (
                  <motion.div
                    key={agency.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AgencyCard agency={agency} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
