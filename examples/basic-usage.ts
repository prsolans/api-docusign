import { createDocuSignServices } from '../src/index';

async function demonstrateUsage() {
  try {
    // Create all services with unified authentication
    const { auth, navigator, clm } = createDocuSignServices();

    console.log('🔐 DocuSign Unified API Service Demo');
    console.log('=====================================\n');

    // Check authentication status
    console.log('1. Authentication Status:');
    console.log(`   Authenticated: ${auth.isAuthenticated()}`);

    if (!auth.isAuthenticated()) {
      console.log('\n⚠️  Not authenticated. To authenticate:');
      console.log('   1. Generate authorization URL:');

      const authUrl = auth.generateAuthorizationUrl('your-state-value');
      console.log(`      ${authUrl}`);

      console.log('\n   2. Visit the URL, authorize, and get the authorization code');
      console.log('   3. Exchange the code for tokens:');
      console.log('      await auth.exchangeCodeForToken(authorizationCode);');
      console.log('\n   For this demo, we\'ll simulate the authentication...\n');
      return;
    }

    // Demonstrate Navigator API
    console.log('2. Navigator API - Getting Agreement List:');
    console.log('   ----------------------------------------');

    try {
      const agreements = await navigator.getAgreementList({
        pageSize: 5,
        status: ['SIGNED', 'COMPLETED']
      });

      console.log(`   ✅ Found ${agreements.userAgreementList.length} agreements`);

      agreements.userAgreementList.forEach((agreement, index) => {
        console.log(`   ${index + 1}. ${agreement.name} (${agreement.status})`);
        console.log(`      ID: ${agreement.agreementId}`);
        console.log(`      Created: ${new Date(agreement.createdDate).toLocaleDateString()}`);
      });

      if (agreements.page.nextCursor) {
        console.log(`   📄 More pages available (cursor: ${agreements.page.nextCursor})`);
      }

    } catch (error) {
      console.log(`   ❌ Navigator API Error: ${error.message}`);
    }

    console.log('\n3. CLM API - Getting Documents:');
    console.log('   -----------------------------');

    try {
      const documents = await clm.getDocuments({
        limit: 5,
        sortBy: 'modifiedDate',
        sortOrder: 'desc'
      });

      console.log(`   ✅ Found ${documents.documents.length} documents (Total: ${documents.totalCount})`);

      documents.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Size: ${(doc.size / 1024).toFixed(2)} KB`);
        console.log(`      Modified: ${new Date(doc.modifiedDate).toLocaleDateString()}`);
      });

    } catch (error) {
      console.log(`   ❌ CLM API Error: ${error.message}`);
    }

    console.log('\n4. Advanced Usage Examples:');
    console.log('   -------------------------');

    // Search agreements
    try {
      console.log('   🔍 Searching agreements with query "contract"...');
      const searchResults = await navigator.searchAgreements('contract', { pageSize: 3 });
      console.log(`   Found ${searchResults.userAgreementList.length} matching agreements`);
    } catch (error) {
      console.log(`   ❌ Search Error: ${error.message}`);
    }

    // Get folders from CLM
    try {
      console.log('   📁 Getting CLM folders...');
      const folders = await clm.getFolders();
      console.log(`   Found ${folders.length} folders`);

      if (folders.length > 0) {
        console.log(`   First folder: ${folders[0].name} (${folders[0].id})`);
      }
    } catch (error) {
      console.log(`   ❌ Folders Error: ${error.message}`);
    }

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);

    if (error.message.includes('Missing required environment variables')) {
      console.log('\n💡 Setup Instructions:');
      console.log('   1. Copy .env.example to .env');
      console.log('   2. Fill in your DocuSign application credentials');
      console.log('   3. Run: npm run dev');
    }
  }
}

// Advanced example: Getting all data with pagination
async function getAllData() {
  const { navigator, clm } = createDocuSignServices();

  console.log('\n🔄 Advanced Example: Getting All Data');
  console.log('=====================================');

  try {
    // Get all agreements (handles pagination automatically)
    console.log('Getting all agreements...');
    const allAgreements = await navigator.getAllAgreements();
    console.log(`Total agreements: ${allAgreements.length}`);

    // Get all documents (handles pagination automatically)
    console.log('Getting all documents...');
    const allDocuments = await clm.getAllDocuments({ limit: 50 });
    console.log(`Total documents: ${allDocuments.length}`);

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Example: Error handling and token refresh
async function tokenManagementExample() {
  const { auth } = createDocuSignServices();

  console.log('\n🔑 Token Management Example');
  console.log('============================');

  try {
    // Check token status
    const tokenData = auth.getTokenData();
    if (tokenData) {
      console.log('Current token info:');
      console.log(`  Access token expires in: ${tokenData.expires_in} seconds`);
      console.log(`  Scopes: ${tokenData.scope}`);
      console.log(`  Has refresh token: ${!!tokenData.refresh_token}`);
    }

    // Get a valid access token (will refresh if needed)
    const accessToken = await auth.getValidAccessToken();
    console.log('✅ Valid access token obtained');

  } catch (error) {
    console.log(`❌ Token Error: ${error.message}`);
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  demonstrateUsage()
    .then(() => getAllData())
    .then(() => tokenManagementExample())
    .catch(console.error);
}