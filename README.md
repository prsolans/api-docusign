# DocuSign Unified API Service

A unified TypeScript/Node.js service for accessing both DocuSign Navigator and CLM (SpringCM) APIs with shared authentication.

## Features

- **Unified Authentication**: Single OAuth2 flow for both Navigator and CLM APIs
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Automatic Token Management**: Built-in token refresh and expiration handling
- **Error Handling**: Robust error handling with retry logic
- **Testing**: Comprehensive test suite included
- **Easy Integration**: Clean service interfaces ready for future applications

## Supported APIs

### Navigator API
- ✅ Get agreement list (`getAgreementList`)
- ✅ Get agreement by ID
- ✅ Search agreements
- ✅ Filter agreements by status
- ✅ Automatic pagination handling

### CLM (SpringCM) API
- ✅ Get documents (`getDocuments`)
- ✅ Get document by ID
- ✅ Search documents
- ✅ Get documents by folder
- ✅ Download documents
- ✅ Get folders and folder hierarchy

## Required Scopes

The service requires these OAuth2 scopes:

```typescript
const REQUIRED_SCOPES = [
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
```

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure your DocuSign application:

```bash
cp .env.example .env
```

Edit `.env` with your DocuSign application credentials:

```env
DOCUSIGN_CLIENT_ID=your_client_id_here
DOCUSIGN_CLIENT_SECRET=your_client_secret_here
DOCUSIGN_REDIRECT_URI=http://localhost:3000/auth/callback
DOCUSIGN_ENVIRONMENT=sandbox

DOCUSIGN_NAVIGATOR_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_CLM_BASE_URL=https://demo.springcm.com
DOCUSIGN_AUTH_BASE_URL=https://account-d.docusign.com
```

### 3. Basic Usage

```typescript
import { createDocuSignServices } from './src/index';

async function example() {
  // Create all services with unified authentication
  const { auth, navigator, clm } = createDocuSignServices();

  // 1. Generate authorization URL for user consent
  const authUrl = auth.generateAuthorizationUrl('your-state-value');
  console.log('Visit this URL to authorize:', authUrl);

  // 2. After user authorization, exchange code for tokens
  const authCode = 'authorization_code_from_callback';
  await auth.exchangeCodeForToken(authCode);

  // 3. Now you can use both APIs with the same authentication

  // Navigator API - Get agreements
  const agreements = await navigator.getAgreementList({
    pageSize: 10,
    status: ['SIGNED', 'COMPLETED']
  });

  console.log(`Found ${agreements.userAgreementList.length} agreements`);

  // CLM API - Get documents
  const documents = await clm.getDocuments({
    limit: 10,
    sortBy: 'modifiedDate',
    sortOrder: 'desc'
  });

  console.log(`Found ${documents.documents.length} documents`);
}
```

## API Reference

### Authentication Service

```typescript
const auth = new DocuSignAuth(config);

// Generate authorization URL
const authUrl = auth.generateAuthorizationUrl(state);

// Exchange authorization code for tokens
await auth.exchangeCodeForToken(authorizationCode);

// Check authentication status
const isAuth = auth.isAuthenticated();

// Get valid access token (auto-refreshes if needed)
const token = await auth.getValidAccessToken();

// Logout
auth.logout();
```

### Navigator Service

```typescript
const navigator = new NavigatorService(auth);

// Get agreement list with options
const agreements = await navigator.getAgreementList({
  pageSize: 20,
  cursor: 'next_page_cursor',
  status: ['SIGNED', 'COMPLETED'],
  query: 'search_term'
});

// Get specific agreement
const agreement = await navigator.getAgreementById('agreement-id');

// Search agreements
const searchResults = await navigator.searchAgreements('contract');

// Get agreements by status
const signedAgreements = await navigator.getAgreementsByStatus(['SIGNED']);

// Get all agreements (handles pagination automatically)
const allAgreements = await navigator.getAllAgreements();
```

### CLM Service

```typescript
const clm = new CLMService(auth);

// Get documents with options
const documents = await clm.getDocuments({
  limit: 50,
  offset: 0,
  folderId: 'folder-id',
  query: 'search_term',
  sortBy: 'modifiedDate',
  sortOrder: 'desc'
});

// Get specific document
const document = await clm.getDocumentById('document-id');

// Get documents by folder
const folderDocs = await clm.getDocumentsByFolder('folder-id');

// Search documents
const searchResults = await clm.searchDocuments('contract');

// Get all documents (handles pagination automatically)
const allDocuments = await clm.getAllDocuments();

// Get folders
const folders = await clm.getFolders();

// Download document
const fileBuffer = await clm.downloadDocument('document-id');
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Integration Testing

The included tests verify:
- ✅ Authentication flow and token management
- ✅ Service initialization and method availability
- ✅ Parameter validation
- ✅ Error handling for unauthenticated requests

For actual API testing with real credentials:
1. Set up your `.env` file with valid credentials
2. Authenticate once manually
3. Uncomment the integration test sections in the test files

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## Error Handling

The service includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh, clear error messages
- **Rate Limiting**: Exponential backoff retry strategy
- **Network Errors**: Automatic retry for temporary failures
- **API Errors**: Detailed error messages with status codes

```typescript
try {
  const agreements = await navigator.getAgreementList();
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    // Handle authentication errors
    console.log('Please re-authenticate');
  } else {
    // Handle other API errors
    console.error('API Error:', error.message);
  }
}
```

## Architecture

```
api-docusign/
├── src/
│   ├── auth/                 # Authentication & token management
│   ├── services/             # Navigator & CLM service classes
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Shared utilities (HTTP client)
│   └── config/               # Configuration (scopes, etc.)
├── tests/                    # Comprehensive test suite
└── examples/                 # Usage examples
```

## Future Applications

This service is designed to be easily integrated into future applications:

1. **REST API Server**: Wrap these services in Express/Fastify routes
2. **CLI Tools**: Use in command-line applications for DocuSign automation
3. **Microservices**: Deploy as individual microservices
4. **Desktop Applications**: Integrate with Electron applications
5. **Serverless Functions**: Use in AWS Lambda, Vercel, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT