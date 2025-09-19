import { DocuSignAuth } from '../auth/DocuSignAuth';
import { ApiClient } from '../utils/apiClient';
import {
  NavigatorAgreement,
  AgreementListResponse,
  GetAgreementListParams
} from '../types/navigator';

export class NavigatorService {
  private apiClient: ApiClient;
  private auth: DocuSignAuth;
  private accountId: string | null = null;

  constructor(auth: DocuSignAuth, accountId?: string) {
    this.auth = auth;
    this.accountId = accountId || auth.getConfig().accountId || null;
    this.apiClient = new ApiClient(auth, {
      baseURL: auth.getConfig().navigatorBaseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    });
  }

  async getAgreementList(params: GetAgreementListParams = {}): Promise<AgreementListResponse> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls. Please provide accountId in constructor or config.');
    }

    try {
      const queryParams = new URLSearchParams();

      // Use 'limit' parameter as in Python code
      const limit = params.limit || params.pageSize || 20;
      queryParams.append('limit', limit.toString());

      // Add sort parameters like Python code
      if (params.sort) {
        queryParams.append('sort', params.sort);
      } else {
        queryParams.append('sort', 'metadata.created_at');
      }

      if (params.direction) {
        queryParams.append('direction', params.direction);
      } else {
        queryParams.append('direction', 'desc');
      }

      if (params.cursor) {
        queryParams.append('cursor', params.cursor);
      }

      if (params.query) {
        queryParams.append('query', params.query);
      }

      if (params.status && params.status.length > 0) {
        params.status.forEach(status => {
          queryParams.append('status', status);
        });
      }

      const url = `/v1/accounts/${this.accountId}/agreements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await this.apiClient.get<AgreementListResponse>(url);

      // Normalize response structure to match what the Python code expects
      const responseData = response.data;
      if (responseData.data && !responseData.userAgreementList) {
        responseData.userAgreementList = responseData.data;
      }

      return responseData;
    } catch (error) {
      throw new Error(`Failed to get agreement list: ${(error as Error).message}`);
    }
  }

  async getAgreementById(agreementId: string): Promise<NavigatorAgreement> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls. Please provide accountId in constructor or config.');
    }

    try {
      const response = await this.apiClient.get<NavigatorAgreement>(`/v1/accounts/${this.accountId}/agreements/${agreementId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get agreement ${agreementId}: ${(error as Error).message}`);
    }
  }

  async searchAgreements(query: string, params: Omit<GetAgreementListParams, 'query'> = {}): Promise<AgreementListResponse> {
    return this.getAgreementList({
      ...params,
      query
    });
  }

  async getAgreementsByStatus(statuses: string[], params: Omit<GetAgreementListParams, 'status'> = {}): Promise<AgreementListResponse> {
    return this.getAgreementList({
      ...params,
      status: statuses
    });
  }

  async getAllAgreements(params: Omit<GetAgreementListParams, 'cursor'> = {}): Promise<NavigatorAgreement[]> {
    const allAgreements: NavigatorAgreement[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.getAgreementList({
        ...params,
        cursor
      });

      const agreementList = response.userAgreementList || response.data || [];
      allAgreements.push(...agreementList);
      cursor = response.page?.nextCursor;
    } while (cursor);

    return allAgreements;
  }

  setAccountId(accountId: string): void {
    this.accountId = accountId;
  }

  getAccountId(): string | null {
    return this.accountId;
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}