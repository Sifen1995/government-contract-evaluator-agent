export interface Opportunity {
  id: string;
  notice_id: string;
  solicitation_number?: string;
  title: string;
  description?: string;
  department?: string;
  sub_tier?: string;
  office?: string;
  naics_code?: string;
  naics_description?: string;
  psc_code?: string;
  set_aside?: string;
  contract_value?: number;
  contract_value_min?: number;
  contract_value_max?: number;
  posted_date?: string;
  response_deadline?: string;
  archive_date?: string;
  place_of_performance_city?: string;
  place_of_performance_state?: string;
  place_of_performance_zip?: string;
  place_of_performance_country?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  link?: string;
  attachment_links?: Array<{ name: string; url: string }>;
  type?: string;
  award_number?: string;
  award_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
  is_forecast: boolean;
}

export type Recommendation = 'BID' | 'NO_BID' | 'RESEARCH';
export type UserSavedStatus = 'WATCHING' | 'BIDDING' | 'PASSED' | 'WON' | 'LOST' | null;

export interface Evaluation {
  id: string;
  opportunity_id: string;
  company_id: string;
  fit_score: number;
  win_probability: number;
  recommendation: Recommendation;
  strengths?: string[];
  weaknesses?: string[];
  key_requirements?: string[];
  missing_capabilities?: string[];
  reasoning?: string;
  risk_factors?: string[];
  naics_match: number;
  set_aside_match: number;
  geographic_match: number;
  contract_value_match: number;
  model_version?: string;
  tokens_used?: number;
  evaluation_time_seconds?: number;
  user_saved?: UserSavedStatus;
  user_notes?: string;
  created_at: string;
  updated_at: string;
  is_stale?: boolean; // Computed field from API or client-side
}

// Helper to check if an evaluation is stale (older than threshold days)
export function isEvaluationStale(
  updatedAt: string,
  thresholdDays: number = 7
): boolean {
  const evaluationDate = new Date(updatedAt);
  const now = new Date();
  const diffTime = now.getTime() - evaluationDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

export interface OpportunityWithEvaluation extends Opportunity {
  evaluation?: Evaluation;
  issuing_agency?: string;
  source?: string;
}

export interface EvaluationWithOpportunity extends Evaluation {
  opportunity: Opportunity;
}

export interface OpportunityListResponse {
  opportunities: Opportunity[];
  total: number;
  skip: number;
  limit: number;
}

export interface EvaluationListResponse {
  evaluations: EvaluationWithOpportunity[];
  total: number;
  skip: number;
  limit: number;
}

export interface OpportunityStats {
  total_opportunities: number;
  active_opportunities: number;
  total_evaluations: number;
  bid_recommendations: number;
  no_bid_recommendations: number;
  research_recommendations: number;
  avg_fit_score?: number;
  avg_win_probability?: number;
}

export interface EvaluationUpdate {
  user_saved?: UserSavedStatus;
  user_notes?: string;
}

export interface StaleEvaluationCount {
  stale_count: number;
  total_evaluations: number;
  threshold_days: number;
}

export interface RescoreResponse {
  message: string;
  queued_count: number;
  evaluation_ids: string[];
}
