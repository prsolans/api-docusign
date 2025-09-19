export const REQUIRED_SCOPES = [
  // Navigator Authentication Scopes
  'adm_store_unified_repo_read', // Access to unified repository
  'models_read', // Read access to Navigator models

  // Navigator API Scopes
  'signature', // Core signature functionality
  'agreement_read', // Read Navigator agreements
  'agreement_write', // Write Navigator agreements

  // CLM API Scopes
  'spring_read', // Read access to CLM (SpringCM) data
  'spring_write' // Write access to CLM (SpringCM) data
];

export const SCOPE_STRING = REQUIRED_SCOPES.join(' ');