// User types
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  company_id?: string;
  email_frequency: string;
  created_at: string;
  last_login_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Company types
export interface Company {
  id: string;
  name: string;
  legal_structure?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  uei?: string;
  naics_codes: string[];
  set_asides: string[];
  capabilities?: string;
  contract_value_min?: number;
  contract_value_max?: number;
  geographic_preferences?: string[];
  created_at: string;
  updated_at: string;
}

// Opportunity types
export interface Opportunity {
  id: string;
  source: string;
  source_id: string;
  solicitation_number?: string;
  title: string;
  description?: string;
  notice_type?: string;
  agency?: string;
  sub_agency?: string;
  office?: string;
  naics_code?: string;
  psc_code?: string;
  set_aside_type?: string;
  pop_city?: string;
  pop_state?: string;
  pop_zip?: string;
  posted_date?: string;
  response_deadline?: string;
  estimated_value_low?: number;
  estimated_value_high?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  source_url?: string;
  attachments?: any[];
  status: string;
  raw_data?: any;
  created_at: string;
  updated_at: string;
}

// Evaluation types
export interface Evaluation {
  id: string;
  opportunity_id: string;
  company_id: string;
  fit_score: number;
  win_probability: number;
  recommendation: 'BID' | 'NO_BID' | 'REVIEW';
  confidence: number;
  reasoning?: string;
  strengths: string[];
  weaknesses: string[];
  executive_summary?: string;
  evaluated_at: string;
}

export interface OpportunityWithEvaluation extends Opportunity {
  evaluation?: Evaluation;
}

export interface OpportunityList {
  items: OpportunityWithEvaluation[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// Pipeline types
export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface PipelineStats {
  watching: number;
  pursuing: number;
  submitted: number;
  won: number;
  lost: number;
  total: number;
}

export interface DeadlineItem {
  opportunity_id: string;
  title: string;
  response_deadline: string;
  days_remaining: number;
  status: string;
}

export interface PipelineDeadlines {
  items: DeadlineItem[];
  total: number;
}
