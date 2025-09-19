import dotenv from 'dotenv';
dotenv.config();

import { DocuSignAuth } from '../src/auth/DocuSignAuth';
import { TokenManager } from '../src/auth/TokenManager';
import { DocuSignConfig, TokenData } from '../src/types/auth';

describe('Authentication Tests', () => {
  let auth: DocuSignAuth;
  let config: DocuSignConfig;

  beforeEach(() => {
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
      environment: 'sandbox',
      authBaseUrl: 'https://account-d.docusign.com',
      navigatorBaseUrl: 'https://demo.docusign.net/restapi',
      clmBaseUrl: 'https://demo.springcm.com'
    };
    auth = new DocuSignAuth(config);
  });

  describe('DocuSignAuth', () => {
    test('should create instance with valid config', () => {
      expect(auth).toBeInstanceOf(DocuSignAuth);
      expect(auth.getConfig()).toEqual(config);
    });

    test('should generate authorization URL', () => {
      const state = 'test-state';
      const authUrl = auth.generateAuthorizationUrl(state);

      expect(authUrl).toContain(config.authBaseUrl);
      expect(authUrl).toContain('oauth/auth');
      expect(authUrl).toContain(`client_id=${config.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(config.redirectUri)}`);
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain('response_type=code');
    });

    test('should not be authenticated initially', () => {
      expect(auth.isAuthenticated()).toBe(false);
    });

    test('should create from environment variables', () => {
      // Set required environment variables
      process.env.DOCUSIGN_CLIENT_ID = 'env-client-id';
      process.env.DOCUSIGN_CLIENT_SECRET = 'env-client-secret';
      process.env.DOCUSIGN_REDIRECT_URI = 'http://localhost:3000/callback';
      process.env.DOCUSIGN_ENVIRONMENT = 'sandbox';
      process.env.DOCUSIGN_AUTH_BASE_URL = 'https://account-d.docusign.com';
      process.env.DOCUSIGN_NAVIGATOR_BASE_URL = 'https://demo.docusign.net/restapi';
      process.env.DOCUSIGN_CLM_BASE_URL = 'https://demo.springcm.com';

      const authFromEnv = DocuSignAuth.createFromEnv();
      expect(authFromEnv.getConfig().clientId).toBe('env-client-id');

      // Clean up
      delete process.env.DOCUSIGN_CLIENT_ID;
      delete process.env.DOCUSIGN_CLIENT_SECRET;
      delete process.env.DOCUSIGN_REDIRECT_URI;
      delete process.env.DOCUSIGN_ENVIRONMENT;
      delete process.env.DOCUSIGN_AUTH_BASE_URL;
      delete process.env.DOCUSIGN_NAVIGATOR_BASE_URL;
      delete process.env.DOCUSIGN_CLM_BASE_URL;
    });

    test('should throw error when missing environment variables', () => {
      expect(() => {
        DocuSignAuth.createFromEnv();
      }).toThrow('Missing required environment variables');
    });
  });

  describe('TokenManager', () => {
    let tokenManager: TokenManager;
    let mockTokenData: TokenData;

    beforeEach(() => {
      tokenManager = new TokenManager();
      mockTokenData = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'signature agreement_read',
        obtained_at: Date.now()
      };
    });

    test('should not be authenticated initially', () => {
      expect(tokenManager.isAuthenticated()).toBe(false);
      expect(tokenManager.getAccessToken()).toBeNull();
    });

    test('should store and retrieve token data', () => {
      tokenManager.setTokenData(mockTokenData);

      expect(tokenManager.isAuthenticated()).toBe(true);
      expect(tokenManager.getAccessToken()).toBe(mockTokenData.access_token);
      expect(tokenManager.getRefreshToken()).toBe(mockTokenData.refresh_token);
    });

    test('should detect expired tokens', () => {
      const expiredTokenData = {
        ...mockTokenData,
        expires_in: -1, // Expired immediately
        obtained_at: Date.now() - 10000 // 10 seconds ago
      };

      tokenManager.setTokenData(expiredTokenData);

      expect(tokenManager.isTokenExpired()).toBe(true);
      expect(tokenManager.isAuthenticated()).toBe(false);
      expect(tokenManager.getAccessToken()).toBeNull();
    });

    test('should identify tokens that need refresh', () => {
      const expiredTokenData = {
        ...mockTokenData,
        expires_in: -1,
        obtained_at: Date.now() - 10000
      };

      tokenManager.setTokenData(expiredTokenData);

      expect(tokenManager.needsRefresh()).toBe(true);
    });

    test('should clear token data', () => {
      tokenManager.setTokenData(mockTokenData);
      expect(tokenManager.isAuthenticated()).toBe(true);

      tokenManager.clearTokenData();
      expect(tokenManager.isAuthenticated()).toBe(false);
      expect(tokenManager.getTokenData()).toBeNull();
    });

    test('should calculate token expiry time', () => {
      tokenManager.setTokenData(mockTokenData);

      const expiryTime = tokenManager.getTokenExpiryTime();
      expect(expiryTime).toBeInstanceOf(Date);

      const expectedExpiry = new Date(mockTokenData.obtained_at + (mockTokenData.expires_in * 1000));
      expect(expiryTime?.getTime()).toBe(expectedExpiry.getTime());
    });
  });
});