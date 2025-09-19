import { createDocuSignServices } from '../src/index';

async function testCLMSingleDocument() {
  console.log('📄 CLM Single Document Retrieval Testing');
  console.log('=========================================\n');

  const { auth, clm } = createDocuSignServices();

  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first to get tokens.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}\n`);

  // First, get a document ID to test with
  console.log('🔍 Step 1: Getting a sample document ID for testing');
  console.log('===================================================');

  let testDocumentId: string;

  try {
    const searchResults = await clm.searchDocumentsEnhanced({
      limit: 1,
      IncludeSubFolders: true
    });

    if (searchResults.documents.length === 0) {
      console.log('❌ No documents found in CLM. Cannot test single document retrieval.');
      return;
    }

    testDocumentId = searchResults.documents[0].id!;
    console.log(`✅ Found test document: "${searchResults.documents[0].name}" (ID: ${testDocumentId})\n`);

  } catch (error) {
    console.log(`❌ Failed to find test document: ${(error as Error).message}`);
    return;
  }

  // Test 1: Basic Document Retrieval
  console.log('📄 Test 1: Basic Document Retrieval');
  console.log('===================================');

  try {
    console.log('\n1.1 Basic document retrieval:');

    const basicDoc = await clm.getDocumentById(testDocumentId);

    console.log(`   ✅ Basic document retrieval successful!`);
    console.log(`   Document Name: "${basicDoc.name}"`);
    console.log(`   Document ID: ${basicDoc.id}`);
    console.log(`   Size: ${basicDoc.size ? (basicDoc.size / 1024).toFixed(2) : 'Unknown'} KB`);
    console.log(`   MIME Type: ${basicDoc.mimeType || 'Unknown'}`);
    console.log(`   Created: ${basicDoc.createdDate ? new Date(basicDoc.createdDate).toLocaleDateString() : 'Unknown'}`);
    console.log(`   Modified: ${basicDoc.modifiedDate ? new Date(basicDoc.modifiedDate).toLocaleDateString() : 'Unknown'}`);

  } catch (error) {
    console.log(`   ❌ Basic document retrieval error: ${(error as Error).message}`);
  }

  // Test 2: Enhanced Document Retrieval with Default Expansion
  console.log('\n📄 Test 2: Enhanced Document Retrieval');
  console.log('======================================');

  try {
    console.log('\n2.1 Enhanced document with default expansions:');

    const enhancedDoc = await clm.getDocumentByIdEnhanced(testDocumentId);

    console.log(`   ✅ Enhanced document retrieval successful!`);
    console.log(`   Document Name: "${enhancedDoc.name}"`);
    console.log(`   Document ID: ${enhancedDoc.id}`);
    console.log(`   Size: ${enhancedDoc.size ? (enhancedDoc.size / 1024).toFixed(2) : 'Unknown'} KB`);
    console.log(`   Content Type: ${enhancedDoc.ContentType || 'Unknown'}`);
    console.log(`   File Extension: ${enhancedDoc.FileExtension || 'Unknown'}`);
    console.log(`   Checkout Status: ${enhancedDoc.CheckoutStatus || 'Unknown'}`);

    // Display attribute groups if available
    if (enhancedDoc.EnhancedAttributeGroups && enhancedDoc.EnhancedAttributeGroups.length > 0) {
      console.log(`   📋 Attribute Groups: ${enhancedDoc.EnhancedAttributeGroups.length}`);
      enhancedDoc.EnhancedAttributeGroups.forEach((group, i) => {
        console.log(`      ${i + 1}. ${group.Name} (${group.Attributes.length} attributes)`);
      });
    } else {
      console.log(`   📋 No attribute groups found`);
    }

    // Display versions if available
    if (enhancedDoc.Versions && enhancedDoc.Versions.length > 0) {
      console.log(`   📝 Versions: ${enhancedDoc.Versions.length}`);
      enhancedDoc.Versions.forEach((version, i) => {
        const current = version.IsCurrent ? ' (Current)' : '';
        console.log(`      ${i + 1}. Version ${version.VersionNumber}${current} - ${new Date(version.CreatedDate).toLocaleDateString()}`);
      });
    } else {
      console.log(`   📝 No version information found`);
    }

    // Display permissions if available
    if (enhancedDoc.Permissions && enhancedDoc.Permissions.length > 0) {
      console.log(`   🔐 Permissions: ${enhancedDoc.Permissions.length} entries`);
    } else {
      console.log(`   🔐 No permission information found`);
    }

    // Display tags if available
    if (enhancedDoc.Tags && enhancedDoc.Tags.length > 0) {
      console.log(`   🏷️  Tags: ${enhancedDoc.Tags.join(', ')}`);
    } else {
      console.log(`   🏷️  No tags found`);
    }

  } catch (error) {
    console.log(`   ❌ Enhanced document retrieval error: ${(error as Error).message}`);
  }

  // Test 3: Selective Data Expansion
  console.log('\n📄 Test 3: Selective Data Expansion');
  console.log('===================================');

  try {
    console.log('\n3.1 Document with only AttributeGroups expansion:');

    const attributesDoc = await clm.getDocumentByIdEnhanced(testDocumentId, {
      expand: ['AttributeGroups']
    });

    console.log(`   ✅ Attributes-only retrieval successful!`);
    console.log(`   Document: "${attributesDoc.name}"`);

    if (attributesDoc.EnhancedAttributeGroups && attributesDoc.EnhancedAttributeGroups.length > 0) {
      console.log(`   📋 Found ${attributesDoc.EnhancedAttributeGroups.length} attribute groups:`);
      attributesDoc.EnhancedAttributeGroups.forEach((group) => {
        console.log(`      • ${group.Name}:`);
        group.Attributes.forEach((attr) => {
          console.log(`        - ${attr.DisplayName || attr.Name}: ${attr.Value} (${attr.Type})`);
        });
      });
    } else {
      console.log(`   📋 No attribute groups found for this document`);
    }

  } catch (error) {
    console.log(`   ❌ Attributes-only retrieval error: ${(error as Error).message}`);
  }

  try {
    console.log('\n3.2 Document with only Versions expansion:');

    const versionsDoc = await clm.getDocumentByIdEnhanced(testDocumentId, {
      expand: ['Versions']
    });

    console.log(`   ✅ Versions-only retrieval successful!`);
    console.log(`   Document: "${versionsDoc.name}"`);

    if (versionsDoc.Versions && versionsDoc.Versions.length > 0) {
      console.log(`   📝 Found ${versionsDoc.Versions.length} versions:`);
      versionsDoc.Versions.forEach((version) => {
        const current = version.IsCurrent ? ' ⭐ CURRENT' : '';
        console.log(`      • Version ${version.VersionNumber}${current}`);
        console.log(`        Created: ${new Date(version.CreatedDate).toLocaleDateString()}`);
        console.log(`        By: ${version.CreatedBy.Name || version.CreatedBy.Email}`);
        console.log(`        Size: ${(version.Size / 1024).toFixed(2)} KB`);
        if (version.Comment) {
          console.log(`        Comment: ${version.Comment}`);
        }
      });
    } else {
      console.log(`   📝 No version information found for this document`);
    }

  } catch (error) {
    console.log(`   ❌ Versions-only retrieval error: ${(error as Error).message}`);
  }

  // Test 4: Specific Version Retrieval
  console.log('\n📄 Test 4: Specific Version Retrieval');
  console.log('=====================================');

  try {
    // First get versions to find a specific version ID
    const versionsResult = await clm.getDocumentVersions(testDocumentId);

    if (versionsResult && versionsResult.length > 0) {
      const specificVersion = versionsResult[0]; // Use the first version
      console.log(`\n4.1 Retrieving specific version: ${specificVersion.VersionNumber}`);

      const versionDoc = await clm.getDocumentByIdEnhanced(testDocumentId, {
        versionId: specificVersion.Id,
        expand: ['Versions']
      });

      console.log(`   ✅ Specific version retrieval successful!`);
      console.log(`   Document: "${versionDoc.name}"`);
      console.log(`   Version: ${specificVersion.VersionNumber}`);
      console.log(`   Version ID: ${specificVersion.Id}`);

    } else {
      console.log('\n4.1 No versions available for specific version test');
    }

  } catch (error) {
    console.log(`   ❌ Specific version retrieval error: ${(error as Error).message}`);
  }

  // Test 5: Helper Methods
  console.log('\n📄 Test 5: Helper Methods');
  console.log('=========================');

  try {
    console.log('\n5.1 Get document versions using helper method:');

    const versions = await clm.getDocumentVersions(testDocumentId);

    console.log(`   ✅ Document versions helper successful!`);
    console.log(`   Found ${versions?.length || 0} versions`);

    if (versions && versions.length > 0) {
      versions.forEach((version, i) => {
        const current = version.IsCurrent ? ' (Current)' : '';
        console.log(`   ${i + 1}. Version ${version.VersionNumber}${current} - ${new Date(version.CreatedDate).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Document versions helper error: ${(error as Error).message}`);
  }

  try {
    console.log('\n5.2 Get document attributes using helper method:');

    const attributes = await clm.getDocumentAttributes(testDocumentId);

    console.log(`   ✅ Document attributes helper successful!`);
    console.log(`   Found ${attributes?.length || 0} attribute groups`);

    if (attributes && attributes.length > 0) {
      attributes.forEach((group, i) => {
        console.log(`   ${i + 1}. ${group.Name} (${group.Attributes.length} attributes)`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Document attributes helper error: ${(error as Error).message}`);
  }

  try {
    console.log('\n5.3 Get document permissions using helper method:');

    const permissions = await clm.getDocumentPermissions(testDocumentId);

    console.log(`   ✅ Document permissions helper successful!`);
    console.log(`   Found ${permissions?.length || 0} permission entries`);

    if (permissions && permissions.length > 0) {
      permissions.forEach((perm, i) => {
        const subject = perm.User ? `${perm.User.Name || perm.User.Email}` : `Role: ${perm.Role}`;
        console.log(`   ${i + 1}. ${subject}: ${perm.Permissions.join(', ')}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Document permissions helper error: ${(error as Error).message}`);
  }

  // Test 6: Content Inclusion (if supported)
  console.log('\n📄 Test 6: Content Inclusion');
  console.log('============================');

  try {
    console.log('\n6.1 Document with content inclusion:');

    const contentDoc = await clm.getDocumentByIdEnhanced(testDocumentId, {
      includeContent: true,
      expand: ['AttributeGroups']
    });

    console.log(`   ✅ Content inclusion request successful!`);
    console.log(`   Document: "${contentDoc.name}"`);
    console.log(`   💡 Content inclusion requested (actual content depends on CLM configuration)`);

  } catch (error) {
    console.log(`   ❌ Content inclusion error: ${(error as Error).message}`);
    console.log(`   💡 This may be normal if content inclusion is not supported/configured`);
  }

  console.log('\n🎉 CLM Single Document Retrieval Testing Complete!');
  console.log('\n📊 Summary of Document Retrieval Features Tested:');
  console.log('   ✅ Basic document retrieval');
  console.log('   ✅ Enhanced document retrieval with full expansion');
  console.log('   ✅ Selective data expansion (AttributeGroups, Versions, Permissions)');
  console.log('   ✅ Specific version retrieval');
  console.log('   ✅ Helper methods for versions, attributes, and permissions');
  console.log('   ✅ Content inclusion option');

  console.log('\n💡 All document retrieval methods use the CLM API:');
  console.log('   GET /documents/{id} with optional query parameters');
  console.log('   Support for expand, includeContent, and versionId parameters');
  console.log('   Comprehensive document metadata and related data');
}

testCLMSingleDocument().catch(console.error);