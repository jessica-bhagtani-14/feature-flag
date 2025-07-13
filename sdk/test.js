// Simple test file to verify SDK works with your backend
const FeatureFlagClient = require('./src/FeatureFlagClient');

// Test configuration - UPDATE THESE VALUES
const TEST_CONFIG = {
  apiKey: 'ff_51e4e35f89ebd40d17bc3854ba27e62ad4b2a829dbec2bc2f4b539008b207f88', // Replace with your real API key
  baseUrl: 'http://localhost:3001/api',
  timeout: 5000
};

// Test context - UPDATE THESE VALUES
const TEST_CONTEXT = {
  user_id: 'mohit',
  region: 'India',
  role: 'admin'
};

// Expected flags from your example - UPDATE THESE
const EXPECTED_FLAGS = [
  'new_ui_enabled',
  'premium_features'
];

async function runTests() {
  console.log('🧪 Starting SDK Tests...\n');
  
  // Test 1: Initialize client
  console.log('1️⃣ Testing Client Initialization...');
  let client;
  try {
    client = new FeatureFlagClient(TEST_CONFIG);
    console.log('✅ Client initialized successfully');
  } catch (error) {
    console.error('❌ Client initialization failed:', error.message);
    return;
  }
  
  // Test 2: Health check
  console.log('\n2️⃣ Testing Health Check...');
  try {
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
      console.log('✅ API is reachable');
    } else {
      console.log('⚠️ API health check failed');
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
  
  // Test 3: Fetch all flags
  console.log('\n3️⃣ Testing Flag Fetching...');
  let flags;
  try {
    flags = await client.getAllFlags(TEST_CONTEXT);
    console.log('✅ Flags fetched successfully');
    console.log('📊 Retrieved flags:', Object.keys(flags));
    console.log('🔍 Flag details:', JSON.stringify(flags, null, 2));
  } catch (error) {
    console.error('❌ Flag fetching failed:', error.message);
    return;
  }
  
  // Test 4: Check individual flags
  console.log('\n4️⃣ Testing Individual Flag Checks...');
  EXPECTED_FLAGS.forEach(flagKey => {
    const isEnabled = client.isEnabled(flagKey, flags);
    const flagDetails = client.getFlag(flagKey, flags);
    
    console.log(`🏳️ Flag: ${flagKey}`);
    console.log(`   Enabled: ${isEnabled}`);
    if (flagDetails) {
      console.log(`   Reason: ${flagDetails.reason}`);
      console.log(`   Rule Type: ${flagDetails.ruleType}`);
    }
  });
  
  // Test 5: Check non-existent flag
  console.log('\n5️⃣ Testing Non-existent Flag...');
  const nonExistentFlag = client.isEnabled('non_existent_flag', flags);
  console.log(`🚫 Non-existent flag result: ${nonExistentFlag} (should be false)`);
  
  // Test 6: Get enabled flags
  console.log('\n6️⃣ Testing Get Enabled Flags...');
  const enabledFlags = client.getEnabledFlags(flags);
  console.log('✅ Enabled flags:', enabledFlags);
  
  // Test 7: Check multiple flags
  console.log('\n7️⃣ Testing Multiple Flag Check...');
  const multipleResults = client.checkMultiple(EXPECTED_FLAGS, flags);
  console.log('📋 Multiple flag results:', multipleResults);
  
  // Test 8: Error handling - invalid context
  console.log('\n8️⃣ Testing Error Handling...');
  try {
    const emptyFlags = await client.getAllFlags(null);
    console.log('✅ Error handling works - empty flags:', Object.keys(emptyFlags).length === 0);
  } catch (error) {
    console.log('✅ Error handling works - caught error:', error.message);
  }
  
  // Test 9: Edge cases
  console.log('\n9️⃣ Testing Edge Cases...');
  
  // Test with empty flag key
  const emptyKeyResult = client.isEnabled('', flags);
  console.log(`🔍 Empty flag key result: ${emptyKeyResult} (should be false)`);
  
  // Test with null flags
  const nullFlagsResult = client.isEnabled('test', null);
  console.log(`🔍 Null flags result: ${nullFlagsResult} (should be false)`);
  
  console.log('\n🎉 All tests completed!');
}

// Test with different contexts
async function testDifferentContexts() {
  console.log('\n🌍 Testing Different User Contexts...\n');
  
  const client = new FeatureFlagClient(TEST_CONFIG);
  
  const testContexts = [
    { user_id: 'user1', region: 'US', role: 'user' },
    { user_id: 'user2', region: 'Europe', role: 'admin' },
    { user_id: 'user3', region: 'Asia', role: 'premium' }
  ];
  
  for (const context of testContexts) {
    console.log(`👤 Testing context: ${JSON.stringify(context)}`);
    try {
      const flags = await client.getAllFlags(context);
      const enabledFlags = client.getEnabledFlags(flags);
      console.log(`   Enabled flags: ${enabledFlags.join(', ')}`);
    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run all tests
async function main() {
  console.log('🚀 Feature Flag SDK Test Suite\n');
  console.log('Make sure your backend is running on http://localhost:3001');
  console.log('Update TEST_CONFIG with your actual API key\n');
  
  await runTests();
  await testDifferentContexts();
  
  console.log('\n📝 Test Notes:');
  console.log('- If health check fails, check if backend is running');
  console.log('- If flag fetching fails, verify your API key');
  console.log('- Update EXPECTED_FLAGS with your actual flag keys');
  console.log('- Check backend logs for detailed error information');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the tests
main().catch(console.error);