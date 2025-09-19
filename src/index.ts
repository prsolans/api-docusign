import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export main services
export { DocuSignAuth } from './auth/DocuSignAuth';
export { TokenManager } from './auth/TokenManager';
export { NavigatorService } from './services/NavigatorService';
export { CLMService } from './services/CLMService';
export { ApiClient } from './utils/apiClient';

// Export types
export * from './types/auth';
export * from './types/navigator';
export * from './types/clm';

// Export configuration
export { REQUIRED_SCOPES, SCOPE_STRING } from './config/scopes';

// Factory function for easy setup
import { DocuSignAuth } from './auth/DocuSignAuth';
import { NavigatorService } from './services/NavigatorService';
import { CLMService } from './services/CLMService';

export interface DocuSignServices {
  auth: DocuSignAuth;
  navigator: NavigatorService;
  clm: CLMService;
}

export function createDocuSignServices(accountId?: string): DocuSignServices {
  const auth = DocuSignAuth.createFromEnv();
  const navigator = new NavigatorService(auth, accountId);
  const clm = new CLMService(auth);

  return {
    auth,
    navigator,
    clm
  };
}