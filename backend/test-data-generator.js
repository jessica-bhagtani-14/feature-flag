// test-data-generator.js - Generate test data for manual testing
function generateTestData() {
  return {
    applications: [
      {
        name: 'E-commerce App',
        description: 'Main e-commerce application'
      },
      {
        name: 'Mobile App',
        description: 'iOS and Android mobile application'
      },
      {
        name: 'Admin Dashboard',
        description: 'Internal admin dashboard'
      }
    ],
    flags: [
      {
        key: 'new-checkout-flow',
        name: 'New Checkout Flow',
        description: 'Enable the redesigned checkout process',
        enabled: false
      },
      {
        key: 'dark-mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme',
        enabled: true
      },
      {
        key: 'premium-features',
        name: 'Premium Features',
        description: 'Enable premium user features',
        enabled: false
      },
      {
        key: 'beta-dashboard',
        name: 'Beta Dashboard',
        description: 'New dashboard interface',
        enabled: true
      },
      {
        key: 'push-notifications',
        name: 'Push Notifications',
        description: 'Enable push notification system',
        enabled: false
      }
    ],
    evaluationContexts: [
      { userId: 'user123', email: 'test@example.com', plan: 'premium' },
      { userId: 'user456', email: 'user@example.com', plan: 'basic' },
      { userId: 'user789', email: 'admin@example.com', plan: 'admin' }
    ]
  };
}

// Load test runner
console.log('📋 Test Data Available:');
console.log(JSON.stringify(generateTestData(), null, 2));

module.exports = { generateTestData };