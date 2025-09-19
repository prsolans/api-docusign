import { createDocuSignServices } from '../src/index';

async function testSingleDocument() {
  console.log('🔍 Test Single CLM Document Retrieval');
  console.log('====================================\n');

  const { auth, clm } = createDocuSignServices();

  // Check if we have authentication
  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}`);

  // Test with the document ID from your example
  const testDocumentId = 'ac561a20-d024-ee11-b83f-48df378a7098';

  console.log('\n1. Testing single document retrieval:');
  console.log(`   Document ID: ${testDocumentId}`);

  try {
    const document = await clm.getDocumentById(testDocumentId);

    console.log('✅ Document retrieved successfully!');
    console.log(`   Name: ${document.name}`);
    console.log(`   ID: ${document.id}`);
    console.log(`   Size: ${(document.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${document.mimeType}`);
    console.log(`   Modified: ${new Date(document.modifiedDate).toLocaleDateString()}`);
    console.log(`   Version: ${document.version}`);
    console.log(`   Path: ${document.path}`);

    console.log('\n📋 Full Document Object:');
    console.log(JSON.stringify(document, null, 2));

    console.log('\n🎉 CLM API single document test successful!');

  } catch (error) {
    console.log(`❌ Error retrieving document: ${(error as Error).message}`);

    console.log('\n💡 This could mean:');
    console.log('   1. Document ID does not exist');
    console.log('   2. No access permissions to this document');
    console.log('   3. CLM service not properly configured');
    console.log('   4. Authentication token missing CLM scopes');
    console.log('\n💡 Try with a different document ID or check CLM access permissions.');
  }
}

testSingleDocument().catch(console.error);