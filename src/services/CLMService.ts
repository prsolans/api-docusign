import { DocuSignAuth } from '../auth/DocuSignAuth';
import { ApiClient } from '../utils/apiClient';
import {
  CLMDocument,
  CLMDocumentListResponse,
  GetDocumentsParams,
  CLMFolder,
  CLMSearchTask,
  CLMSearchResult,
  TriggerWorkflowParams,
  TriggerWorkflowResponse,
  EnhancedDocumentSearchParams,
  EnhancedCLMDocument,
  GetDocumentParams
} from '../types/clm';

export class CLMService {
  private apiClient: ApiClient;
  private auth: DocuSignAuth;

  constructor(auth: DocuSignAuth) {
    this.auth = auth;
    this.apiClient = new ApiClient(auth, {
      baseURL: auth.getConfig().clmBaseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    });
  }

  async getDocuments(params: GetDocumentsParams = {}): Promise<CLMDocumentListResponse> {
    try {
      // Use the corrected endpoint with expand and direct search
      const queryParams = new URLSearchParams();
      queryParams.append('expand', 'AttributeGroups');
      queryParams.append('limit', (params.limit || 50).toString());

      const searchPayload: any = {
        IncludeSubFolders: true
      };

      // Add folder filter if specified
      if (params.folderId) {
        searchPayload.InFolder = { Uid: params.folderId };
      }

      // Add search criteria if specified
      if (params.query) {
        searchPayload.AnyWords = params.query;
      }

      const url = `/documentsearchtasks?${queryParams.toString()}`;
      console.log(`🔍 CLM Direct Search Request: ${this.auth.getConfig().clmBaseUrl}${url}`);
      console.log(`🔍 Search Payload:`, JSON.stringify(searchPayload, null, 2));

      const response = await this.apiClient.post(url, searchPayload);

      // The response should contain the results directly if it's fast enough
      const results = response.data;
      const rawDocuments = results.Result?.Items || results.Items || results.Objects || [];
      const mappedDocuments = rawDocuments.map((doc: any) => this.mapCLMDocument(doc));

      return {
        documents: mappedDocuments,
        totalCount: results.Result?.Total || results.Total || results.TotalCount || 0,
        pageSize: params.limit || 50,
        offset: params.offset || 0
      };
    } catch (error) {
      throw new Error(`Failed to get documents: ${(error as Error).message}`);
    }
  }

  // Helper method to map CLM response to our expected format
  private mapCLMDocument(doc: any): CLMDocument {
    return {
      // Actual CLM fields
      Uid: doc.Uid,
      Name: doc.Name,
      Description: doc.Description,
      CreatedDate: doc.CreatedDate,
      UpdatedDate: doc.UpdatedDate,
      NativeFileSize: doc.NativeFileSize,
      Extension: doc.Extension,
      Href: doc.Href,
      CreatedBy: doc.CreatedBy,
      UpdatedBy: doc.UpdatedBy,
      ParentFolder: doc.ParentFolder,
      AccessLevel: doc.AccessLevel,
      LockStatus: doc.LockStatus,
      IsInTrash: doc.IsInTrash,
      PreviewUrl: doc.PreviewUrl,
      DownloadDocumentHref: doc.DownloadDocumentHref,
      Score: doc.Score,
      PdfFileSize: doc.PdfFileSize,
      ContentCreatedDate: doc.ContentCreatedDate,
      PageCount: doc.PageCount,
      AttributeGroups: doc.AttributeGroups,

      // Legacy compatibility fields
      id: doc.Uid,
      name: doc.Name,
      description: doc.Description,
      createdDate: doc.CreatedDate,
      modifiedDate: doc.UpdatedDate,
      size: doc.NativeFileSize,
      mimeType: this.getMimeTypeFromExtension(doc.Extension),
      folderId: this.extractFolderIdFromHref(doc.ParentFolder?.Href),
      path: doc.Name, // Simplified path
      version: 1 // Default version
    };
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return mimeTypes[extension?.toLowerCase()] || `application/${extension}`;
  }

  private extractFolderIdFromHref(href?: string): string | undefined {
    if (!href) return undefined;
    const match = href.match(/\/folders\/([^\/]+)$/);
    return match ? match[1] : undefined;
  }

  private async createDocumentSearchTask(params: GetDocumentsParams): Promise<{ taskId: string }> {
    const searchPayload: any = {
      IncludeSubFolders: true
    };

    // Add search criteria based on params
    if (params.query) {
      searchPayload.AnyWords = params.query;
    }

    if (params.folderId) {
      searchPayload.InFolder = { Id: params.folderId };
    }

    console.log(`🔍 CLM Search Task Request: ${this.auth.getConfig().clmBaseUrl}/documentsearchtasks`);
    console.log(`🔍 Search Payload:`, JSON.stringify(searchPayload, null, 2));

    const response = await this.apiClient.post('/documentsearchtasks', searchPayload);

    // Extract task ID from response (may be in Href or Id field)
    const taskId = response.data.Id || response.data.Href?.split('/').pop();

    if (!taskId) {
      throw new Error('Failed to get task ID from search response');
    }

    return { taskId };
  }

  private async waitForSearchCompletion(taskId: string, maxWaitTime = 30000): Promise<CLMSearchResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`🔍 Checking search task status: ${taskId}`);
        const response = await this.apiClient.get(`/documentsearchtasks/${taskId}`);
        const task = response.data;

        console.log(`   Status: ${task.Status}, Progress: ${task.Progress || 'N/A'}`);

        if (task.Status === 'Complete' || task.Status === 'Completed' || task.Status === 'Success') {
          console.log(`✅ Search completed with ${task.Result?.TotalCount || 0} results`);
          return task.Result || { Objects: [], TotalCount: 0 };
        }

        if (task.Status === 'Failed' || task.Status === 'Error') {
          console.log(`❌ Search task failed. Full response:`, JSON.stringify(task, null, 2));
          throw new Error(`Search task failed with status: ${task.Status}`);
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        throw new Error(`Failed to check search status: ${(error as Error).message}`);
      }
    }

    throw new Error(`Search task timed out after ${maxWaitTime}ms`);
  }

  async getDocumentById(documentId: string): Promise<CLMDocument> {
    try {
      // Simple GET request: /v2/{accountId}/documents/{id}
      const url = `/documents/${documentId}?expand=AttributeGroups`;

      console.log(`🔍 CLM Get Document Request: ${this.auth.getConfig().clmBaseUrl}${url}`);

      const response = await this.apiClient.get<any>(url);
      return this.mapCLMDocument(response.data);
    } catch (error) {
      throw new Error(`Failed to get document ${documentId}: ${(error as Error).message}`);
    }
  }

  async getDocumentsByFolder(folderId: string, params: Omit<GetDocumentsParams, 'folderId'> = {}): Promise<CLMDocumentListResponse> {
    return this.getDocuments({
      ...params,
      folderId
    });
  }

  async searchDocuments(query: string, params: Omit<GetDocumentsParams, 'query'> = {}): Promise<CLMDocumentListResponse> {
    return this.getDocuments({
      ...params,
      query
    });
  }

  async getAllDocuments(params: Omit<GetDocumentsParams, 'offset'> = {}): Promise<CLMDocument[]> {
    const allDocuments: CLMDocument[] = [];
    const limit = params.limit || 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getDocuments({
        ...params,
        offset,
        limit
      });

      allDocuments.push(...response.documents);

      // Check if we got fewer documents than the limit, indicating we've reached the end
      hasMore = response.documents.length === limit;
      offset += limit;

      // Safety check to prevent infinite loops
      if (offset > response.totalCount) {
        break;
      }
    }

    return allDocuments;
  }

  async getFolders(): Promise<CLMFolder[]> {
    try {
      const response = await this.apiClient.get<{ folders: CLMFolder[] }>('/folders');
      return response.data.folders;
    } catch (error) {
      throw new Error(`Failed to get folders: ${error}`);
    }
  }

  async getFolderById(folderId: string): Promise<CLMFolder> {
    try {
      const response = await this.apiClient.get<CLMFolder>(`/folders/${folderId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get folder ${folderId}: ${error}`);
    }
  }

  async downloadDocument(documentId: string): Promise<Buffer> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download document ${documentId}: ${error}`);
    }
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  // Workflow Trigger Method - Corrected Implementation

  async triggerWorkflow(params: TriggerWorkflowParams): Promise<TriggerWorkflowResponse> {
    try {
      const workflowPayload = {
        Name: params.Name,
        Params: params.Params
      };

      console.log(`🔄 CLM Trigger Workflow Request: ${this.auth.getConfig().clmBaseUrl}/workflows`);
      console.log(`🔄 Workflow Name: ${params.Name}`);
      console.log(`🔄 XML Params Length: ${params.Params.length} characters`);
      console.log(`🔄 Workflow Payload:`, JSON.stringify(workflowPayload, null, 2));

      const response = await this.apiClient.post<TriggerWorkflowResponse>('/workflows', workflowPayload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to trigger workflow "${params.Name}": ${(error as Error).message}`);
    }
  }

  // Helper method to create XML payload for common scenarios
  buildWorkflowXmlParams(params: Record<string, any>): string {
    const xmlParts = ['<params>'];

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Escape XML special characters
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        xmlParts.push(`  <${key}>${escapedValue}</${key}>`);
      }
    });

    xmlParts.push('</params>');
    return xmlParts.join('\n');
  }

  // Enhanced Document Search Methods

  async searchDocumentsEnhanced(params: EnhancedDocumentSearchParams): Promise<CLMDocumentListResponse> {
    try {
      // Use the corrected endpoint with expand and proper query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('expand', 'AttributeGroups');
      queryParams.append('limit', (params.limit || 50).toString());

      const searchPayload: any = {
        IncludeSubFolders: params.IncludeSubFolders !== false // Default to true
      };

      // Text search criteria
      if (params.AllWords) searchPayload.AllWords = params.AllWords;
      if (params.AnyWords) searchPayload.AnyWords = params.AnyWords;
      if (params.Phrase) searchPayload.Phrase = params.Phrase;
      if (params.WithoutWords) searchPayload.WithoutWords = params.WithoutWords;

      // Backward compatibility with basic query
      if (params.query && !params.AnyWords) {
        searchPayload.AnyWords = params.query;
      }

      // Date filters
      if (params.CreatedAfter) searchPayload.CreatedAfter = params.CreatedAfter;
      if (params.CreatedBefore) searchPayload.CreatedBefore = params.CreatedBefore;
      if (params.ModifiedAfter) searchPayload.ModifiedAfter = params.ModifiedAfter;
      if (params.ModifiedBefore) searchPayload.ModifiedBefore = params.ModifiedBefore;

      // Document properties
      if (params.DocumentTypes?.length) searchPayload.DocumentTypes = params.DocumentTypes;
      if (params.MinSize !== undefined) searchPayload.MinSize = params.MinSize;
      if (params.MaxSize !== undefined) searchPayload.MaxSize = params.MaxSize;

      // Folder filters - use Uid instead of Id
      if (params.folderId || params.InFolder) {
        searchPayload.InFolder = { Uid: params.folderId || params.InFolder };
      }
      if (params.ExcludeFolders?.length) {
        searchPayload.ExcludeFolders = params.ExcludeFolders.map(id => ({ Uid: id }));
      }

      // Metadata and attributes
      if (params.AttributeFilters?.length) {
        searchPayload.AttributeFilters = params.AttributeFilters;
      }
      if (params.HasAttributes?.length) {
        searchPayload.HasAttributes = params.HasAttributes;
      }

      // Advanced options
      if (params.SearchContent !== undefined) searchPayload.SearchContent = params.SearchContent;
      if (params.SearchMetadata !== undefined) searchPayload.SearchMetadata = params.SearchMetadata;
      if (params.CaseSensitive !== undefined) searchPayload.CaseSensitive = params.CaseSensitive;

      const url = `/documentsearchtasks?${queryParams.toString()}`;
      console.log(`🔍 CLM Enhanced Search Request: ${this.auth.getConfig().clmBaseUrl}${url}`);
      console.log(`🔍 Enhanced Search Payload:`, JSON.stringify(searchPayload, null, 2));

      const response = await this.apiClient.post(url, searchPayload);
      const results = response.data;

      console.log(`✅ Enhanced search completed with ${results.Result?.Total || results.Total || results.Result?.Items?.length || 0} results`);

      const rawDocuments = results.Result?.Items || results.Items || results.Objects || [];
      const mappedDocuments = rawDocuments.map((doc: any) => this.mapCLMDocument(doc));

      return {
        documents: mappedDocuments,
        totalCount: results.Result?.Total || results.Total || results.TotalCount || 0,
        pageSize: params.limit || 50,
        offset: params.offset || 0
      };
    } catch (error) {
      throw new Error(`Failed to perform enhanced document search: ${(error as Error).message}`);
    }
  }


  // Enhanced Document Retrieval Methods

  async getDocumentByIdEnhanced(documentId: string, params: GetDocumentParams = {}): Promise<EnhancedCLMDocument> {
    try {
      const queryParams = new URLSearchParams();

      // Add expand parameters
      if (params.expand?.length) {
        queryParams.append('expand', params.expand.join(','));
      } else {
        // Default expansions for enhanced document
        queryParams.append('expand', 'AttributeGroups,Versions,Permissions,Tags');
      }

      if (params.includeContent) {
        queryParams.append('includeContent', 'true');
      }

      if (params.versionId) {
        queryParams.append('versionId', params.versionId);
      }

      const queryString = queryParams.toString();
      const url = `/documents/${documentId}${queryString ? `?${queryString}` : ''}`;

      console.log(`🔍 CLM Get Enhanced Document Request: ${this.auth.getConfig().clmBaseUrl}${url}`);

      const response = await this.apiClient.get<any>(url);
      const mappedDoc = this.mapCLMDocument(response.data);

      // For enhanced document, preserve additional fields
      return {
        ...mappedDoc,
        EnhancedAttributeGroups: response.data.AttributeGroups || [],
        Versions: response.data.Versions || [],
        Permissions: response.data.Permissions || [],
        Tags: response.data.Tags || [],
        CheckoutStatus: response.data.CheckoutStatus,
        CheckedOutBy: response.data.CheckedOutBy,
        ContentType: response.data.ContentType,
        FileExtension: response.data.FileExtension || response.data.Extension
      } as EnhancedCLMDocument;
    } catch (error) {
      throw new Error(`Failed to get enhanced document ${documentId}: ${(error as Error).message}`);
    }
  }

  async getDocumentVersions(documentId: string): Promise<EnhancedCLMDocument['Versions']> {
    try {
      const document = await this.getDocumentByIdEnhanced(documentId, {
        expand: ['Versions']
      });
      return document.Versions || [];
    } catch (error) {
      throw new Error(`Failed to get document versions for ${documentId}: ${(error as Error).message}`);
    }
  }

  async getDocumentAttributes(documentId: string): Promise<EnhancedCLMDocument['EnhancedAttributeGroups']> {
    try {
      const document = await this.getDocumentByIdEnhanced(documentId, {
        expand: ['AttributeGroups']
      });
      return document.EnhancedAttributeGroups || [];
    } catch (error) {
      throw new Error(`Failed to get document attributes for ${documentId}: ${(error as Error).message}`);
    }
  }

  async getDocumentPermissions(documentId: string): Promise<EnhancedCLMDocument['Permissions']> {
    try {
      const document = await this.getDocumentByIdEnhanced(documentId, {
        expand: ['Permissions']
      });
      return document.Permissions || [];
    } catch (error) {
      throw new Error(`Failed to get document permissions for ${documentId}: ${(error as Error).message}`);
    }
  }

  // Integration Methods - Combining workflow triggers with document operations

  async triggerWorkflowForDocument(workflowName: string, documentId: string, additionalParams: Record<string, any> = {}): Promise<TriggerWorkflowResponse> {
    try {
      // Build XML params with document ID and additional parameters
      const xmlParams = this.buildWorkflowXmlParams({
        documentId,
        ...additionalParams
      });

      return this.triggerWorkflow({
        Name: workflowName,
        Params: xmlParams
      });
    } catch (error) {
      throw new Error(`Failed to trigger workflow "${workflowName}" for document ${documentId}: ${(error as Error).message}`);
    }
  }

  async triggerWorkflowForDocuments(workflowName: string, documentIds: string[], additionalParams: Record<string, any> = {}): Promise<TriggerWorkflowResponse[]> {
    const results: TriggerWorkflowResponse[] = [];

    for (const documentId of documentIds) {
      try {
        const result = await this.triggerWorkflowForDocument(workflowName, documentId, additionalParams);
        results.push(result);

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        // Add error result
        results.push({
          Success: false,
          Message: (error as Error).message
        });
      }
    }

    return results;
  }
}