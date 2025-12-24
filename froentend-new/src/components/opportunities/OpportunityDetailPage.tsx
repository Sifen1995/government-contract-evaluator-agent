import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Loader2,
  Bookmark,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { getOpportunity, updateEvaluation, rescoreEvaluation } from "@/lib/opportunities";
import type { OpportunityWithEvaluation, UserSavedStatus } from "@/types/opportunity";
import { isEvaluationStale } from "@/types/opportunity";

const STATUS_OPTIONS: { value: UserSavedStatus; label: string; color: string }[] = [
  { value: "WATCHING", label: "Watching", color: "bg-watching" },
  { value: "BIDDING", label: "Bidding", color: "bg-bidding" },
  { value: "PASSED", label: "Passed", color: "bg-muted" },
  { value: "WON", label: "Won", color: "bg-won" },
  { value: "LOST", label: "Lost", color: "bg-lost" },
];

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [opportunity, setOpportunity] = useState<OpportunityWithEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);

  useEffect(() => {
    const fetchOpportunity = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getOpportunity(id);
        setOpportunity(data);
        setUserNotes(data.evaluation?.user_notes || "");
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load opportunity");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunity();
  }, [id]);

  const handleStatusChange = async (status: UserSavedStatus) => {
    if (!opportunity?.evaluation) return;
    setIsSavingStatus(true);
    try {
      await updateEvaluation(opportunity.evaluation.id, { user_saved: status });
      setOpportunity((prev) =>
        prev && prev.evaluation
          ? { ...prev, evaluation: { ...prev.evaluation, user_saved: status } }
          : prev
      );
      toast({
        title: "Status updated",
        description: `Opportunity marked as ${status?.toLowerCase() || "removed from pipeline"}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!opportunity?.evaluation) return;
    setIsSavingNotes(true);
    try {
      await updateEvaluation(opportunity.evaluation.id, { user_notes: userNotes });
      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleRescore = async () => {
    if (!opportunity?.evaluation) return;
    setIsRescoring(true);
    try {
      await rescoreEvaluation(opportunity.evaluation.id);
      toast({
        title: "Rescoring started",
        description: "The evaluation is being rescored. Refresh in a moment to see updated results.",
      });
      // Refresh after a delay
      setTimeout(async () => {
        if (id) {
          const data = await getOpportunity(id);
          setOpportunity(data);
        }
      }, 3000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to rescore evaluation",
        variant: "destructive",
      });
    } finally {
      setIsRescoring(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/opportunities")}>Back to Opportunities</Button>
        </div>
      </DashboardLayout>
    );
  }

  const evaluation = opportunity.evaluation;
  const recommendationColor =
    evaluation?.recommendation === "BID"
      ? "bg-bid text-white"
      : evaluation?.recommendation === "NO_BID"
      ? "bg-no-bid text-white"
      : "bg-research text-white";

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{opportunity.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {opportunity.department || "Unknown Agency"}
              </span>
              {opportunity.solicitation_number && (
                <span>Sol: {opportunity.solicitation_number}</span>
              )}
            </div>
          </div>
          {evaluation && (
            <Badge className={`${recommendationColor} text-lg px-4 py-2`}>
              {evaluation.recommendation}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Value</p>
                    <p className="font-semibold">{formatCurrency(opportunity.contract_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posted Date</p>
                    <p className="font-semibold">{formatDate(opportunity.posted_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Deadline</p>
                    <p className="font-semibold text-warning">{formatDate(opportunity.response_deadline)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NAICS Code</p>
                    <p className="font-semibold">{opportunity.naics_code || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {opportunity.description || "No description available."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Evaluation */}
            {evaluation && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        AI Evaluation
                        <Badge variant="outline">Fit Score: {evaluation.fit_score}%</Badge>
                        {isEvaluationStale(evaluation.updated_at) && (
                          <Badge
                            variant="outline"
                            className="text-warning border-warning flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            Stale
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Win Probability: {evaluation.win_probability}%
                        {isEvaluationStale(evaluation.updated_at) && (
                          <span className="ml-2 text-warning">
                            • Updated {new Date(evaluation.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRescore}
                      disabled={isRescoring}
                    >
                      {isRescoring ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Rescoring...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Rescore
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Reasoning */}
                  {evaluation.reasoning && (
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p className="text-muted-foreground">{evaluation.reasoning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-success">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {evaluation.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-success">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                          <XCircle className="w-4 h-4" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {evaluation.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-destructive">•</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Match Scores */}
                  <div>
                    <h4 className="font-medium mb-2">Match Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "NAICS Match", value: evaluation.naics_match },
                        { label: "Set-Aside Match", value: evaluation.set_aside_match },
                        { label: "Geographic Match", value: evaluation.geographic_match },
                        { label: "Value Match", value: evaluation.contract_value_match },
                      ].map((match) => (
                        <div key={match.label} className="text-center">
                          <div className="text-2xl font-bold text-primary">{match.value}%</div>
                          <div className="text-xs text-muted-foreground">{match.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Add your notes about this opportunity..."
                  rows={4}
                  className="mb-4"
                />
                <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={evaluation?.user_saved === option.value ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleStatusChange(option.value)}
                      disabled={isSavingStatus}
                    >
                      <span className={`w-3 h-3 rounded-full ${option.color} mr-2`} />
                      {option.label}
                    </Button>
                  ))}
                  {evaluation?.user_saved && (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => handleStatusChange(null)}
                      disabled={isSavingStatus}
                    >
                      Remove from pipeline
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {opportunity.primary_contact_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{opportunity.primary_contact_name}</span>
                  </div>
                )}
                {opportunity.primary_contact_email && (
                  <a
                    href={`mailto:${opportunity.primary_contact_email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {opportunity.primary_contact_email}
                  </a>
                )}
                {opportunity.primary_contact_phone && (
                  <a
                    href={`tel:${opportunity.primary_contact_phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {opportunity.primary_contact_phone}
                  </a>
                )}
                {!opportunity.primary_contact_name &&
                  !opportunity.primary_contact_email &&
                  !opportunity.primary_contact_phone && (
                    <p className="text-muted-foreground text-sm">No contact information available</p>
                  )}
              </CardContent>
            </Card>

            {/* Location */}
            {(opportunity.place_of_performance_city || opportunity.place_of_performance_state) && (
              <Card>
                <CardHeader>
                  <CardTitle>Place of Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      {opportunity.place_of_performance_city && (
                        <p>{opportunity.place_of_performance_city}</p>
                      )}
                      {opportunity.place_of_performance_state && (
                        <p>{opportunity.place_of_performance_state} {opportunity.place_of_performance_zip}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Link */}
            {opportunity.link && (
              <Button variant="outline" className="w-full" asChild>
                <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on SAM.gov
                </a>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
