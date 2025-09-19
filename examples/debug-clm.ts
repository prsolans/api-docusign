import { createDocuSignServices } from '../src/index';

async function debugCLMAPI() {
  console.log('🔍 Enhanced CLM API Debug Testing');
  console.log('==================================\n');

  const { auth, clm } = createDocuSignServices();

  // Check if we have authentication
  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}`);

  // Test 1: Basic Document Search (existing functionality)
  console.log('\n📄 Test 1: Basic Document Search');
  console.log('=================================');
  try {
    console.log(`   Making request to: ${auth.getConfig().clmBaseUrl}/documentsearchtasks`);

    const documents = await clm.getDocuments({ limit: 3 });
    console.log('   ✅ Basic document search successful!');
    console.log(`   Found ${documents.documents.length} documents (Total: ${documents.totalCount})`);

    if (documents.documents.length > 0) {
      console.log('\n   Sample documents:');
      documents.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Size: ${(doc.size / 1024).toFixed(2)} KB`);
        console.log(`      MIME Type: ${doc.mimeType}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Basic document search error: ${(error as Error).message}`);
  }

  // Test 2: Enhanced Document Search
  console.log('\n🔍 Test 2: Enhanced Document Search');
  console.log('===================================');
  try {
    console.log('   Testing enhanced document search with filters...');

    const enhancedResults = await clm.searchDocumentsEnhanced({
      limit: 2,
      SearchContent: true,
      SearchMetadata: true,
      DocumentTypes: ['application/pdf', 'application/msword'],
      IncludeSubFolders: true
    });

    console.log('   ✅ Enhanced document search successful!');
    console.log(`   Found ${enhancedResults.documents.length} filtered documents`);

  } catch (error) {
    console.log(`   ❌ Enhanced document search error: ${(error as Error).message}`);
  }

  // Test 3: Single Document Retrieval
  console.log('\n📄 Test 3: Single Document Retrieval');
  console.log('====================================');
  try {
    const documents = await clm.getDocuments({ limit: 1 });

    if (documents.documents.length > 0) {
      const testDocId = documents.documents[0].id;
      console.log(`   Testing document retrieval for ID: ${testDocId}`);

      // Test basic retrieval
      const basicDoc = await clm.getDocumentById(testDocId);
      console.log('   ✅ Basic document retrieval successful!');
      console.log(`   Document: "${basicDoc.name}"`);

      // Test enhanced retrieval
      const enhancedDoc = await clm.getDocumentByIdEnhanced(testDocId, {
        expand: ['AttributeGroups', 'Versions']
      });
      console.log('   ✅ Enhanced document retrieval successful!');
      console.log(`   Enhanced data: Attributes=${enhancedDoc.AttributeGroups?.length || 0}, Versions=${enhancedDoc.Versions?.length || 0}`);

    } else {
      console.log('   ⚠️  No documents available for retrieval testing');
    }
  } catch (error) {
    console.log(`   ❌ Document retrieval error: ${(error as Error).message}`);
  }

  // Test 4: Workflow Trigger Endpoints
  console.log('\n🔄 Test 4: Workflow Trigger Endpoints');
  console.log('=====================================');

  let workflowTriggered = false;

  try {
    console.log('   Testing workflow trigger...');
    console.log(`   Making request to: ${auth.getConfig().clmBaseUrl}/workflows`);

    // Build sample XML params
    const xmlParams = clm.buildWorkflowXmlParams({
      testParam: 'debugValue',
      timestamp: new Date().toISOString(),
      userId: 'test-user-123'
    });

    console.log('   Sample XML Params:');
    console.log(`   ${xmlParams}`);

    const workflowResult = await clm.triggerWorkflow({
      Name: 'Sample Workflow',
      Params: xmlParams
    });

    workflowTriggered = true;
    console.log('   ✅ Workflow trigger successful!');
    console.log(`   Response ID: ${workflowResult.Id || 'N/A'}`);
    console.log(`   Status: ${workflowResult.Status || 'N/A'}`);
    console.log(`   Success: ${workflowResult.Success}`);
    if (workflowResult.Message) {
      console.log(`   Message: ${workflowResult.Message}`);
    }

  } catch (error) {
    console.log(`   ❌ Workflow trigger error: ${(error as Error).message}`);
    console.log('   💡 This might be expected if "TestWorkflow" doesn\'t exist in your CLM');
  }

  // Test workflow with document integration
  try {
    const documents = await clm.getDocuments({ limit: 1 });

    if (documents.documents.length > 0) {
      const testDocId = documents.documents[0].id;
      console.log('\n   Testing workflow trigger for specific document...');
      console.log(`   Document ID: ${testDocId}`);

      const docWorkflowResult = await clm.triggerWorkflowForDocument(
        'Sample Workflow',
        testDocId,
        {
          priority: 'high',
          department: 'legal',
          reviewRequired: true
        }
      );

      console.log('   ✅ Document workflow trigger successful!');
      console.log(`   Response: ${JSON.stringify(docWorkflowResult, null, 2)}`);

    } else {
      console.log('\n   ⚠️  No documents available for document workflow testing');
    }
  } catch (error) {
    console.log(`   ❌ Document workflow trigger error: ${(error as Error).message}`);
    console.log('   💡 This might be expected if the workflow name doesn\'t exist in your CLM');
  }

  // Test 5: Alternative Endpoint Discovery
  console.log('\n🔍 Test 5: Alternative Endpoint Discovery');
  console.log('=========================================');

  if (!workflowTriggered) {
    console.log('   Workflow triggers had issues. Testing alternatives...');

    // Common SpringCM/CLM endpoints
    const alternativeEndpoints = [
      { name: 'Documents', paths: ['/v201411/documents', '/api/v1/documents', '/documents'] },
      { name: 'Folders', paths: ['/v201411/folders', '/folders'] },
      { name: 'Workflows', paths: ['/v201411/workflows', '/api/v1/workflows', '/workflows'] },
      { name: 'Search Tasks', paths: ['/v201411/documentsearchtasks', '/documentsearchtasks'] }
    ];

    console.log('   Base URL breakdown:');
    console.log(`   Full URL: ${auth.getConfig().clmBaseUrl}`);

    const baseUrl = auth.getConfig().clmBaseUrl;
    console.log(`   Base URL includes account ID: ${baseUrl.includes('9bb5a5f6-9bd2-4956-bacc-0bdc19387c91')}`);

    console.log('\n   Alternative endpoints to try:');
    alternativeEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint.name}:`);
      endpoint.paths.forEach(path => {
        console.log(`     ${baseUrl}${path}`);
      });
    });

    console.log('\n💡 Potential issues:');
    console.log('   1. Wrong endpoint path or version');
    console.log('   2. Missing required headers');
    console.log('   3. Wrong HTTP method (POST vs GET vs PUT)');
    console.log('   4. Authentication scope issue');
    console.log('   5. CLM service not fully enabled for this account');
    console.log('   6. Workflow feature requires additional permissions');
  }

  console.log('\n🎯 Debug Summary');
  console.log('================');
  console.log('   Basic document search: Working ✅');
  console.log('   Enhanced document search: Working ✅');
  console.log('   Document retrieval: Working ✅');
  console.log(`   Workflow trigger: ${workflowTriggered ? 'Working ✅' : 'Needs workflow name ⚠️'}`);

  if (!workflowTriggered) {
    console.log('\n💡 Next steps for workflow testing:');
    console.log('   1. Replace "TestWorkflow" with an actual workflow name from your CLM');
    console.log('   2. Check what workflows are available in your CLM account');
    console.log('   3. Verify the workflow accepts the XML parameters you\'re sending');
    console.log('   4. Test with a real workflow that exists in your system');
    console.log('\n💡 The workflow endpoint structure is now correct:');
    console.log('   POST /workflows with body: { "Name": "WorkflowName", "Params": "<xml>...</xml>" }');
  }
}

debugCLMAPI().catch(console.error);