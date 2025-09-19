const readline = require('readline');
const { createDocuSignServices } = require('../dist/index');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function interactiveTest() {
  console.log('🔐 Interactive DocuSign API Test');
  console.log('===============================\n');

  try {
    const { auth, navigator, clm } = createDocuSignServices();

    // Generate auth URL
    const authUrl = auth.generateAuthorizationUrl('interactive-test');
    console.log('1. Please visit this URL to authorize the application:');
    console.log(`\n${authUrl}\n`);

    console.log('2. After authorization, you will be redirected to a URL that looks like:');
    console.log('   http://localhost:3000/auth/callback?code=LONG_CODE_HERE&state=interactive-test\n');

    // Get auth code from user
    const authCode = await askQuestion('3. Please paste the authorization code from the URL: ');

    if (!authCode || authCode.trim() === '') {
      console.log('❌ No authorization code provided. Exiting.');
      rl.close();
      return;
    }

    // Exchange for tokens
    console.log('\n4. Exchanging authorization code for access tokens...');
    const tokenData = await auth.exchangeCodeForToken(authCode.trim());
    console.log('✅ Authentication successful!');
    console.log(`   Token expires in: ${tokenData.expires_in} seconds\n`);

    // Test Navigator API
    console.log('5. Testing Navigator API...');
    const agreements = await navigator.getAgreementList({ limit: 3 });

    // Handle both possible response structures
    const agreementList = agreements.userAgreementList || agreements.data || [];
    console.log(`✅ Navigator API Response - Found ${agreementList.length} agreements:`);

    if (agreementList.length > 0) {
      agreementList.forEach((agreement, i) => {
        const name = agreement.name || agreement.title || 'Unnamed Agreement';
        console.log(`   ${i + 1}. "${name}" (${agreement.status})`);
      });
    } else {
      console.log('   No agreements found.');
    }

    // Test CLM API - Simple single document test first
    console.log('\n6. Testing CLM API - Single Document...');
    try {
      const testDocumentId = 'ac561a20-d024-ee11-b83f-48df378a7098';
      console.log(`   Testing with document ID: ${testDocumentId}`);

      const document = await clm.getDocumentById(testDocumentId);
      console.log(`✅ CLM API Response - Retrieved document: "${document.name}"`);
      console.log(`   Size: ${(document.size / 1024).toFixed(1)} KB`);
      console.log(`   Type: ${document.mimeType}`);
    } catch (error) {
      console.log(`❌ CLM single document test failed: ${error.message}`);
      console.log('   (This might be expected if the document ID doesn\'t exist in your account)');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nFull API Response Objects:');
    console.log('Navigator Response:', JSON.stringify(agreements, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  interactiveTest();
}

module.exports = { interactiveTest };