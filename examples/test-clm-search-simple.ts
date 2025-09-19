import { createDocuSignServices } from '../src/index';

async function testSimpleCLMSearch() {
  console.log('🔍 Simple CLM Search Status Debug');
  console.log('=================================\n');

  const { auth, clm } = createDocuSignServices();

  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first to get tokens.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`CLM Base URL: ${auth.getConfig().clmBaseUrl}\n`);

  try {
    console.log('Testing a very simple search with just IncludeSubFolders...');

    const simpleSearch = await clm.searchDocumentsEnhanced({
      limit: 1,
      IncludeSubFolders: true
    });

    console.log(`✅ Simple search completed successfully!`);
    console.log(`Found ${simpleSearch.documents.length} documents (Total: ${simpleSearch.totalCount})`);

    if (simpleSearch.documents.length > 0) {
      const doc = simpleSearch.documents[0];
      console.log(`First document: "${doc.name}" (${doc.id})`);
    }

  } catch (error) {
    console.log(`❌ Simple search failed: ${(error as Error).message}`);
  }
}

testSimpleCLMSearch().catch(console.error);