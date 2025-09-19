import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { DocuSignAuth } from '../auth/DocuSignAuth';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ApiClient {
  private httpClient: AxiosInstance;
  private auth: DocuSignAuth;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(auth: DocuSignAuth, config: ApiClientConfig) {
    this.auth = auth;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.httpClient = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add authentication header
    this.httpClient.interceptors.request.use(
      async (config) => {
        try {
          const accessToken = await this.auth.getValidAccessToken();
          config.headers.Authorization = `Bearer ${accessToken}`;
        } catch (error) {
          throw new Error(`Authentication failed: ${error}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and retries
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.auth.refreshAccessToken();
            const accessToken = await this.auth.getValidAccessToken();
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.httpClient(originalRequest);
          } catch (refreshError) {
            this.auth.logout();
            throw new Error('Authentication failed. Please re-authenticate.');
          }
        }

        // Handle rate limiting (429) with exponential backoff
        if (error.response?.status === 429 && originalRequest._retryCount < this.retryAttempts) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          const delay = this.retryDelay * Math.pow(2, originalRequest._retryCount - 1);

          await this.sleep(delay);
          return this.httpClient(originalRequest);
        }

        // Handle server errors (5xx) with retry
        if (error.response?.status >= 500 && originalRequest._retryCount < this.retryAttempts) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          const delay = this.retryDelay * originalRequest._retryCount;

          await this.sleep(delay);
          return this.httpClient(originalRequest);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ||
                    error.response?.data?.error_description ||
                    error.response?.statusText ||
                    error.message;

      return new Error(`API Error (${error.response?.status || 'Unknown'}): ${message}`);
    }
    return error;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.httpClient.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.httpClient.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.httpClient.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.httpClient.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.httpClient.delete(url, config);
  }
}