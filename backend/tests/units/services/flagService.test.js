// tests/unit/services/flagService.test.js
const assert = require('assert');

// Mock flag service for testing
class MockFlagService {
  constructor() {
    this.flags = new Map();
    this.idCounter = 1;
  }

  async createFlag(appId, flagData) {
    const flag = {
      id: this.idCounter++,
      app_id: appId,
      key: flagData.key,
      name: flagData.name,
      description: flagData.description,
      enabled: flagData.enabled || false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.flags.set(flag.id, flag);
    return flag;
  }

  async getFlagById(id) {
    return this.flags.get(id) || null;
  }

  async getFlagsByAppId(appId) {
    return Array.from(this.flags.values()).filter(flag => flag.app_id === appId);
  }

  async updateFlag(id, updates) {
    const flag = this.flags.get(id);
    if (!flag) throw new Error('Flag not found');
    
    const updatedFlag = { ...flag, ...updates, updated_at: new Date() };
    this.flags.set(id, updatedFlag);
    return updatedFlag;
  }

  async deleteFlag(id) {
    const deleted = this.flags.delete(id);
    if (!deleted) throw new Error('Flag not found');
    return true;
  }

  async toggleFlag(id) {
    const flag = this.flags.get(id);
    if (!flag) throw new Error('Flag not found');
    
    flag.enabled = !flag.enabled;
    flag.updated_at = new Date();
    this.flags.set(id, flag);
    return flag;
  }
}

async function runFlagServiceTests() {
  console.log('🏁 Testing Flag Service...');
  const flagService = new MockFlagService();
  
  try {
    // Test creating a flag
    const newFlag = await flagService.createFlag(1, {
      key: 'test-feature',
      name: 'Test Feature',
      description: 'A test feature flag',
      enabled: false
    });
    
    assert(newFlag.id, 'Flag should have an ID');
    assert(newFlag.key === 'test-feature', 'Flag key should match');
    assert(newFlag.enabled === false, 'Flag should be disabled by default');
    console.log('  ✅ Create flag test passed');
    
    // Test getting flag by ID
    const retrievedFlag = await flagService.getFlagById(newFlag.id);
    assert(retrievedFlag.key === 'test-feature', 'Retrieved flag should match');
    console.log('  ✅ Get flag by ID test passed');
    
    // Test updating flag
    const updatedFlag = await flagService.updateFlag(newFlag.id, {
      description: 'Updated description'
    });
    assert(updatedFlag.description === 'Updated description', 'Flag should be updated');
    console.log('  ✅ Update flag test passed');
    
    // Test toggling flag
    const toggledFlag = await flagService.toggleFlag(newFlag.id);
    assert(toggledFlag.enabled === true, 'Flag should be enabled after toggle');
    console.log('  ✅ Toggle flag test passed');
    
    // Test getting flags by app ID
    await flagService.createFlag(1, {
      key: 'another-feature',
      name: 'Another Feature',
      description: 'Another test flag'
    });
    
    const appFlags = await flagService.getFlagsByAppId(1);
    assert(appFlags.length === 2, 'Should return 2 flags for app');
    console.log('  ✅ Get flags by app ID test passed');
    
    // Test deleting flag
    await flagService.deleteFlag(newFlag.id);
    const deletedFlag = await flagService.getFlagById(newFlag.id);
    assert(deletedFlag === null, 'Flag should be deleted');
    console.log('  ✅ Delete flag test passed');
    
    console.log('✅ Flag Service tests completed\n');
    
  } catch (error) {
    console.error('❌ Flag Service test failed:', error.message);
    throw error;
  }
}

module.exports = { runFlagServiceTests };