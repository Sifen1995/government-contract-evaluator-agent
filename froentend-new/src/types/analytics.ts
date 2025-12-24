export interface AwardStats {
  total_awards: number;
  total_award_value: number;
  avg_award_value: number;
  top_agencies: { agency: string; count: number }[];
  top_vendors: { vendor: string; count: number }[];
  naics_breakdown: { naics: string; count: number }[];
}

export interface OpportunityStats {
  total_opportunities: number;
  active_opportunities: number;
  total_evaluations: number;
  bid_recommendations: number;
  no_bid_recommendations: number;
  research_recommendations: number;
  avg_fit_score: number | null;
  avg_win_probability: number | null;
}

export interface PipelineStats {
  watching: number;
  bidding: number;
  won: number;
  lost: number;
  total_estimated_value: number | null;
}

export interface AnalyticsDashboard {
  awardStats: AwardStats;
  opportunityStats: OpportunityStats;
  pipelineStats: PipelineStats;
}
