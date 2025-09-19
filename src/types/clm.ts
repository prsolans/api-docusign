export interface CLMDocument {
  id: string;
  name: string;
  description?: string;
  createdDate: string;
  modifiedDate: string;
  size: number;
  mimeType: string;
  folderId: string;
  path: string;
  version: number;
}

export interface CLMSearchTask {
  AllWords?: string;
  AnyWords?: string;
  Description?: string;
  Href?: string;
  IncludeSubFolders?: boolean;
  InFolder?: CLMFolder;
  Phrase?: string;
  Result?: CLMSearchResult;
  Status?: string;
  Title?: string;
  UpdatedBy?: any;
  WithoutWords?: string;
}

export interface CLMSearchResult {
  Objects?: CLMDocument[];
  TotalCount?: number;
}

export interface CLMDocumentListResponse {
  documents: CLMDocument[];
  totalCount: number;
  pageSize: number;
  offset: number;
}

export interface GetDocumentsParams {
  folderId?: string;
  offset?: number;
  limit?: number;
  query?: string;
  sortBy?: 'name' | 'createdDate' | 'modifiedDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CLMFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdDate: string;
  modifiedDate: string;
}