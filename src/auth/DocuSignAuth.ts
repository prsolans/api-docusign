import axios, { AxiosInstance } from 'axios';
import { DocuSignConfig, TokenData, AuthorizationUrlParams, TokenExchangeParams } from '../types/auth';
import { SCOPE_STRING } from '../config/scopes';
import { TokenManager } from './TokenManager';
import { createHash, randomBytes } from 'crypto';

export class DocuSignAuth {
  private config: DocuSignConfig;
  private tokenManager: TokenManager;
  private httpClient: AxiosInstance;
  private codeVerifier: string | null = null;

  constructor(config: DocuSignConfig) {
    this.config = config;
    this.tokenManager = new TokenManager();
    this.httpClient = axios.create({
      baseURL: config.authBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
  }

  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  generateAuthorizationUrl(state?: string): string {
    // Generate PKCE parameters
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(this.codeVerifier);

    const params: AuthorizationUrlParams = {
      response_type: 'code',
      scope: SCOPE_STRING,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...(state && { state })
    };

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return `${this.config.authBaseUrl}/oauth/auth?${searchParams.toString()}`;
  }

  async exchangeCodeForToken(authorizationCode: string): Promise<TokenData> {
    if (!this.codeVerifier) {
      throw new Error('Code verifier not found. Please generate authorization URL first.');
    }

    const params: TokenExchangeParams = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: this.codeVerifier
    };

    try {
      const formParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formParams.append(key, String(value));
        }
      });

      const response = await this.httpClient.post('/oauth/token', formParams);

      const tokenData: TokenData = {
        ...response.data,
        obtained_at: Date.now()
      };

      this.tokenManager.setTokenData(tokenData);

      // Clear the code verifier after successful exchange
      this.codeVerifier = null;

      return tokenData;
    } catch (error) {
      // Clear the code verifier on error too
      this.codeVerifier = null;

      if (axios.isAxiosError(error)) {
        throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }

  async refreshAccessToken(): Promise<TokenData> {
    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const params: TokenExchangeParams = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    };

    try {
      const formParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formParams.append(key, String(value));
        }
      });

      const response = await this.httpClient.post('/oauth/token', formParams);

      const tokenData: TokenData = {
        ...response.data,
        obtained_at: Date.now()
      };

      this.tokenManager.setTokenData(tokenData);
      return tokenData;
    } catch (error) {
      this.tokenManager.clearTokenData();
      if (axios.isAxiosError(error)) {
        throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }

  async getValidAccessToken(): Promise<string> {
    // Check if current token is valid
    const currentToken = this.tokenManager.getAccessToken();
    if (currentToken) {
      return currentToken;
    }

    // Try to refresh if we have a refresh token
    if (this.tokenManager.needsRefresh()) {
      const refreshedTokenData = await this.refreshAccessToken();
      return refreshedTokenData.access_token;
    }

    throw new Error('No valid access token available. Please re-authenticate.');
  }

  isAuthenticated(): boolean {
    return this.tokenManager.isAuthenticated();
  }

  getTokenData(): TokenData | null {
    return this.tokenManager.getTokenData();
  }

  logout(): void {
    this.tokenManager.clearTokenData();
  }

  getConfig(): DocuSignConfig {
    return this.config;
  }

  static createFromEnv(): DocuSignAuth {
    const requiredEnvVars = [
      'DOCUSIGN_CLIENT_ID',
      'DOCUSIGN_CLIENT_SECRET',
      'DOCUSIGN_REDIRECT_URI',
      'DOCUSIGN_ENVIRONMENT',
      'DOCUSIGN_AUTH_BASE_URL',
      'DOCUSIGN_NAVIGATOR_BASE_URL',
      'DOCUSIGN_CLM_BASE_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const config: DocuSignConfig = {
      clientId: process.env.DOCUSIGN_CLIENT_ID!,
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET!,
      redirectUri: process.env.DOCUSIGN_REDIRECT_URI!,
      environment: process.env.DOCUSIGN_ENVIRONMENT as 'sandbox' | 'production',
      authBaseUrl: process.env.DOCUSIGN_AUTH_BASE_URL!,
      navigatorBaseUrl: process.env.DOCUSIGN_NAVIGATOR_BASE_URL!,
      clmBaseUrl: process.env.DOCUSIGN_CLM_BASE_URL!,
      accountId: process.env.DOCUSIGN_ACCOUNT_ID
    };

    return new DocuSignAuth(config);
  }
}