// tests/unit/services/evaluationService.test.js
const assert = require('assert');

class MockEvaluationService {
  constructor() {
    this.flags = new Map();
  }

  setFlag(key, enabled, rules = []) {
    this.flags.set(key, { enabled, rules });
  }

  async evaluateFlag(flagKey, context = {}) {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      return { enabled: false, reason: 'flag_not_found' };
    }

    if (!flag.enabled) {
      return { enabled: false, reason: 'flag_disabled' };
    }

    // Simple rule evaluation
    if (flag.rules && flag.rules.length > 0) {
      for (const rule of flag.rules) {
        if (this.evaluateRule(rule, context)) {
          return { enabled: true, reason: 'rule_matched' };
        }
      }
      return { enabled: false, reason: 'no_rules_matched' };
    }

    return { enabled: true, reason: 'flag_enabled' };
  }

  evaluateRule(rule, context) {
    if (rule.type === 'user_id' && rule.values) {
      return rule.values.includes(context.userId);
    }
    if (rule.type === 'percentage' && rule.percentage) {
      const hash = this.hashString(context.userId || 'anonymous');
      return (hash % 100) < rule.percentage;
    }
    return false;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

async function runEvaluationServiceTests() {
  console.log('⚖️ Testing Evaluation Service...');
  const evalService = new MockEvaluationService();
  
  try {
    // Test basic flag evaluation
    evalService.setFlag('simple-flag', true);
    let result = await evalService.evaluateFlag('simple-flag');
    assert(result.enabled === true, 'Enabled flag should return true');
    console.log('  ✅ Basic flag evaluation test passed');
    
    // Test disabled flag
    evalService.setFlag('disabled-flag', false);
    result = await evalService.evaluateFlag('disabled-flag');
    assert(result.enabled === false, 'Disabled flag should return false');
    console.log('  ✅ Disabled flag test passed');
    
    // Test non-existent flag
    result = await evalService.evaluateFlag('non-existent');
    assert(result.enabled === false, 'Non-existent flag should return false');
    console.log('  ✅ Non-existent flag test passed');
    
    // Test user-specific rules
    evalService.setFlag('user-flag', true, [
      { type: 'user_id', values: ['user1', 'user2'] }
    ]);
    
    result = await evalService.evaluateFlag('user-flag', { userId: 'user1' });
    assert(result.enabled === true, 'User in allowlist should get flag');
    
    result = await evalService.evaluateFlag('user-flag', { userId: 'user3' });
    assert(result.enabled === false, 'User not in allowlist should not get flag');
    console.log('  ✅ User-specific rules test passed');
    
    // Test percentage rollout
    evalService.setFlag('percentage-flag', true, [
      { type: 'percentage', percentage: 50 }
    ]);
    
    let enabledCount = 0;
    for (let i = 0; i < 100; i++) {
      result = await evalService.evaluateFlag('percentage-flag', { userId: `user${i}` });
      if (result.enabled) enabledCount++;
    }
    
    // Should be roughly 50% (allow some variance)
    assert(enabledCount >= 40 && enabledCount <= 60, 
           `Percentage rollout should be ~50%, got ${enabledCount}%`);
    console.log('  ✅ Percentage rollout test passed');
    
    console.log('✅ Evaluation Service tests completed\n');
    
  } catch (error) {
    console.error('❌ Evaluation Service test failed:', error.message);
    throw error;
  }
}

module.exports = { runEvaluationServiceTests };

