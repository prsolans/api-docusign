import { createDocuSignServices } from '../src/index';

async function testAuthenticationFlow() {
  console.log('🔐 Testing DocuSign Authentication Flow');
  console.log('=====================================\n');

  try {
    // Create services using environment configuration
    const { auth, navigator, clm } = createDocuSignServices();

    console.log('1. Configuration Status:');
    console.log(`   Client ID: ${auth.getConfig().clientId}`);
    console.log(`   Environment: ${auth.getConfig().environment}`);
    console.log(`   Account ID: ${auth.getConfig().accountId}`);
    console.log(`   Navigator URL: ${auth.getConfig().navigatorBaseUrl}`);
    console.log(`   CLM URL: ${auth.getConfig().clmBaseUrl}\n`);

    console.log('2. Authentication Status:');
    console.log(`   Authenticated: ${auth.isAuthenticated()}\n`);

    if (!auth.isAuthenticated()) {
      console.log('3. Authorization URL Generation:');
      const authUrl = auth.generateAuthorizationUrl('test-state-123');
      console.log(`   URL: ${authUrl}\n`);

      console.log('📝 To complete authentication:');
      console.log('   1. Visit the authorization URL above');
      console.log('   2. Complete the OAuth flow');
      console.log('   3. Extract the authorization code from the callback');
      console.log('   4. Use auth.exchangeCodeForToken(code) to get access tokens');
      console.log('   5. Then test API calls\n');

      // Test that services are properly configured for API calls
      console.log('4. Service Configuration Test:');
      console.log(`   Navigator Account ID: ${navigator.getAccountId()}`);
      console.log(`   Services ready for authentication: ✅\n`);

      // Test API calls without authentication (should fail gracefully)
      console.log('5. Testing API Calls (Without Authentication):');

      try {
        await navigator.getAgreementList({ pageSize: 1 });
        console.log('   ❌ Unexpected: Navigator call succeeded without auth');
      } catch (error) {
        console.log(`   ✅ Navigator properly rejected: ${(error as Error).message.substring(0, 80)}...`);
      }

      try {
        await clm.getDocuments({ limit: 1 });
        console.log('   ❌ Unexpected: CLM call succeeded without auth');
      } catch (error) {
        console.log(`   ✅ CLM properly rejected: ${(error as Error).message.substring(0, 80)}...`);
      }

      console.log('\n✅ Authentication flow setup completed successfully!');
      console.log('💡 Run this script again after authentication to test API calls.');
    }

  } catch (error) {
    console.error('❌ Setup Error:', (error as Error).message);
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);