import { createDocuSignServices } from '../src/index';

async function testCLMEnhancedSearch() {
  console.log('🔍 CLM Enhanced Document Search Testing');
  console.log('=======================================\n');

  const { auth, clm } = createDocuSignServices();

  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first to get tokens.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}\n`);

  // Test 1: Basic Enhanced Search
  console.log('🔍 Test 1: Basic Enhanced Search');
  console.log('=================================');

  try {
    console.log('\n1.1 Basic enhanced search with content search:');

    const basicSearch = await clm.searchDocumentsEnhanced({
      limit: 5,
      SearchContent: true,
      SearchMetadata: true,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Basic enhanced search successful!`);
    console.log(`   Found ${basicSearch.documents.length} documents (Total: ${basicSearch.totalCount})`);

    if (basicSearch.documents.length > 0) {
      console.log('\n   Sample documents:');
      basicSearch.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. "${doc.name}"`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Size: ${doc.size ? (doc.size / 1024).toFixed(2) : 'Unknown'} KB`);
        console.log(`      Type: ${doc.mimeType}`);
        console.log(`      Modified: ${doc.modifiedDate ? new Date(doc.modifiedDate).toLocaleDateString() : 'Unknown'}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Basic enhanced search error: ${(error as Error).message}`);
  }

  // Test 2: Text-Based Search
  console.log('\n🔍 Test 2: Text-Based Search');
  console.log('=============================');

  try {
    console.log('\n2.1 Search with specific words:');

    const textSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      AnyWords: 'contract agreement',
      SearchContent: true,
      CaseSensitive: false,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Text search successful!`);
    console.log(`   Found ${textSearch.documents.length} documents containing "contract" or "agreement"`);

  } catch (error) {
    console.log(`   ❌ Text search error: ${(error as Error).message}`);
  }

  try {
    console.log('\n2.2 Search with phrase exclusion:');

    const exclusionSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      AnyWords: 'document',
      WithoutWords: 'template draft',
      SearchContent: true,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Exclusion search successful!`);
    console.log(`   Found ${exclusionSearch.documents.length} documents with "document" but not "template" or "draft"`);

  } catch (error) {
    console.log(`   ❌ Exclusion search error: ${(error as Error).message}`);
  }

  try {
    console.log('\n2.3 Search with exact phrase:');

    const phraseSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      Phrase: 'service agreement',
      SearchContent: true,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Phrase search successful!`);
    console.log(`   Found ${phraseSearch.documents.length} documents with exact phrase "service agreement"`);

  } catch (error) {
    console.log(`   ❌ Phrase search error: ${(error as Error).message}`);
  }

  // Test 3: Document Type Filtering
  console.log('\n🔍 Test 3: Document Type Filtering');
  console.log('===================================');

  try {
    console.log('\n3.1 Search for PDF documents only:');

    const pdfSearch = await clm.searchDocumentsEnhanced({
      limit: 5,
      DocumentTypes: ['application/pdf'],
      IncludeSubFolders: true
    });

    console.log(`   ✅ PDF search successful!`);
    console.log(`   Found ${pdfSearch.documents.length} PDF documents`);

    if (pdfSearch.documents.length > 0) {
      pdfSearch.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. "${doc.name}" - ${doc.mimeType} (${doc.size ? (doc.size / 1024).toFixed(2) : 'Unknown'} KB)`);
      });
    }

  } catch (error) {
    console.log(`   ❌ PDF search error: ${(error as Error).message}`);
  }

  try {
    console.log('\n3.2 Search for multiple document types:');

    const multiTypeSearch = await clm.searchDocumentsEnhanced({
      limit: 5,
      DocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      IncludeSubFolders: true
    });

    console.log(`   ✅ Multi-type search successful!`);
    console.log(`   Found ${multiTypeSearch.documents.length} documents (PDF/DOC/DOCX)`);

  } catch (error) {
    console.log(`   ❌ Multi-type search error: ${(error as Error).message}`);
  }

  // Test 4: Date Range Filtering
  console.log('\n🔍 Test 4: Date Range Filtering');
  console.log('================================');

  try {
    console.log('\n4.1 Documents created in the last 30 days:');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDate = thirtyDaysAgo.toISOString().split('T')[0];

    const recentSearch = await clm.searchDocumentsEnhanced({
      limit: 5,
      CreatedAfter: recentDate,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Recent documents search successful!`);
    console.log(`   Found ${recentSearch.documents.length} documents created since ${recentDate}`);

  } catch (error) {
    console.log(`   ❌ Recent documents search error: ${(error as Error).message}`);
  }

  try {
    console.log('\n4.2 Documents modified in a specific date range:');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const dateRangeSearch = await clm.searchDocumentsEnhanced({
      limit: 5,
      ModifiedAfter: oneWeekAgo.toISOString().split('T')[0],
      ModifiedBefore: threeDaysAgo.toISOString().split('T')[0],
      IncludeSubFolders: true
    });

    console.log(`   ✅ Date range search successful!`);
    console.log(`   Found ${dateRangeSearch.documents.length} documents modified between ${oneWeekAgo.toISOString().split('T')[0]} and ${threeDaysAgo.toISOString().split('T')[0]}`);

  } catch (error) {
    console.log(`   ❌ Date range search error: ${(error as Error).message}`);
  }

  // Test 5: Size-Based Filtering
  console.log('\n🔍 Test 5: Size-Based Filtering');
  console.log('================================');

  try {
    console.log('\n5.1 Search for large documents (>1MB):');

    const largeDocs = await clm.searchDocumentsEnhanced({
      limit: 5,
      MinSize: 1024 * 1024, // 1MB in bytes
      IncludeSubFolders: true
    });

    console.log(`   ✅ Large documents search successful!`);
    console.log(`   Found ${largeDocs.documents.length} documents larger than 1MB`);

    if (largeDocs.documents.length > 0) {
      largeDocs.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. "${doc.name}" - ${doc.size ? (doc.size / 1024 / 1024).toFixed(2) : 'Unknown'} MB`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Large documents search error: ${(error as Error).message}`);
  }

  try {
    console.log('\n5.2 Search for small to medium documents (10KB - 500KB):');

    const mediumDocs = await clm.searchDocumentsEnhanced({
      limit: 5,
      MinSize: 10 * 1024, // 10KB
      MaxSize: 500 * 1024, // 500KB
      IncludeSubFolders: true
    });

    console.log(`   ✅ Medium documents search successful!`);
    console.log(`   Found ${mediumDocs.documents.length} documents between 10KB and 500KB`);

  } catch (error) {
    console.log(`   ❌ Medium documents search error: ${(error as Error).message}`);
  }

  // Test 6: Combined Advanced Search
  console.log('\n🔍 Test 6: Combined Advanced Search');
  console.log('===================================');

  try {
    console.log('\n6.1 Complex search with multiple criteria:');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const complexSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      AnyWords: 'contract agreement document',
      DocumentTypes: ['application/pdf', 'application/msword'],
      CreatedAfter: sevenDaysAgo.toISOString().split('T')[0],
      MinSize: 1024, // At least 1KB
      SearchContent: true,
      SearchMetadata: true,
      CaseSensitive: false,
      IncludeSubFolders: true
    });

    console.log(`   ✅ Complex search successful!`);
    console.log(`   Found ${complexSearch.documents.length} documents matching complex criteria:`);
    console.log(`   - Contains: "contract", "agreement", or "document"`);
    console.log(`   - Type: PDF or Word documents`);
    console.log(`   - Created: Within last 7 days`);
    console.log(`   - Size: At least 1KB`);
    console.log(`   - Content and metadata search enabled`);

    if (complexSearch.documents.length > 0) {
      console.log('\n   Matching documents:');
      complexSearch.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. "${doc.name}"`);
        console.log(`      Type: ${doc.mimeType}`);
        console.log(`      Size: ${doc.size ? (doc.size / 1024).toFixed(2) : 'Unknown'} KB`);
        console.log(`      Created: ${doc.createdDate ? new Date(doc.createdDate).toLocaleDateString() : 'Unknown'}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Complex search error: ${(error as Error).message}`);
  }

  // Test 7: Attribute-Based Search (if supported)
  console.log('\n🔍 Test 7: Attribute-Based Search');
  console.log('==================================');

  try {
    console.log('\n7.1 Search with attribute filters:');

    const attributeSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      AttributeFilters: [
        {
          AttributeName: 'DocumentType',
          Operator: 'equals',
          Value: 'Contract'
        }
      ],
      IncludeSubFolders: true
    });

    console.log(`   ✅ Attribute search successful!`);
    console.log(`   Found ${attributeSearch.documents.length} documents with DocumentType = "Contract"`);

  } catch (error) {
    console.log(`   ❌ Attribute search error: ${(error as Error).message}`);
    console.log(`   💡 This may be normal if your CLM doesn't have "DocumentType" attributes`);
  }

  try {
    console.log('\n7.2 Search for documents with specific attributes:');

    const hasAttributesSearch = await clm.searchDocumentsEnhanced({
      limit: 3,
      HasAttributes: ['Status', 'Priority'],
      IncludeSubFolders: true
    });

    console.log(`   ✅ Has attributes search successful!`);
    console.log(`   Found ${hasAttributesSearch.documents.length} documents with "Status" and "Priority" attributes`);

  } catch (error) {
    console.log(`   ❌ Has attributes search error: ${(error as Error).message}`);
    console.log(`   💡 This may be normal if your CLM doesn't have these specific attributes`);
  }

  console.log('\n🎉 CLM Enhanced Document Search Testing Complete!');
  console.log('\n📊 Summary of Enhanced Search Features Tested:');
  console.log('   ✅ Basic enhanced search with content/metadata options');
  console.log('   ✅ Text-based search (AnyWords, WithoutWords, Phrase)');
  console.log('   ✅ Document type filtering (MIME types)');
  console.log('   ✅ Date range filtering (created/modified dates)');
  console.log('   ✅ Size-based filtering (MinSize/MaxSize)');
  console.log('   ✅ Complex multi-criteria search');
  console.log('   ✅ Attribute-based search (if attributes exist)');

  console.log('\n💡 All search methods use the enhanced CLM document search API:');
  console.log('   POST /documentsearchtasks with advanced filter parameters');
  console.log('   Async task polling for results');
  console.log('   Comprehensive filtering capabilities');
}

testCLMEnhancedSearch().catch(console.error);