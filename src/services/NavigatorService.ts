import { DocuSignAuth } from '../auth/DocuSignAuth';
import { ApiClient } from '../utils/apiClient';
import {
  NavigatorAgreement,
  AgreementListResponse,
  GetAgreementListParams,
  AgreementSummaryResponse,
  AgreementProvisions,
  AgreementParty,
  AgreementMetadata
} from '../types/navigator';

// Enhanced filter operators for complex queries
export type FilterOperator = '=' | 'gte' | 'lte' | 'gt' | 'lt' | 'ne' | 'in';

// Complex filter structure to support operator syntax
export interface ComplexFilter {
  field?: string; // Optional for flexibility
  operator?: FilterOperator;
  value: string | number | string[];
}

// Simple filter for convenience
export interface SimpleFilter {
  operator: FilterOperator;
  value: string | number;
}

// Enhanced parameter interface with all documented filters
export interface EnhancedAgreementListParams extends GetAgreementListParams {
  // Basic parameters
  limit?: number;
  ctoken?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  
  // Direct filters
  id?: string | string[];
  status?: string | string[];
  title?: string;
  source_name?: string;
  source_id?: string;
  languages?: string[];
  
  // Party filters
  'parties.name_in_agreement'?: string;
  
  // Metadata filters with operators
  'metadata.created_at'?: string | ComplexFilter;
  
  // Provision filters with operators
  'provisions.effective_date'?: string | ComplexFilter | SimpleFilter;
  'provisions.expiration_date'?: string | ComplexFilter | SimpleFilter;
  'provisions.execution_date'?: string | ComplexFilter | SimpleFilter;
  'provisions.term_length'?: string | ComplexFilter | SimpleFilter;
  'provisions.total_agreement_value'?: number | ComplexFilter | SimpleFilter;
  'provisions.annual_agreement_value'?: number | ComplexFilter | SimpleFilter;
  'provisions.governing_law'?: string;
  'provisions.payment_terms_due_date'?: string;
  
  // Related documents filter
  'related_agreement_documents.parent_agreement_document_id'?: string;
  
  // Allow any additional filters for flexibility
  [key: string]: any;
}

export class NavigatorService {
  private apiClient: ApiClient;
  private auth: DocuSignAuth;
  private accountId: string | null = null;

  constructor(auth: DocuSignAuth, accountId?: string) {
    this.auth = auth;
    this.accountId = accountId || auth.getConfig().accountId || null;
    this.apiClient = new ApiClient(auth, {
      baseURL: auth.getConfig().navigatorBaseUrl || 
               (auth.getConfig().environment === 'production' 
                 ? 'https://api.docusign.com' 
                 : 'https://api-d.docusign.com'),
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    });
  }

  /**
   * Build query parameters with support for complex filters and operators
   */
  private buildQueryParams(params: EnhancedAgreementListParams): URLSearchParams {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Handle complex filters with operators
      if (typeof value === 'object' && 'field' in value && 'value' in value) {
        const filter = value as ComplexFilter;
        const operator = filter.operator || '=';
        
        if (operator === '=') {
          queryParams.append(filter.field || key, String(filter.value));
        } else {
          queryParams.append(`${filter.field || key}[${operator}]`, String(filter.value));
        }
      } 
      // Handle array values (for 'in' operations or multiple values)
      else if (Array.isArray(value)) {
        if (key === 'id' && value.length > 1) {
          // For multiple IDs, use the [in] operator
          queryParams.append('id[in]', value.join(','));
        } else {
          value.forEach(v => queryParams.append(key, String(v)));
        }
      }
      // Handle date/time filters with operators
      else if (key.includes('.') && (key.includes('date') || key.includes('created_at'))) {
        // Parse operator from value if present (e.g., "gte:2025-01-01")
        const strValue = String(value);
        const operatorMatch = strValue.match(/^(gte|lte|gt|lt|ne):(.*)/);
        
        if (operatorMatch) {
          const [, op, val] = operatorMatch;
          queryParams.append(`${key}[${op}]`, val);
        } else {
          queryParams.append(key, strValue);
        }
      }
      // Handle standard parameters
      else {
        queryParams.append(key, String(value));
      }
    });

    return queryParams;
  }

  /**
   * Map Navigator API response to NavigatorAgreement interface
   */
  private mapNavigatorAgreement(rawAgreement: any): NavigatorAgreement {
    return {
      agreementId: rawAgreement.id || rawAgreement.agreementId,
      name: rawAgreement.title || rawAgreement.name,
      status: rawAgreement.status,
      createdDate: rawAgreement.metadata?.created_at || rawAgreement.createdDate || '',
      modifiedDate: rawAgreement.metadata?.modified_at || rawAgreement.modifiedDate || '',
      participantSetsInfo: rawAgreement.participantSetsInfo || []
    };
  }

  /**
   * Get a list of agreements with comprehensive filtering
   */
  async getAgreementList(params: EnhancedAgreementListParams = {}): Promise<AgreementListResponse> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls');
    }

    try {
      // Set defaults
      const queryParams = this.buildQueryParams({
        limit: params.limit || 20,
        sort: params.sort || 'metadata.created_at',
        direction: params.direction || 'desc',
        ...params
      });

      const url = `/v1/accounts/${this.accountId}/agreements?${queryParams.toString()}`;
      const response = await this.apiClient.get<any>(url);

      // Map raw API response to expected format
      const rawData = response.data;
      const agreements = (rawData.data || rawData.agreements || []).map((agreement: any) =>
        this.mapNavigatorAgreement(agreement)
      );

      // Return in expected format
      return {
        data: agreements,
        userAgreementList: agreements, // For compatibility
        page: rawData.response_metadata ? {
          nextCursor: rawData.response_metadata.page_token_next,
          pageSize: params.limit || 20
        } : undefined,
        total: agreements.length,
        limit: params.limit || 20,
        ctoken: rawData.response_metadata?.page_token_next
      };
    } catch (error) {
      throw new Error(`Failed to get agreement list: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed information about a specific agreement
   */
  async getAgreement(agreementId: string): Promise<NavigatorAgreement> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls');
    }

    try {
      const response = await this.apiClient.get<any>(
        `/v1/accounts/${this.accountId}/agreements/${agreementId}`
      );
      return this.mapNavigatorAgreement(response.data);
    } catch (error) {
      throw new Error(`Failed to get agreement ${agreementId}: ${(error as Error).message}`);
    }
  }

  /**
   * Create an AI-generated summary of an agreement
   * Note: By using this, you accept the Docusign AI Terms and Conditions
   */
  async createAgreementSummary(agreementId: string): Promise<AgreementSummaryResponse> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls');
    }

    try {
      const response = await this.apiClient.post<AgreementSummaryResponse>(
        `/v1/accounts/${this.accountId}/agreements/${agreementId}/ai/actions/summarize`,
        {}
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create agreement summary: ${(error as Error).message}`);
    }
  }

  /**
   * Delete an agreement
   */
  async deleteAgreement(agreementId: string): Promise<void> {
    if (!this.accountId) {
      throw new Error('Account ID is required for Navigator API calls');
    }

    try {
      await this.apiClient.delete(`/v1/accounts/${this.accountId}/agreements/${agreementId}`);
    } catch (error) {
      throw new Error(`Failed to delete agreement ${agreementId}: ${(error as Error).message}`);
    }
  }

  /**
   * Search agreements by provisions with complex filters
   */
  async searchByProvisions(filters: {
    effectiveDate?: SimpleFilter;
    expirationDate?: SimpleFilter;
    totalValue?: SimpleFilter;
    annualValue?: SimpleFilter;
    governingLaw?: string;
    paymentTerms?: string;
    termLength?: SimpleFilter;
  }, additionalParams?: EnhancedAgreementListParams): Promise<AgreementListResponse> {
    const params: EnhancedAgreementListParams = { ...additionalParams };

    if (filters.effectiveDate) {
      params['provisions.effective_date'] = filters.effectiveDate;
    }
    if (filters.expirationDate) {
      params['provisions.expiration_date'] = filters.expirationDate;
    }
    if (filters.totalValue) {
      params['provisions.total_agreement_value'] = filters.totalValue;
    }
    if (filters.annualValue) {
      params['provisions.annual_agreement_value'] = filters.annualValue;
    }
    if (filters.governingLaw) {
      params['provisions.governing_law'] = filters.governingLaw;
    }
    if (filters.paymentTerms) {
      params['provisions.payment_terms_due_date'] = filters.paymentTerms;
    }
    if (filters.termLength) {
      params['provisions.term_length'] = filters.termLength;
    }

    return this.getAgreementList(params);
  }

  /**
   * Get agreements expiring within a date range
   */
  async getExpiringAgreements(
    startDate: string, 
    endDate?: string,
    additionalParams?: EnhancedAgreementListParams
  ): Promise<AgreementListResponse> {
    const params: EnhancedAgreementListParams = {
      ...additionalParams,
      'provisions.expiration_date': endDate 
        ? { field: 'provisions.expiration_date', operator: 'gte', value: `${startDate}T00:00:00` }
        : { field: 'provisions.expiration_date', operator: 'gte', value: `${startDate}T00:00:00` }
    };

    if (endDate) {
      // Add upper bound
      params['provisions.expiration_date[lte]'] = `${endDate}T23:59:59`;
    }

    return this.getAgreementList(params);
  }

  /**
   * Get high-value agreements above a threshold
   */
  async getHighValueAgreements(
    minValue: number,
    additionalParams?: EnhancedAgreementListParams
  ): Promise<AgreementListResponse> {
    return this.searchByProvisions(
      {
        totalValue: { operator: 'gte', value: minValue }
      },
      additionalParams
    );
  }

  /**
   * Get agreements by governing law
   */
  async getAgreementsByGoverningLaw(
    governingLaw: string,
    additionalParams?: EnhancedAgreementListParams
  ): Promise<AgreementListResponse> {
    return this.getAgreementList({
      ...additionalParams,
      'provisions.governing_law': governingLaw
    });
  }

  /**
   * Get agreements created within a date range
   */
  async getAgreementsByCreatedDate(
    startDate: string,
    endDate?: string,
    additionalParams?: EnhancedAgreementListParams
  ): Promise<AgreementListResponse> {
    const params: EnhancedAgreementListParams = {
      ...additionalParams,
      'metadata.created_at': { 
        field: 'metadata.created_at', 
        operator: 'gte', 
        value: `${startDate}T00:00:00` 
      }
    };

    if (endDate) {
      params['metadata.created_at[lte]'] = `${endDate}T23:59:59`;
    }

    return this.getAgreementList(params);
  }

  /**
   * Get all agreements with pagination (fetches all pages)
   */
  async getAllAgreements(params: EnhancedAgreementListParams = {}): Promise<NavigatorAgreement[]> {
    const allAgreements: NavigatorAgreement[] = [];
    let ctoken: string | undefined;
    const pageSize = params.limit || 100;

    do {
      const response = await this.getAgreementList({
        ...params,
        limit: pageSize,
        ctoken
      });

      const agreementList = response.userAgreementList || response.data || [];
      allAgreements.push(...agreementList);
      
      // Get next page token
      ctoken = response.page?.nextCursor || response.ctoken;
    } while (ctoken);

    return allAgreements;
  }

  /**
   * Get detailed information for multiple agreements
   */
  async getMultipleAgreementDetails(
    agreementIds: string[],
    options?: { 
      includeFailures?: boolean;
      batchSize?: number;
      delayMs?: number;
    }
  ): Promise<{
    successful: NavigatorAgreement[];
    failed: { id: string; error: string }[];
  }> {
    const successful: NavigatorAgreement[] = [];
    const failed: { id: string; error: string }[] = [];
    const batchSize = options?.batchSize || 5;
    const delayMs = options?.delayMs || 200;

    // Process in batches to avoid rate limits
    for (let i = 0; i < agreementIds.length; i += batchSize) {
      const batch = agreementIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (id) => {
        try {
          const agreement = await this.getAgreement(id);
          successful.push(agreement);
        } catch (error) {
          if (options?.includeFailures) {
            failed.push({ 
              id, 
              error: (error as Error).message 
            });
          }
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches
      if (i + batchSize < agreementIds.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { successful, failed };
  }

  // Utility methods
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