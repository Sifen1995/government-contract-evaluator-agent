export interface Agency {
  id: string;
  name: string;
  abbreviation: string | null;
  level: 'department' | 'agency' | 'sub_agency' | 'office';
  parent_id: string | null;
  sam_code: string | null;
  cgac_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  contact_type: string | null;
  agency_id: string;
  office_name: string | null;
  full_name: string | null;
  is_active: boolean;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyMatchScore {
  agency_id: string;
  agency_name: string;
  agency_abbreviation: string | null;
  match_score: number;
  naics_match_score: number;
  set_aside_match_score: number;
  contract_value_score: number;
  geographic_score: number;
  match_reasons: string[];
  opportunity_count: number;
  average_contract_value: number | null;
  small_business_goal: number | null;
}

export interface AgencyListResponse {
  agencies: Agency[];
  total: number;
}

export interface RecommendedAgenciesResponse {
  agencies: AgencyMatchScore[];
  total: number;
}

export interface AgencyDetailResponse extends Agency {
  contacts: AgencyContact[];
  opportunity_count: number;
  average_contract_value: number | null;
  total_contract_value: number | null;
}
