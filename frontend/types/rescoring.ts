/**
 * Types for dynamic re-scoring
 */

export interface StaleCountResponse {
  stale_count: number;
  total_evaluations: number;
  current_profile_version: number;
}

export interface RescoreAllResponse {
  message: string;
  rescored_count: number;
  error_count: number;
  total_stale: number;
}

export interface RefreshEvaluationResponse {
  id: string;
  fit_score: number;
  win_probability: number;
  recommendation: 'BID' | 'NO_BID' | 'RESEARCH';
  profile_version_at_evaluation: number;
  is_stale: boolean;
  evaluated_at: string;
}

export interface EvaluationWithStaleInfo {
  id: string;
  opportunity_id: string;
  company_id: string;
  fit_score: number;
  win_probability: number;
  recommendation: 'BID' | 'NO_BID' | 'RESEARCH';
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
  user_saved?: 'WATCHING' | 'BIDDING' | 'PASSED' | 'WON' | 'LOST' | null;
  user_notes?: string;
  profile_version_at_evaluation?: number;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}
