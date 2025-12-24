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
  geographic_preferences: string[];
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
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
  geographic_preferences: string[];
}

export interface CompanyUpdate {
  name?: string;
  legal_structure?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  uei?: string;
  naics_codes?: string[];
  set_asides?: string[];
  capabilities?: string;
  contract_value_min?: number;
  contract_value_max?: number;
  geographic_preferences?: string[];
}
