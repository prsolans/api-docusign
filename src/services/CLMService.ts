import { DocuSignAuth } from '../auth/DocuSignAuth';
import { ApiClient } from '../utils/apiClient';
import {
  CLMDocument,
  CLMDocumentListResponse,
  GetDocumentsParams,
  CLMFolder,
  CLMSearchTask,
  CLMSearchResult
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
      // CLM uses a search-based API. Create a search task first
      const searchTask = await this.createDocumentSearchTask(params);

      // Wait for the search to complete and get results
      const results = await this.waitForSearchCompletion(searchTask.taskId);

      return {
        documents: results.Objects || [],
        totalCount: results.TotalCount || 0,
        pageSize: params.limit || 20,
        offset: params.offset || 0
      };
    } catch (error) {
      throw new Error(`Failed to get documents: ${(error as Error).message}`);
    }
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

  private async waitForSearchCompletion(taskId: string, maxWaitTime = 10000): Promise<CLMSearchResult> {
    const startTime = Date.now();
    const pollInterval = 1000; // Poll every second

    while (Date.now() - startTime < maxWaitTime) {
      try {
        console.log(`🔍 Checking search task status: ${taskId}`);
        const response = await this.apiClient.get(`/documentsearchtasks/${taskId}`);
        const task = response.data;

        if (task.Status === 'Complete' || task.Status === 'Completed') {
          console.log(`✅ Search completed with ${task.Result?.TotalCount || 0} results`);
          return task.Result || { Objects: [], TotalCount: 0 };
        }

        if (task.Status === 'Failed' || task.Status === 'Error') {
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

      const response = await this.apiClient.get<CLMDocument>(url);
      return response.data;
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
}