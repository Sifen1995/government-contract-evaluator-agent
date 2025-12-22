import api from './api';
import { OpportunityStats, EvaluationListResponse } from '@/types/opportunity';

export async function getStats(): Promise<OpportunityStats> {
  const response = await api.get('/stats');
  return response.data;
}

export async function triggerDiscovery(forceRefresh: boolean = false): Promise<{ message: string }> {
  const response = await api.post('/actions/trigger-discovery', null, {
    params: { force_refresh: forceRefresh }
  });
  return response.data;
}

export async function getEvaluations(params: {
  skip?: number;
  limit?: number;
  recommendation?: string;
  min_fit_score?: number;
  is_forecast?: boolean;
}): Promise<EvaluationListResponse> {
  const response = await api.get('/evaluations', { params });
  return response.data;
}
