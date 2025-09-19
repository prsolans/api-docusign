export interface CLMDocument {
  // Core fields from actual CLM API response
  Uid: string;
  Name: string;
  Description?: string;
  CreatedDate: string;
  UpdatedDate: string;
  NativeFileSize: number;
  Extension: string;
  Href: string;

  // Additional CLM-specific fields
  CreatedBy?: string;
  UpdatedBy?: string;
  ParentFolder?: {
    Href: string;
  };
  AccessLevel?: {
    See: boolean;
    Read: boolean;
    Write: boolean;
    Move: boolean;
    Create: boolean;
    SetAccess: boolean;
  };
  LockStatus?: string;
  IsInTrash?: boolean;
  PreviewUrl?: string;
  DownloadDocumentHref?: string;
  Score?: number;
  PdfFileSize?: number;
  ContentCreatedDate?: string;
  PageCount?: number;
  AttributeGroups?: Record<string, Record<string, any>>;

  // Legacy compatibility fields (mapped from actual fields)
  id?: string; // Will be mapped from Uid
  name?: string; // Will be mapped from Name
  description?: string; // Will be mapped from Description
  createdDate?: string; // Will be mapped from CreatedDate
  modifiedDate?: string; // Will be mapped from UpdatedDate
  size?: number; // Will be mapped from NativeFileSize
  mimeType?: string; // Will be derived from Extension
  folderId?: string; // Will be extracted from ParentFolder.Href
  path?: string; // Will be derived from Name/folder structure
  version?: number; // Not available in this format
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

// Workflow-related interfaces - Corrected for actual API specification
export interface TriggerWorkflowParams {
  Name: string;  // Name of the workflow to trigger
  Params: string; // XML payload to send to the workflow
}

export interface TriggerWorkflowResponse {
  Id?: string;
  Href?: string;
  Status?: string;
  Message?: string;
  Success?: boolean;
  Result?: any;
  [key: string]: any; // Allow for additional response properties
}

// Enhanced document search parameters
export interface EnhancedDocumentSearchParams extends GetDocumentsParams {
  // Text search criteria
  AllWords?: string;      // All of these words
  AnyWords?: string;      // Any of these words
  Phrase?: string;        // Exact phrase
  WithoutWords?: string;  // None of these words

  // Date filters
  CreatedAfter?: string;
  CreatedBefore?: string;
  ModifiedAfter?: string;
  ModifiedBefore?: string;

  // Document properties
  DocumentTypes?: string[];  // File extensions or MIME types
  MinSize?: number;         // Minimum file size in bytes
  MaxSize?: number;         // Maximum file size in bytes

  // Folder and path filters
  InFolder?: string;        // Folder ID
  IncludeSubFolders?: boolean;
  ExcludeFolders?: string[]; // Folder IDs to exclude

  // Metadata and attributes
  AttributeFilters?: DocumentAttributeFilter[];
  HasAttributes?: string[];  // Attribute names that must exist

  // Advanced options
  SearchContent?: boolean;   // Search within document content
  SearchMetadata?: boolean;  // Search in metadata fields
  CaseSensitive?: boolean;
}

export interface DocumentAttributeFilter {
  AttributeName: string;
  Operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  Value: string | number | boolean;
}

// Enhanced document interface with metadata
export interface EnhancedCLMDocument extends CLMDocument {
  EnhancedAttributeGroups?: DocumentAttributeGroup[]; // Different name to avoid conflict
  Versions?: DocumentVersion[];
  Permissions?: DocumentPermission[];
  Tags?: string[];
  CheckoutStatus?: 'Available' | 'CheckedOut' | 'Locked';
  CheckedOutBy?: CLMUser;
  ContentType?: string;
  FileExtension?: string;
}

// Basic user interface for CLM operations
export interface CLMUser {
  Id?: string;
  Email: string;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  Role?: string;
  Department?: string;
}

export interface DocumentAttributeGroup {
  Id?: string;
  Name: string;
  Attributes: DocumentAttribute[];
}

export interface DocumentAttribute {
  Name: string;
  Type: 'Text' | 'Number' | 'Date' | 'Boolean' | 'List' | 'User';
  Value: any;
  DisplayName?: string;
  IsRequired?: boolean;
  IsReadOnly?: boolean;
}

export interface DocumentVersion {
  Id: string;
  VersionNumber: number;
  CreatedDate: string;
  CreatedBy: CLMUser;
  Size: number;
  Comment?: string;
  IsCurrent: boolean;
}

export interface DocumentPermission {
  User?: CLMUser;
  Role?: string;
  Permissions: ('Read' | 'Write' | 'Delete' | 'Share' | 'Download')[];
}

export interface GetDocumentParams {
  expand?: ('AttributeGroups' | 'Versions' | 'Permissions' | 'Tags')[];
  includeContent?: boolean;
  versionId?: string;
}