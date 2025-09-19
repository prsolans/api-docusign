import { createDocuSignServices } from '../src/index';

async function quickApiTest() {
  console.log('🚀 Quick API Test');
  console.log('=================\n');

  const { auth, navigator, clm } = createDocuSignServices();

  // If you already have a valid access token, you can set it manually:
  // Replace 'YOUR_ACCESS_TOKEN' with an actual token
  const existingToken = 'YOUR_ACCESS_TOKEN_HERE';

  if (existingToken === 'YOUR_ACCESS_TOKEN_HERE') {
    console.log('⚠️  To use this script:');
    console.log('1. Get a valid access token from DocuSign');
    console.log('2. Replace YOUR_ACCESS_TOKEN_HERE with the actual token');
    console.log('3. Run this script again\n');

    console.log('💡 Or use the interactive test:');
    console.log('   npm run build && node examples/interactive-test.js');
    return;
  }

  try {
    // Manually set token data (you would get this from real OAuth flow)
    const tokenData = {
      access_token: existingToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'signature agreement_read spring_read',
      obtained_at: Date.now()
    };

    // Set the token directly (bypassing OAuth for testing)
    auth['tokenManager'].setTokenData(tokenData);

    console.log('1. Testing Navigator API - getAgreementList:');
    const agreements = await navigator.getAgreementList({ pageSize: 10 });
    console.log('✅ Navigator API Results:');
    console.log(`   Total agreements: ${agreements.userAgreementList.length}`);
    console.log(`   Page size: ${agreements.page.pageSize}`);

    if (agreements.userAgreementList.length > 0) {
      console.log('\n   Sample agreements:');
      agreements.userAgreementList.slice(0, 3).forEach((agreement, i) => {
        console.log(`   ${i + 1}. "${agreement.name}"`);
        console.log(`      Status: ${agreement.status}`);
        console.log(`      Created: ${new Date(agreement.createdDate).toLocaleDateString()}`);
        console.log(`      Participants: ${agreement.participantSetsInfo.length}`);
      });
    }

    console.log('\n2. Testing CLM API - getDocuments:');
    const documents = await clm.getDocuments({ limit: 10 });
    console.log('✅ CLM API Results:');
    console.log(`   Total documents: ${documents.totalCount}`);
    console.log(`   Retrieved: ${documents.documents.length}`);

    if (documents.documents.length > 0) {
      console.log('\n   Sample documents:');
      documents.documents.slice(0, 3).forEach((doc, i) => {
        console.log(`   ${i + 1}. "${doc.name}"`);
        console.log(`      Type: ${doc.mimeType}`);
        console.log(`      Size: ${(doc.size / 1024).toFixed(2)} KB`);
        console.log(`      Modified: ${new Date(doc.modifiedDate).toLocaleDateString()}`);
      });
    }

    console.log('\n🎉 Both APIs working successfully!');

    // Show full response structure
    console.log('\n📋 Full Response Structures:');
    console.log('Navigator Agreement List Response:');
    console.log(JSON.stringify(agreements, null, 2));
    console.log('\nCLM Documents Response:');
    console.log(JSON.stringify(documents, null, 2));

  } catch (error) {
    console.error('❌ API Error:', (error as Error).message);
    console.log('\n💡 This might be because:');
    console.log('   - The access token is invalid or expired');
    console.log('   - The token doesn\'t have the required scopes');
    console.log('   - The API endpoints have changed');
  }
}

quickApiTest().catch(console.error);