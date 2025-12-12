export interface NAICSCode {
  code: string;
  title: string;
}

export interface SetAside {
  code: string;
  name: string;
  description: string;
}

export interface ContractRange {
  label: string;
  min: number;
  max: number;
}

export interface USState {
  code: string;
  name: string;
}

export interface ReferenceData {
  naics_codes: NAICSCode[];
  naics_categories: Record<string, string[]>;
  set_asides: SetAside[];
  legal_structures: string[];
  contract_ranges: ContractRange[];
  states: USState[];
}
