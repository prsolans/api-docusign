import { createDocuSignServices } from '../src/index';

async function testNavigatorCalls() {
  console.log('🧭 Enhanced Navigator API Testing');
  console.log('==================================\n');

  const { auth, navigator } = createDocuSignServices();

  if (!auth.isAuthenticated()) {
    console.log('❌ Not authenticated. Run npm run test:interactive first to get tokens.');
    return;
  }

  console.log('✅ Authentication detected');
  console.log(`Account ID: ${navigator.getAccountId()}`);
  console.log(`Navigator Base URL: ${auth.getConfig().navigatorBaseUrl}\n`);

  // Test 1: Enhanced getAgreementList with complex filtering
  console.log('📋 Test 1: Enhanced getAgreementList() with filtering');
  console.log('===================================================');

  try {
    console.log('\n1.1 Basic agreement list:');
    const basic = await navigator.getAgreementList({ limit: 5 });
    const basicList = basic.userAgreementList || basic.data || [];
    console.log(`   ✅ Found ${basicList.length} agreements`);

    if (basicList.length > 0) {
      console.log('   📄 Sample agreements:');
      basicList.forEach((agreement, i) => {
        const name = agreement.name || 'Unnamed';
        console.log(`      ${i + 1}. "${name}" (${agreement.status}) - ID: ${agreement.agreementId}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
  }

  try {
    console.log('\n1.2 Filter by multiple statuses:');
    const filtered = await navigator.getAgreementList({
      limit: 5,
      status: ['COMPLETE', 'SIGNED', 'PENDING']
    });
    const filteredList = filtered.userAgreementList || filtered.data || [];
    console.log(`   ✅ Found ${filteredList.length} agreements with specified statuses`);
  } catch (error) {
    console.log(`   ❌ Status filter error: ${(error as Error).message}`);
  }

  try {
    console.log('\n1.3 Sort by creation date (ascending):');
    const sorted = await navigator.getAgreementList({
      limit: 3,
      sort: 'metadata.created_at',
      direction: 'asc'
    });
    const sortedList = sorted.userAgreementList || sorted.data || [];
    console.log(`   ✅ Found ${sortedList.length} agreements (oldest first)`);
  } catch (error) {
    console.log(`   ❌ Sort error: ${(error as Error).message}`);
  }

  // Test 2: getAgreement (updated method name)
  console.log('\n📄 Test 2: getAgreement() - Single Agreement Details');
  console.log('==================================================');

  try {
    const agreements = await navigator.getAgreementList({ limit: 1 });
    const list = agreements.userAgreementList || agreements.data || [];

    if (list.length > 0) {
      const testAgreementId = list[0].agreementId;
      console.log(`\n2.1 Getting detailed agreement: ${testAgreementId}`);

      const agreement = await navigator.getAgreement(testAgreementId);
      console.log(`   ✅ Retrieved: "${agreement.name}"`);
      console.log(`   Status: ${agreement.status}`);
      console.log(`   Created: ${new Date(agreement.createdDate).toLocaleDateString()}`);
      console.log(`   Participants: ${agreement.participantSetsInfo?.length || 0}`);
    } else {
      console.log('   ⚠️  No agreements found for detailed testing');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
  }

  // Test 3: Date-based filtering
  console.log('\n📅 Test 3: Date-based Filtering');
  console.log('================================');

  try {
    console.log('\n3.1 Agreements created in the last 30 days:');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDate = thirtyDaysAgo.toISOString().split('T')[0];

    const recent = await navigator.getAgreementsByCreatedDate(recentDate, undefined, { limit: 5 });
    const recentList = recent.userAgreementList || recent.data || [];
    console.log(`   ✅ Found ${recentList.length} agreements created since ${recentDate}`);
  } catch (error) {
    console.log(`   ❌ Recent agreements error: ${(error as Error).message}`);
  }

  try {
    console.log('\n3.2 Agreements expiring in the next 6 months:');
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const futureDate = sixMonthsLater.toISOString().split('T')[0];

    const expiring = await navigator.getExpiringAgreements(today, futureDate, { limit: 5 });
    const expiringList = expiring.userAgreementList || expiring.data || [];
    console.log(`   ✅ Found ${expiringList.length} agreements expiring between ${today} and ${futureDate}`);
  } catch (error) {
    console.log(`   ❌ Expiring agreements error: ${(error as Error).message}`);
  }

  // Test 4: Value-based filtering
  console.log('\n💰 Test 4: Value-based Filtering');
  console.log('=================================');

  try {
    console.log('\n4.1 High-value agreements (>= $50,000):');
    const highValue = await navigator.getHighValueAgreements(50000, { limit: 3 });
    const highValueList = highValue.userAgreementList || highValue.data || [];
    console.log(`   ✅ Found ${highValueList.length} high-value agreements`);
  } catch (error) {
    console.log(`   ❌ High-value filter error: ${(error as Error).message}`);
  }

  try {
    console.log('\n4.2 Custom provision search (annual value >= $10,000):');
    const provisions = await navigator.searchByProvisions({
      annualValue: { operator: 'gte', value: 10000 }
    }, { limit: 3 });
    const provisionsList = provisions.userAgreementList || provisions.data || [];
    console.log(`   ✅ Found ${provisionsList.length} agreements with annual value >= $10,000`);
  } catch (error) {
    console.log(`   ❌ Provision search error: ${(error as Error).message}`);
  }

  // Test 5: Governing Law filtering
  console.log('\n⚖️  Test 5: Governing Law Filtering');
  console.log('===================================');

  try {
    console.log('\n5.1 Agreements governed by California law:');
    const california = await navigator.getAgreementsByGoverningLaw('California', { limit: 3 });
    const californiaList = california.userAgreementList || california.data || [];
    console.log(`   ✅ Found ${californiaList.length} California-governed agreements`);
  } catch (error) {
    console.log(`   ❌ Governing law filter error: ${(error as Error).message}`);
  }

  // Test 6: AI Summary (if available)
  console.log('\n🤖 Test 6: AI Agreement Summary');
  console.log('================================');

  try {
    const agreements = await navigator.getAgreementList({ limit: 1 });
    const list = agreements.userAgreementList || agreements.data || [];

    if (list.length > 0) {
      const testAgreementId = list[0].agreementId;
      console.log(`\n6.1 Creating AI summary for agreement: ${testAgreementId}`);

      const summary = await navigator.createAgreementSummary(testAgreementId);
      console.log(`   ✅ AI Summary created successfully`);
      console.log(`   Summary data available: ${!!summary}`);
      // Note: Don't log full summary as it might be lengthy
    } else {
      console.log('   ⚠️  No agreements found for AI summary testing');
    }
  } catch (error) {
    console.log(`   ❌ AI Summary error: ${(error as Error).message}`);
    console.log('   💡 AI Summary may require specific account permissions');
  }

  // Test 7: Batch operations
  console.log('\n📦 Test 7: Batch Operations');
  console.log('============================');

  try {
    console.log('\n7.1 Get multiple agreement details:');
    const agreements = await navigator.getAgreementList({ limit: 3 });
    const list = agreements.userAgreementList || agreements.data || [];

    if (list.length > 0) {
      const agreementIds = list.map(a => a.agreementId).slice(0, 2); // Test with first 2
      const batchResult = await navigator.getMultipleAgreementDetails(agreementIds, {
        includeFailures: true,
        batchSize: 2
      });

      console.log(`   ✅ Batch retrieval completed`);
      console.log(`   Successful: ${batchResult.successful.length}`);
      console.log(`   Failed: ${batchResult.failed.length}`);

      if (batchResult.failed.length > 0) {
        console.log('   Failed IDs:', batchResult.failed.map(f => f.id));
      }
    } else {
      console.log('   ⚠️  No agreements found for batch testing');
    }
  } catch (error) {
    console.log(`   ❌ Batch operation error: ${(error as Error).message}`);
  }

  // Test 8: Pagination test
  console.log('\n📄 Test 8: Pagination');
  console.log('======================');

  try {
    console.log('\n8.1 Test pagination with small page size:');
    const page1 = await navigator.getAgreementList({ limit: 2 });
    const page1List = page1.userAgreementList || page1.data || [];
    console.log(`   ✅ Page 1: Found ${page1List.length} agreements`);

    if (page1.page?.nextCursor || page1.ctoken) {
      const nextToken = page1.page?.nextCursor || page1.ctoken;
      console.log(`   Next page token available: ${nextToken?.substring(0, 20)}...`);

      const page2 = await navigator.getAgreementList({
        limit: 2,
        ctoken: nextToken
      });
      const page2List = page2.userAgreementList || page2.data || [];
      console.log(`   ✅ Page 2: Found ${page2List.length} agreements`);
    } else {
      console.log('   ℹ️  No additional pages available');
    }
  } catch (error) {
    console.log(`   ❌ Pagination error: ${(error as Error).message}`);
  }

  console.log('\n🎉 Enhanced Navigator API testing completed!');
  console.log('\n📊 Summary of Enhanced Navigator Methods Tested:');
  console.log('   ✅ getAgreementList() - with enhanced filtering');
  console.log('   ✅ getAgreement() - detailed single agreement');
  console.log('   ✅ getAgreementsByCreatedDate() - date filtering');
  console.log('   ✅ getExpiringAgreements() - expiration filtering');
  console.log('   ✅ getHighValueAgreements() - value filtering');
  console.log('   ✅ searchByProvisions() - complex provision search');
  console.log('   ✅ getAgreementsByGoverningLaw() - legal jurisdiction');
  console.log('   ✅ createAgreementSummary() - AI-powered summaries');
  console.log('   ✅ getMultipleAgreementDetails() - batch operations');
  console.log('   ✅ Enhanced pagination with ctoken');
}

testNavigatorCalls().catch(console.error);