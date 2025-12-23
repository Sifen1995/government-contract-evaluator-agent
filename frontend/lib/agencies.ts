import api from './api';
import {
  Agency,
  AgencyWithStats,
  AgencyWithMatch,
  GovernmentContact,
  CompanyAgencyMatch,
  AgencyListResponse,
  ContactListResponse,
  RecommendedAgenciesResponse,
  OpportunityContactsResponse,
  MatchScoreBreakdown,
} from '@/types/agency';

// Agency endpoints
export async function getAgencies(params?: {
  search?: string;
  level?: string;
  skip?: number;
  limit?: number;
}): Promise<AgencyListResponse> {
  const response = await api.get('/agencies/', { params });
  return response.data;
}

export async function getAgency(id: string): Promise<AgencyWithStats> {
  const response = await api.get(`/agencies/${id}`);
  return response.data;
}

export async function getAgencyContacts(agencyId: string): Promise<GovernmentContact[]> {
  const response = await api.get(`/agencies/${agencyId}/contacts`);
  return response.data;
}

export async function getAgencyStats(agencyId: string): Promise<{
  opportunity_count: number;
  avg_contract_value: number;
  top_naics_codes: string[];
  recent_awards_count: number;
}> {
  // Stats are included in the agency detail response
  const response = await api.get(`/agencies/${agencyId}`);
  return {
    opportunity_count: response.data.opportunity_count || 0,
    avg_contract_value: response.data.avg_contract_value || 0,
    top_naics_codes: response.data.top_naics_codes || [],
    recent_awards_count: response.data.recent_awards_count || 0,
  };
}

export async function getRecommendedAgencies(params?: {
  limit?: number;
}): Promise<RecommendedAgenciesResponse> {
  const response = await api.get('/agencies/recommended', { params });
  return response.data;
}

// Contact endpoints
export async function getContacts(params?: {
  agency_id?: string;
  contact_type?: string;
  skip?: number;
  limit?: number;
}): Promise<ContactListResponse> {
  const response = await api.get('/agencies/contacts/', { params });
  return response.data;
}

export async function getContact(id: string): Promise<GovernmentContact> {
  const response = await api.get(`/agencies/contacts/${id}`);
  return response.data;
}

export async function getOpportunityContacts(opportunityId: string): Promise<OpportunityContactsResponse> {
  const response = await api.get(`/opportunities/${opportunityId}/contacts`);
  return response.data;
}

// Matching endpoints - uses /agencies/recommended for list and /agencies/{id}/match for detail
export async function getAgencyMatches(params?: {
  min_score?: number;
  limit?: number;
}): Promise<CompanyAgencyMatch[]> {
  const response = await api.get('/agencies/recommended', { params });
  // Transform response to match expected format
  return response.data.agencies || [];
}

export async function getAgencyMatchDetail(agencyId: string): Promise<MatchScoreBreakdown> {
  const response = await api.get(`/agencies/${agencyId}/match`);
  return response.data;
}
