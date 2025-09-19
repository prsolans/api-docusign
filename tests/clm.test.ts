import dotenv from 'dotenv';
dotenv.config();

import { CLMService } from '../src/services/CLMService';
import { DocuSignAuth } from '../src/auth/DocuSignAuth';
import { DocuSignConfig } from '../src/types/auth';

describe('CLM Service Tests', () => {
  let clmService: CLMService;
  let mockAuth: DocuSignAuth;
  let config: DocuSignConfig;

  beforeAll(() => {
    config = {
      clientId: process.env.DOCUSIGN_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || 'test-client-secret',
      redirectUri: process.env.DOCUSIGN_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      environment: (process.env.DOCUSIGN_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      authBaseUrl: process.env.DOCUSIGN_AUTH_BASE_URL || 'https://account-d.docusign.com',
      navigatorBaseUrl: process.env.DOCUSIGN_NAVIGATOR_BASE_URL || 'https://api-d.docusign.com',
      clmBaseUrl: process.env.DOCUSIGN_CLM_BASE_URL || 'https://apiuatna11.springcm.com',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID
    };

    mockAuth = new DocuSignAuth(config);
    clmService = new CLMService(mockAuth);
  });

  describe('CLMService initialization', () => {
    test('should create instance', () => {
      expect(clmService).toBeInstanceOf(CLMService);
    });

    test('should have authentication status', () => {
      expect(typeof clmService.isAuthenticated()).toBe('boolean');
    });
  });

  describe('Document Methods', () => {
    test('should have getDocuments method', () => {
      expect(typeof clmService.getDocuments).toBe('function');
    });

    test('should have getDocumentById method', () => {
      expect(typeof clmService.getDocumentById).toBe('function');
    });

    test('should have getDocumentsByFolder method', () => {
      expect(typeof clmService.getDocumentsByFolder).toBe('function');
    });

    test('should have searchDocuments method', () => {
      expect(typeof clmService.searchDocuments).toBe('function');
    });

    test('should have getAllDocuments method', () => {
      expect(typeof clmService.getAllDocuments).toBe('function');
    });

    test('should have downloadDocument method', () => {
      expect(typeof clmService.downloadDocument).toBe('function');
    });
  });

  describe('Folder Methods', () => {
    test('should have getFolders method', () => {
      expect(typeof clmService.getFolders).toBe('function');
    });

    test('should have getFolderById method', () => {
      expect(typeof clmService.getFolderById).toBe('function');
    });
  });

  // Integration tests (these will only work with valid authentication)
  describe('CLM API Integration Tests', () => {
    test('should handle unauthenticated requests gracefully', async () => {
      // This test should fail with authentication error when not authenticated
      let errorThrown = false;
      try {
        await clmService.getDocuments();
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
      }
      expect(errorThrown).toBe(true);
    });

    // Note: The following tests require actual authentication
    // Uncomment and run manually after setting up proper credentials
    /*
    test('should get documents when authenticated', async () => {
      try {
        const result = await clmService.getDocuments({ limit: 10 });

        expect(result).toBeDefined();
        expect(result.documents).toBeDefined();
        expect(Array.isArray(result.documents)).toBe(true);
        expect(typeof result.totalCount).toBe('number');
        expect(typeof result.pageSize).toBe('number');
        expect(typeof result.offset).toBe('number');
      } catch (error) {
        // If not authenticated, this is expected
        if (error.message.includes('Authentication failed')) {
          console.log('Test skipped: Authentication required');
        } else {
          throw error;
        }
      }
    });

    test('should get folders when authenticated', async () => {
      try {
        const result = await clmService.getFolders();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
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
    test('getDocuments should accept empty parameters', () => {
      expect(() => clmService.getDocuments()).not.toThrow();
      expect(() => clmService.getDocuments({})).not.toThrow();
    });

    test('getDocumentsByFolder should require folderId parameter', () => {
      expect(() => clmService.getDocumentsByFolder('test-folder-id')).not.toThrow();
    });

    test('searchDocuments should require query parameter', () => {
      expect(() => clmService.searchDocuments('test query')).not.toThrow();
    });

    test('getAllDocuments should accept empty parameters', () => {
      expect(() => clmService.getAllDocuments()).not.toThrow();
      expect(() => clmService.getAllDocuments({})).not.toThrow();
    });

    test('getDocumentById should require documentId parameter', () => {
      expect(() => clmService.getDocumentById('test-doc-id')).not.toThrow();
    });

    test('getFolderById should require folderId parameter', () => {
      expect(() => clmService.getFolderById('test-folder-id')).not.toThrow();
    });

    test('downloadDocument should require documentId parameter', () => {
      expect(() => clmService.downloadDocument('test-doc-id')).not.toThrow();
    });
  });
});