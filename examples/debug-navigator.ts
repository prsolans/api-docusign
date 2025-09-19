import { createDocuSignServices } from '../src/index';

async function debugNavigatorAPI() {
  console.log('🔍 Debug Navigator API Call');
  console.log('===========================\n');

  const { auth, navigator } = createDocuSignServices();

  // Check if we have authentication
  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`Account ID: ${navigator.getAccountId()}`);
  console.log(`Base URL: ${auth.getConfig().navigatorBaseUrl}`);

  // Try to get user info first (this is usually a simpler API call)
  console.log('\n1. Testing simpler API call - user info:');
  try {
    const userInfoUrl = `/restapi/v2.1/accounts/${navigator.getAccountId()}/users`;
    console.log(`   Trying: ${auth.getConfig().navigatorBaseUrl}${userInfoUrl}`);

    // We'll manually make this call to see what happens
    const token = await auth.getValidAccessToken();
    console.log(`   Using token: ${token.substring(0, 20)}...`);

  } catch (error) {
    console.log(`   ❌ Error getting token: ${(error as Error).message}`);
    return;
  }

  // Now try the agreements call with detailed logging
  console.log('\n2. Testing agreements API call:');
  try {
    console.log(`   Making request to: ${auth.getConfig().navigatorBaseUrl}/restapi/v2.1/accounts/${navigator.getAccountId()}/agreements`);

    const agreements = await navigator.getAgreementList({ pageSize: 1 });
    console.log('   ✅ Success!');
    console.log(`   Found ${agreements.userAgreementList?.length || 0} agreements`);

  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);

    // Let's try alternative endpoints that might work
    console.log('\n3. Trying alternative Navigator endpoints:');

    // Common DocuSign Navigator endpoints
    const alternativeEndpoints = [
      '/v6/agreements',
      '/v2/agreements',
      '/restapi/v2/agreements',
      '/agreements'
    ];

    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`   Trying: ${endpoint}`);
        // We'd need to manually test these, but let's at least show what we'd try
        console.log(`   Full URL would be: ${auth.getConfig().navigatorBaseUrl}${endpoint}`);
      } catch (altError) {
        console.log(`   ❌ ${endpoint} failed: ${(altError as Error).message}`);
      }
    }
  }
}

debugNavigatorAPI().catch(console.error);