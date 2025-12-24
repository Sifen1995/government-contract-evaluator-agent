import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  Target,
  Award,
  DollarSign,
  FileSearch,
  Users,
  TrendingUp,
  Loader2,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAgency, getAgencyMatchScore, getAgencyContacts } from "@/lib/agencies";

function formatCurrency(value: number | null | undefined) {
  if (!value) return "N/A";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-warning";
  return "text-muted-foreground";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

export function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Fetch agency details
  const { data: agency, isLoading: agencyLoading, error: agencyError } = useQuery({
    queryKey: ["agency", id],
    queryFn: () => getAgency(id!),
    enabled: !!id,
  });

  // Fetch match score
  const { data: matchScore, isLoading: matchLoading } = useQuery({
    queryKey: ["agency", id, "match"],
    queryFn: () => getAgencyMatchScore(id!),
    enabled: !!id,
  });

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ["agency", id, "contacts"],
    queryFn: () => getAgencyContacts(id!),
    enabled: !!id,
  });

  const contacts = contactsData?.contacts || agency?.contacts || [];
  const isLoading = agencyLoading;

  if (agencyError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agency Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The agency you're looking for doesn't exist or you don't have access.
          </p>
          <Button asChild>
            <Link to="/agencies">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agencies
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-2">
          <Link to="/agencies">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agencies
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-6 lg:grid-cols-3">
              <Skeleton className="h-64 lg:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : agency ? (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h1 className="text-2xl font-display font-bold">
                            {agency.name}
                          </h1>
                          {agency.abbreviation && (
                            <Badge variant="secondary">{agency.abbreviation}</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {agency.level.replace('_', ' ')}
                        </Badge>
                        {(agency.sam_code || agency.cgac_code) && (
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            {agency.sam_code && (
                              <span>SAM: <span className="font-mono">{agency.sam_code}</span></span>
                            )}
                            {agency.cgac_code && (
                              <span>CGAC: <span className="font-mono">{agency.cgac_code}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {matchScore && (
                      <div className="text-center p-4 rounded-lg bg-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Match Score</p>
                        <p className={`text-4xl font-display font-bold ${getScoreColor(matchScore.match_score)}`}>
                          {matchScore.match_score}%
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left column - Stats and Match Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card variant="stat">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <FileSearch className="w-4 h-4" />
                          Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">
                          {agency.opportunity_count || 0}
                        </p>
                      </CardContent>
                    </Card>

                    <Card variant="stat">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Avg Contract
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold text-primary">
                          {formatCurrency(agency.average_contract_value)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card variant="stat">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Contacts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-display font-bold">
                          {contacts.length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>

                {/* Match Score Breakdown */}
                {matchScore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card variant="elevated">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Match Score Breakdown
                        </CardTitle>
                        <CardDescription>
                          How well your company aligns with this agency
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ScoreBar label="NAICS Alignment" score={matchScore.naics_match_score} />
                        <ScoreBar label="Set-Aside Match" score={matchScore.set_aside_match_score} />
                        <ScoreBar label="Contract Value Fit" score={matchScore.contract_value_score} />
                        <ScoreBar label="Geographic Alignment" score={matchScore.geographic_score} />

                        {matchScore.match_reasons && matchScore.match_reasons.length > 0 && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-sm font-medium mb-2">Match Reasons</p>
                            <ul className="space-y-1">
                              {matchScore.match_reasons.map((reason, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Small Business Goals (if available) */}
                {matchScore?.small_business_goal && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card variant="elevated">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" />
                          Small Business Goals
                        </CardTitle>
                        <CardDescription>
                          Agency small business contracting targets
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="p-4 rounded-lg bg-secondary/30">
                            <p className="text-sm text-muted-foreground mb-1">Small Business Goal</p>
                            <p className="text-2xl font-display font-bold">
                              {matchScore.small_business_goal}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Right column - Contacts and Quick Links */}
              <div className="space-y-6">
                {/* Key Contacts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Key Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {contactsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : contacts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No contacts available</p>
                        </div>
                      ) : (
                        contacts.slice(0, 5).map((contact) => (
                          <div
                            key={contact.id}
                            className="p-4 rounded-lg bg-secondary/30"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'}
                                </p>
                                {contact.title && (
                                  <p className="text-sm text-muted-foreground">{contact.title}</p>
                                )}
                                {contact.contact_type && (
                                  <Badge variant="outline" className="mt-1 text-xs capitalize">
                                    {contact.contact_type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 space-y-1">
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Mail className="w-4 h-4" />
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  <Phone className="w-4 h-4" />
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {contacts.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground">
                          +{contacts.length - 5} more contacts
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-primary" />
                        Quick Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to={`/opportunities?agency=${encodeURIComponent(agency.name)}`}>
                          <FileSearch className="w-4 h-4 mr-2" />
                          View Opportunities
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a
                          href={`https://sam.gov/search/?keywords=${encodeURIComponent(agency.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          SAM.gov Listing
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a
                          href={`https://www.usaspending.gov/agency/${agency.cgac_code || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          USAspending Data
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
