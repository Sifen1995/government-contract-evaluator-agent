export type DocumentType = 'capability_statement' | 'certification' | 'past_performance' | 'other';

export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  company_id: string;
  document_type: DocumentType;
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  extraction_status: ExtractionStatus;
  is_scanned: boolean;
  ocr_confidence: number | null;
  suggestions_reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadRequest {
  file_name: string;
  file_type: string;
  document_type: DocumentType;
  file_size: number;
}

export interface DocumentUploadResponse {
  upload_url: string;
  s3_key: string;
  expires_in: number;
}

export interface DocumentCreateRequest {
  document_type: DocumentType;
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
}

export interface DocumentSuggestions {
  document_id: string;
  extraction_status: ExtractionStatus;
  ocr_confidence: number | null;
  ocr_quality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  is_scanned: boolean;
  suggestions_reviewed: boolean;
  naics_codes: Array<{
    code: string;
    description: string;
    confidence: number;
  }>;
  certifications: Array<{
    certification_type: string;
    expiration_date: string | null;
    confidence: number;
  }>;
  capabilities: string | null;
  agencies: string[];
  locations: string[];
  contract_values: string[];
  raw_entities: Record<string, unknown>;
}

export interface ApplySuggestionsRequest {
  naics_codes?: string[];
  certifications?: string[];
  capabilities?: string;
  append_capabilities?: boolean;
  geographic_preferences?: string[];
}

export interface ApplySuggestionsResponse {
  naics_codes_added: number;
  certifications_created: number;
  capabilities_updated: boolean;
  geographic_preferences_added: number;
  profile_version: number;
  message: string;
}

export interface Certification {
  id: string;
  company_id: string;
  certification_type: string;
  document_id: string | null;
  issued_date: string | null;
  expiration_date: string | null;
  status: 'active' | 'expiring_soon' | 'expired';
  is_expiring_soon: boolean;
  days_until_expiration: number | null;
  created_at: string;
  updated_at: string;
}

export interface CertificationCreate {
  certification_type: string;
  document_id?: string;
  issued_date?: string;
  expiration_date?: string;
}

export interface CertificationUpdate {
  certification_type?: string;
  document_id?: string;
  issued_date?: string;
  expiration_date?: string;
}

export interface PastPerformance {
  id: string;
  company_id: string;
  contract_number: string | null;
  agency_name: string | null;
  contract_value: number | null;
  pop_start: string | null;
  pop_end: string | null;
  naics_codes: string[];
  performance_rating: string | null;
  description: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PastPerformanceCreate {
  contract_number?: string;
  agency_name?: string;
  contract_value?: number;
  pop_start?: string;
  pop_end?: string;
  naics_codes?: string[];
  performance_rating?: string;
  description?: string;
  document_id?: string;
}

export interface PastPerformanceUpdate {
  contract_number?: string;
  agency_name?: string;
  contract_value?: number;
  pop_start?: string;
  pop_end?: string;
  naics_codes?: string[];
  performance_rating?: string;
  description?: string;
  document_id?: string;
}
