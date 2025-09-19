import { createDocuSignServices } from '../src/index';

async function manualAuthTest() {
  const { auth, navigator, clm } = createDocuSignServices();

  console.log('🔐 Manual Authentication Test');
  console.log('============================\n');

  // Step 1: Generate auth URL
  const authUrl = auth.generateAuthorizationUrl('test-state');
  console.log('1. Visit this URL to authorize:');
  console.log(authUrl);
  console.log('\n2. After authorization, you\'ll be redirected to:');
  console.log('   http://localhost:3000/auth/callback?code=AUTHORIZATION_CODE&state=test-state');
  console.log('\n3. Copy the AUTHORIZATION_CODE and paste it below:');

  // Step 2: You would manually get the auth code and paste it here
  const authCode = 'YOUR_AUTHORIZATION_CODE_HERE'; // Replace this with actual code

  if (authCode === 'YOUR_AUTHORIZATION_CODE_HERE') {
    console.log('\n⚠️  Please replace YOUR_AUTHORIZATION_CODE_HERE with the actual code from the callback URL');
    return;
  }

  try {
    // Step 3: Exchange code for tokens
    console.log('\n4. Exchanging authorization code for tokens...');
    const tokenData = await auth.exchangeCodeForToken(authCode);
    console.log('✅ Authentication successful!');
    console.log(`   Access token expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Scopes: ${tokenData.scope}`);

    // Step 4: Test Navigator API
    console.log('\n5. Testing Navigator API - getAgreementList:');
    const agreements = await navigator.getAgreementList({ pageSize: 5 });
    console.log(`✅ Found ${agreements.userAgreementList.length} agreements`);

    agreements.userAgreementList.forEach((agreement, index) => {
      console.log(`   ${index + 1}. ${agreement.name}`);
      console.log(`      Status: ${agreement.status}`);
      console.log(`      ID: ${agreement.agreementId}`);
      console.log(`      Created: ${new Date(agreement.createdDate).toLocaleDateString()}`);
    });

    // Step 5: Test CLM API
    console.log('\n6. Testing CLM API - getDocuments:');
    const documents = await clm.getDocuments({ limit: 5 });
    console.log(`✅ Found ${documents.documents.length} documents (Total: ${documents.totalCount})`);

    documents.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Size: ${(doc.size / 1024).toFixed(2)} KB`);
      console.log(`      Modified: ${new Date(doc.modifiedDate).toLocaleDateString()}`);
    });

    console.log('\n🎉 All API calls successful!');

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

manualAuthTest().catch(console.error);