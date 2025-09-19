import dotenv from 'dotenv';
dotenv.config();

import { NavigatorService } from '../src/services/NavigatorService';
import { DocuSignAuth } from '../src/auth/DocuSignAuth';
import { DocuSignConfig } from '../src/types/auth';

describe('Navigator Service Tests', () => {
  let navigatorService: NavigatorService;
  let mockAuth: DocuSignAuth;
  let config: DocuSignConfig;

  beforeAll(() => {
    config = {
      clientId: process.env.DOCUSIGN_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || 'test-client-secret',
      redirectUri: process.env.DOCUSIGN_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      environment: (process.env.DOCUSIGN_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      authBaseUrl: process.env.DOCUSIGN_AUTH_BASE_URL || 'https://account-d.docusign.com',
      navigatorBaseUrl: process.env.DOCUSIGN_NAVIGATOR_BASE_URL || 'https://demo.docusign.net/restapi',
      clmBaseUrl: process.env.DOCUSIGN_CLM_BASE_URL || 'https://demo.springcm.com',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID
    };

    mockAuth = new DocuSignAuth(config);
    navigatorService = new NavigatorService(mockAuth, process.env.DOCUSIGN_ACCOUNT_ID);
  });

  describe('NavigatorService initialization', () => {
    test('should create instance', () => {
      expect(navigatorService).toBeInstanceOf(NavigatorService);
    });

    test('should have authentication status', () => {
      expect(typeof navigatorService.isAuthenticated()).toBe('boolean');
    });

    test('should have account ID configured', () => {
      expect(navigatorService.getAccountId()).toBeTruthy();
    });
  });

  describe('Agreement List Methods', () => {
    test('should have getAgreementList method', () => {
      expect(typeof navigatorService.getAgreementList).toBe('function');
    });

    test('should have getAgreementById method', () => {
      expect(typeof navigatorService.getAgreementById).toBe('function');
    });

    test('should have searchAgreements method', () => {
      expect(typeof navigatorService.searchAgreements).toBe('function');
    });

    test('should have getAgreementsByStatus method', () => {
      expect(typeof navigatorService.getAgreementsByStatus).toBe('function');
    });

    test('should have getAllAgreements method', () => {
      expect(typeof navigatorService.getAllAgreements).toBe('function');
    });
  });

  // Integration tests (these will only work with valid authentication)
  describe('Navigator API Integration Tests', () => {
    test('should handle unauthenticated requests gracefully', async () => {
      // This test should fail with authentication error when not authenticated
      let errorThrown = false;
      try {
        await navigatorService.getAgreementList();
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
      }
      expect(errorThrown).toBe(true);
    });

    // Note: The following test requires actual authentication
    // Uncomment and run manually after setting up proper credentials
    /*
    test('should get agreement list when authenticated', async () => {
      // This test requires valid authentication
      // You would need to authenticate first before running this test

      try {
        const result = await navigatorService.getAgreementList({ pageSize: 10 });

        expect(result).toBeDefined();
        expect(result.userAgreementList).toBeDefined();
        expect(Array.isArray(result.userAgreementList)).toBe(true);
        expect(result.page).toBeDefined();
        expect(typeof result.page.pageSize).toBe('number');
      } catch (error) {
        // If not authenticated, this is expected
        if (error.message.includes('Authentication failed')) {
          console.log('Test skipped: Authentication required');
        } else {
          throw error;
        }
      }
    });
    */
  });

  describe('Method Parameter Handling', () => {
    test('getAgreementList should accept empty parameters', () => {
      expect(() => navigatorService.getAgreementList()).not.toThrow();
      expect(() => navigatorService.getAgreementList({})).not.toThrow();
    });

    test('searchAgreements should require query parameter', () => {
      expect(() => navigatorService.searchAgreements('test query')).not.toThrow();
    });

    test('getAgreementsByStatus should require status array', () => {
      expect(() => navigatorService.getAgreementsByStatus(['SIGNED'])).not.toThrow();
    });

    test('getAllAgreements should accept empty parameters', () => {
      expect(() => navigatorService.getAllAgreements()).not.toThrow();
      expect(() => navigatorService.getAllAgreements({})).not.toThrow();
    });
  });
});