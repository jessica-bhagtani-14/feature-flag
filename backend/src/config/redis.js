const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return new Error('Too many retry attempts');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('connect', () => {
  logger.info('Connected to Redis server');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

module.exports = client;