import { createDocuSignServices } from '../src/index';

async function debugCLMAPI() {
  console.log('🔍 Debug CLM API Call');
  console.log('=====================\n');

  const { auth, clm } = createDocuSignServices();

  // Check if we have authentication
  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}`);

  console.log('\n1. Testing CLM API call with debug info:');
  try {
    console.log(`   Making request to: ${auth.getConfig().clmBaseUrl}/documents?limit=3`);

    const documents = await clm.getDocuments({ limit: 3 });
    console.log('   ✅ Success!');
    console.log(`   Found ${documents.documents.length} documents (Total: ${documents.totalCount})`);

    if (documents.documents.length > 0) {
      console.log('\n   Sample documents:');
      documents.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Size: ${(doc.size / 1024).toFixed(2)} KB`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);

    // Let's try alternative CLM endpoints
    console.log('\n2. Trying alternative CLM endpoints:');

    // Common SpringCM/CLM endpoints
    const alternativeEndpoints = [
      '/v201411/documents',
      '/api/v1/documents',
      '/documents',
      '/folders',
      '/v201411/folders'
    ];

    console.log('   Base URL breakdown:');
    console.log(`   Full URL: ${auth.getConfig().clmBaseUrl}`);

    // Check if the base URL structure looks correct
    const baseUrl = auth.getConfig().clmBaseUrl;
    console.log(`   Base URL already includes account ID: ${baseUrl.includes('9bb5a5f6-9bd2-4956-bacc-0bdc19387c91')}`);

    console.log('\n   Alternative endpoints to try:');
    for (const endpoint of alternativeEndpoints) {
      console.log(`   ${baseUrl}${endpoint}`);
    }

    console.log('\n💡 Potential issues:');
    console.log('   1. Wrong endpoint path');
    console.log('   2. Missing required headers');
    console.log('   3. Wrong HTTP method');
    console.log('   4. Authentication scope issue');
    console.log('   5. CLM service not enabled for this account');
  }
}

debugCLMAPI().catch(console.error);