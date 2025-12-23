import api from './api';
import {
  StaleCountResponse,
  RescoreAllResponse,
  RefreshEvaluationResponse,
} from '@/types/rescoring';

// Re-scoring endpoints
export async function getStaleCount(): Promise<StaleCountResponse> {
  const response = await api.get('/evaluations/stale-count');
  return response.data;
}

export async function rescoreAll(): Promise<RescoreAllResponse> {
  const response = await api.post('/evaluations/rescore-all');
  return response.data;
}

export async function refreshEvaluation(evaluationId: string): Promise<RefreshEvaluationResponse> {
  const response = await api.post(`/evaluations/${evaluationId}/refresh`);
  return response.data;
}

export async function getProfileVersion(): Promise<{ profile_version: number }> {
  const response = await api.get('/company/profile-version');
  return response.data;
}
