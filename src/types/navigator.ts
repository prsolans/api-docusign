export interface NavigatorAgreement {
  agreementId: string;
  name: string;
  status: string;
  createdDate: string;
  modifiedDate: string;
  participantSetsInfo: ParticipantSetInfo[];
}

export interface ParticipantSetInfo {
  memberInfos: MemberInfo[];
  order: number;
  role: string;
  status: string;
}

export interface MemberInfo {
  email: string;
  name: string;
  status: string;
  userId?: string;
}

export interface AgreementListResponse {
  data: NavigatorAgreement[];
  userAgreementList?: NavigatorAgreement[]; // Fallback for compatibility
  page?: PageInfo;
  total?: number;
  limit?: number;
  ctoken?: string; // Continuation token for pagination
}

export interface AgreementSummaryResponse {
  summary?: string;
  keyTerms?: string[];
  riskFactors?: string[];
  recommendations?: string[];
  [key: string]: any;
}

export interface AgreementProvisions {
  effective_date?: string;
  expiration_date?: string;
  execution_date?: string;
  term_length?: string;
  total_agreement_value?: number;
  annual_agreement_value?: number;
  governing_law?: string;
  payment_terms_due_date?: string;
  [key: string]: any;
}

export interface AgreementParty {
  name_in_agreement?: string;
  role?: string;
  email?: string;
  [key: string]: any;
}

export interface AgreementMetadata {
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PageInfo {
  nextCursor?: string;
  pageSize: number;
}

export interface GetAgreementListParams {
  cursor?: string;
  pageSize?: number;
  limit?: number; // Navigator API uses 'limit' not 'pageSize'
  query?: string;
  status?: string | string[]; // Allow both single string and array
  sort?: string;
  direction?: 'asc' | 'desc';
}