import api from './api';
import {
  Document,
  DocumentWithVersions,
  DocumentVersion,
  UploadUrlRequest,
  UploadUrlResponse,
  DocumentCreate,
  DocumentListResponse,
  CertificationDocument,
  CertificationCreate,
  CertificationUpdate,
  CertificationListResponse,
  PastPerformance,
  PastPerformanceCreate,
  PastPerformanceUpdate,
  PastPerformanceListResponse,
} from '@/types/document';

// Document endpoints
export async function getUploadUrl(data: UploadUrlRequest): Promise<UploadUrlResponse> {
  const response = await api.post('/documents/upload', data);
  return response.data;
}

export async function createDocument(data: DocumentCreate): Promise<Document> {
  const response = await api.post('/documents/', data);
  return response.data;
}

export async function getDocuments(params?: {
  document_type?: string;
  skip?: number;
  limit?: number;
}): Promise<DocumentListResponse> {
  const response = await api.get('/documents/', { params });
  return response.data;
}

export async function getDocument(id: string): Promise<DocumentWithVersions> {
  const response = await api.get(`/documents/${id}`);
  return response.data;
}

export async function getDocumentDownloadUrl(id: string): Promise<{ download_url: string; expires_in: number }> {
  const response = await api.get(`/documents/${id}/download`);
  return response.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function getDocumentVersions(id: string): Promise<DocumentVersion[]> {
  const response = await api.get(`/documents/${id}/versions`);
  return response.data;
}

export async function restoreDocumentVersion(documentId: string, versionNumber: number): Promise<Document> {
  const response = await api.post(`/documents/${documentId}/versions/${versionNumber}/restore`);
  return response.data;
}

// Upload helper function
export async function uploadDocument(
  file: File,
  documentType: 'capability_statement' | 'certification' | 'past_performance' | 'other'
): Promise<Document> {
  // Get pre-signed upload URL
  const uploadUrl = await getUploadUrl({
    file_name: file.name,
    file_type: file.type || 'application/pdf',
    document_type: documentType,
  });

  // Upload file directly to S3
  await fetch(uploadUrl.upload_url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/pdf',
    },
  });

  // Create document record
  const document = await createDocument({
    document_type: documentType,
    file_name: file.name,
    file_type: file.type || 'application/pdf',
    file_size: file.size,
    s3_key: uploadUrl.s3_key,
  });

  return document;
}

// Certification endpoints
export async function getCertifications(): Promise<CertificationListResponse> {
  const response = await api.get('/certifications/');
  return response.data;
}

export async function createCertification(data: CertificationCreate): Promise<CertificationDocument> {
  const response = await api.post('/certifications/', data);
  return response.data;
}

export async function updateCertification(id: string, data: CertificationUpdate): Promise<CertificationDocument> {
  const response = await api.put(`/certifications/${id}`, data);
  return response.data;
}

export async function deleteCertification(id: string): Promise<void> {
  await api.delete(`/certifications/${id}`);
}

// Past performance endpoints
export async function getPastPerformances(): Promise<PastPerformanceListResponse> {
  const response = await api.get('/past-performance/');
  return response.data;
}

export async function createPastPerformance(data: PastPerformanceCreate): Promise<PastPerformance> {
  const response = await api.post('/past-performance/', data);
  return response.data;
}

export async function updatePastPerformance(id: string, data: PastPerformanceUpdate): Promise<PastPerformance> {
  const response = await api.put(`/past-performance/${id}`, data);
  return response.data;
}

export async function deletePastPerformance(id: string): Promise<void> {
  await api.delete(`/past-performance/${id}`);
}
