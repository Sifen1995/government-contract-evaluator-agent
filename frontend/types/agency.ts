/**
 * Types for authority mapping and agency management
 */

export type AgencyLevel = 'department' | 'agency' | 'sub_agency' | 'office';
export type ContactType = 'osdbu' | 'contracting_officer' | 'industry_liaison' | 'small_business_specialist';
export type ContactSource = 'sba_directory' | 'sam_gov' | 'manual' | 'usaspending';

export interface Agency {
  id: string;
  name: string;
  abbreviation?: string;
  parent_agency_id?: string;
  level?: AgencyLevel;
  sam_gov_id?: string;
  usaspending_id?: string;
  small_business_url?: string;
  forecast_url?: string;
  vendor_portal_url?: string;
  small_business_goal_pct?: number;
  eight_a_goal_pct?: number;
  wosb_goal_pct?: number;
  sdvosb_goal_pct?: number;
  hubzone_goal_pct?: number;
  created_at: string;
  updated_at: string;
}

export interface AgencyWithStats extends Agency {
  opportunity_count?: number;
  avg_contract_value?: number;
  top_naics_codes?: string[];
}

export interface GovernmentContact {
  id: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  agency_id?: string;
  agency?: Agency;
  office_name?: string;
  contact_type: ContactType;
  source?: ContactSource;
  source_url?: string;
  last_verified?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyAgencyMatch {
  id: string;
  company_id: string;
  agency_id: string;
  agency?: Agency;
  match_score: number;
  naics_score: number;
  set_aside_score: number;
  geographic_score: number;
  award_history_score: number;
  calculated_at: string;
}

export interface MatchScoreBreakdown {
  score: number;
  factors: {
    naics_alignment: number;
    set_aside_alignment: number;
    geographic_fit: number;
    award_history_fit: number;
  };
  reasoning: string;
}

export interface AgencyWithMatch extends Agency {
  match_score?: number;
  match_breakdown?: MatchScoreBreakdown;
  match_reason?: string;
  opportunity_count?: number;
  avg_contract_value?: number;
}

// Request/Response types
export interface AgencyListResponse {
  agencies: Agency[];
  total: number;
}

export interface ContactListResponse {
  contacts: GovernmentContact[];
  total: number;
}

export interface RecommendedAgenciesResponse {
  agencies: AgencyWithMatch[];
  total: number;
}

export interface OpportunityContactsResponse {
  contracting_officer?: GovernmentContact;
  osdbu_contact?: GovernmentContact;
  industry_liaison?: GovernmentContact;
  agency?: Agency;
}
