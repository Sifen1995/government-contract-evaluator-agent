/**
 * Types for document management
 */

export type DocumentType = 'capability_statement' | 'certification' | 'past_performance' | 'other';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CertificationStatus = 'active' | 'expired' | 'pending_renewal';
export type PerformanceRating = 'exceptional' | 'very_good' | 'satisfactory' | 'marginal' | 'unsatisfactory';

export interface Document {
  id: string;
  company_id: string;
  document_type: DocumentType;
  file_name: string;
  file_type: string;
  file_size: number;
  extraction_status: ExtractionStatus;
  extracted_text?: string;
  extracted_entities?: Record<string, any>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_size: number;
  checksum: string;
  uploaded_by?: string;
  uploaded_at: string;
  is_current: boolean;
}

export interface DocumentWithVersions extends Document {
  versions: DocumentVersion[];
  current_version?: DocumentVersion;
}

export interface CertificationDocument {
  id: string;
  company_id: string;
  certification_type: string;
  document_id?: string;
  document?: Document;
  issued_date?: string;
  expiration_date?: string;
  status: CertificationStatus;
  created_at: string;
  updated_at: string;
}

export interface PastPerformance {
  id: string;
  company_id: string;
  document_id?: string;
  document?: Document;
  contract_number?: string;
  agency_name?: string;
  contract_value?: number;
  pop_start?: string;
  pop_end?: string;
  naics_codes: string[];
  performance_rating?: PerformanceRating;
  description?: string;
  ai_extracted_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface UploadUrlRequest {
  file_name: string;
  file_type: string;
  document_type: DocumentType;
}

export interface UploadUrlResponse {
  upload_url: string;
  document_id: string;
  s3_key: string;
  expires_in: number;
}

export interface DocumentCreate {
  document_type: DocumentType;
  file_name: string;
  file_type: string;
  file_size: number;
  s3_key: string;
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
  status?: CertificationStatus;
}

export interface PastPerformanceCreate {
  document_id?: string;
  contract_number?: string;
  agency_name?: string;
  contract_value?: number;
  pop_start?: string;
  pop_end?: string;
  naics_codes?: string[];
  performance_rating?: PerformanceRating;
  description?: string;
}

export interface PastPerformanceUpdate {
  document_id?: string;
  contract_number?: string;
  agency_name?: string;
  contract_value?: number;
  pop_start?: string;
  pop_end?: string;
  naics_codes?: string[];
  performance_rating?: PerformanceRating;
  description?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface CertificationListResponse {
  certifications: CertificationDocument[];
  total: number;
}

export interface PastPerformanceListResponse {
  past_performances: PastPerformance[];
  total: number;
}
