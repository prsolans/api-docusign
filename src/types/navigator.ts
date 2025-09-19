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
  status?: string[];
  sort?: string;
  direction?: 'asc' | 'desc';
}