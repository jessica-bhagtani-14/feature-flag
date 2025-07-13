const { runFlagServiceTests } = require('./tests/units/services/flagService.test');
const { runEvaluationServiceTests } = require('./tests/units/services/evaluationService.test');
const { runCacheServiceTests } = require('./tests/units/services/cacheService.test');
const { runIntegrationTests } = require('./tests/integration/api.test');

console.log('🚀 Starting Feature Flag Service Tests\n');

async function runAllTests() {
  try {
    console.log('📝 Running Unit Tests...\n');
    
    await runFlagServiceTests();
    await runEvaluationServiceTests();
    await runCacheServiceTests();
    
    console.log('\n🔗 Running Integration Tests...\n');
    await runIntegrationTests();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };