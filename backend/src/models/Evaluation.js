const db = require('../config/database');

class Evaluation {
  // Record a new evaluation
  static async create(data) {
    const result = await db.query(
      'INSERT INTO flag_evaluations (flag_id, app_id, user_context, result, evaluation_time_ms) VALUES ($1, $2, $3, $4, $5) RETURNING id, flag_id, app_id, user_context, result, evaluation_time_ms, timestamp',
      [data.flag_id, data.app_id, JSON.stringify(data.user_context), data.result, data.evaluation_time_ms || null]
    );
    return result.rows[0];
  }

  // 1. Dashboard Overview - High-level metrics for user's dashboard
  static async getDashboardOverview(userId, timeRange = '30d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    const result = await db.query(
      `SELECT 
        COUNT(DISTINCT a.id) as total_apps,
        COUNT(DISTINCT f.id) as total_flags,
        COUNT(fe.id) as total_evaluations,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        COUNT(CASE WHEN fe.timestamp >= CURRENT_DATE THEN 1 END) as evaluations_today
      FROM applications a
      LEFT JOIN flags f ON a.id = f.app_id
      LEFT JOIN flag_evaluations fe ON f.id = fe.flag_id 
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      WHERE a.user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    
    // Get most active app
    const mostActiveApp = await db.query(
      `SELECT a.name, COUNT(fe.id) as evaluation_count
      FROM applications a
      LEFT JOIN flag_evaluations fe ON a.id = fe.app_id
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      WHERE a.user_id = $1
      GROUP BY a.id, a.name
      ORDER BY evaluation_count DESC
      LIMIT 1`,
      [userId]
    );

    // Get slowest flag
    const slowestFlag = await db.query(
      `SELECT f.name, AVG(fe.evaluation_time_ms) as avg_time
      FROM flags f
      JOIN applications a ON f.app_id = a.id
      LEFT JOIN flag_evaluations fe ON f.id = fe.flag_id
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
        AND fe.evaluation_time_ms IS NOT NULL
      WHERE a.user_id = $1
      GROUP BY f.id, f.name
      HAVING COUNT(fe.id) > 0
      ORDER BY avg_time DESC
      LIMIT 1`,
      [userId]
    );

    return {
      total_apps: parseInt(stats.total_apps) || 0,
      total_flags: parseInt(stats.total_flags) || 0,
      total_evaluations: parseInt(stats.total_evaluations) || 0,
      avg_response_time: parseFloat(stats.avg_response_time) || 0,
      evaluations_today: parseInt(stats.evaluations_today) || 0,
      most_active_app: mostActiveApp.rows[0]?.name || null,
      slowest_flag: slowestFlag.rows[0]?.name || null
    };
  }

  // 2. App-Level Analytics - Performance metrics for each application
  static async getAppLevelAnalytics(userId, timeRange = '30d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    const result = await db.query(
      `SELECT 
        a.id as app_id,
        a.name as app_name,
        COUNT(fe.id) as total_evaluations,
        COUNT(DISTINCT f.id) as total_flags,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        MAX(fe.timestamp) as last_evaluation
      FROM applications a
      LEFT JOIN flags f ON a.id = f.app_id
      LEFT JOIN flag_evaluations fe ON f.id = fe.flag_id 
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      WHERE a.user_id = $1
      GROUP BY a.id, a.name
      ORDER BY total_evaluations DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      app_id: row.app_id,
      app_name: row.app_name,
      total_evaluations: parseInt(row.total_evaluations) || 0,
      total_flags: parseInt(row.total_flags) || 0,
      avg_response_time: parseFloat(row.avg_response_time) || 0,
      last_evaluation: row.last_evaluation
    }));
  }

  // 3. Flag Performance by App - Detailed flag metrics for a specific app
  static async getFlagPerformanceByApp(userId, appId, timeRange = '30d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    // First verify user owns the app
    const appCheck = await db.query(
      'SELECT id FROM applications WHERE id = $1 AND user_id = $2',
      [appId, userId]
    );
    
    if (appCheck.rows.length === 0) {
      throw new Error('App not found or access denied');
    }

    const result = await db.query(
      `SELECT 
        f.id as flag_id,
        f.key as flag_key,
        f.name as flag_name,
        f.enabled,
        COUNT(fe.id) as total_evaluations,
        COUNT(CASE WHEN fe.result = true THEN 1 END) as true_results,
        COUNT(CASE WHEN fe.result = false THEN 1 END) as false_results,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        MIN(fe.evaluation_time_ms) as min_response_time,
        MAX(fe.evaluation_time_ms) as max_response_time,
        ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY fe.evaluation_time_ms))::numeric, 2) as p95_response_time
      FROM flags f
      LEFT JOIN flag_evaluations fe ON f.id = fe.flag_id 
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      WHERE f.app_id = $1
      GROUP BY f.id, f.key, f.name, f.enabled
      ORDER BY total_evaluations DESC`,
      [appId]
    );

    return result.rows.map(row => ({
      flag_id: row.flag_id,
      flag_key: row.flag_key,
      flag_name: row.flag_name,
      enabled: row.enabled,
      total_evaluations: parseInt(row.total_evaluations) || 0,
      true_results: parseInt(row.true_results) || 0,
      false_results: parseInt(row.false_results) || 0,
      true_percentage: row.total_evaluations > 0 
        ? Math.round((row.true_results / row.total_evaluations) * 100) 
        : 0,
      avg_response_time: parseFloat(row.avg_response_time) || 0,
      min_response_time: parseFloat(row.min_response_time) || 0,
      max_response_time: parseFloat(row.max_response_time) || 0,
      p95_response_time: parseFloat(row.p95_response_time) || 0
    }));
  }

  // 4. Evaluation Time Series - Trend data for charts
  static async getEvaluationTimeSeries(userId, options = {}) {
    const { appId, flagId, timeRange = '7d', granularity = 'day' } = options;
    const timeCondition = this.getTimeCondition(timeRange);
    const truncFunction = granularity === 'hour' ? 'hour' : 'day';
    
    let whereClause = 'WHERE a.user_id = $1';
    let params = [userId];
    let paramCount = 1;

    if (appId) {
      whereClause += ` AND a.id = $${++paramCount}`;
      params.push(appId);
    }

    if (flagId) {
      whereClause += ` AND f.id = $${++paramCount}`;
      params.push(flagId);
    }

    const result = await db.query(
      `SELECT 
        DATE_TRUNC('${truncFunction}', fe.timestamp) as timestamp,
        COUNT(fe.id) as evaluations,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        COUNT(CASE WHEN fe.result = true THEN 1 END) as true_results,
        COUNT(CASE WHEN fe.result = false THEN 1 END) as false_results
      FROM flag_evaluations fe
      JOIN flags f ON fe.flag_id = f.id
      JOIN applications a ON f.app_id = a.id
      ${whereClause}
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      GROUP BY DATE_TRUNC('${truncFunction}', fe.timestamp)
      ORDER BY timestamp ASC`,
      params
    );

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      evaluations: parseInt(row.evaluations) || 0,
      avg_response_time: parseFloat(row.avg_response_time) || 0,
      true_results: parseInt(row.true_results) || 0,
      false_results: parseInt(row.false_results) || 0
    }));
  }

  // 5. Performance Metrics - Response time analytics
  static async getPerformanceMetrics(userId, appId = null, timeRange = '30d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    let whereClause = 'WHERE a.user_id = $1';
    let params = [userId];

    if (appId) {
      whereClause += ' AND a.id = $2';
      params.push(appId);
    }

    const result = await db.query(
      `SELECT 
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        MIN(fe.evaluation_time_ms) as min_response_time,
        MAX(fe.evaluation_time_ms) as max_response_time,
        ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fe.evaluation_time_ms))::numeric, 2) as p50_response_time,
        ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY fe.evaluation_time_ms))::numeric, 2) as p95_response_time,
        ROUND((PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY fe.evaluation_time_ms))::numeric, 2) as p99_response_time
      FROM flag_evaluations fe
      JOIN flags f ON fe.flag_id = f.id
      JOIN applications a ON f.app_id = a.id
      ${whereClause}
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
        AND fe.evaluation_time_ms IS NOT NULL`,
      params
    );

    // Get slowest flags
    const slowestFlags = await db.query(
      `SELECT 
        f.id as flag_id,
        f.name as flag_name,
        a.name as app_name,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time
      FROM flag_evaluations fe
      JOIN flags f ON fe.flag_id = f.id
      JOIN applications a ON f.app_id = a.id
      ${whereClause}
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
        AND fe.evaluation_time_ms IS NOT NULL
      GROUP BY f.id, f.name, a.name
      HAVING COUNT(fe.id) >= 5
      ORDER BY avg_response_time DESC
      LIMIT 5`,
      params
    );

    // Get fastest flags
    const fastestFlags = await db.query(
      `SELECT 
        f.id as flag_id,
        f.name as flag_name,
        a.name as app_name,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time
      FROM flag_evaluations fe
      JOIN flags f ON fe.flag_id = f.id
      JOIN applications a ON f.app_id = a.id
      ${whereClause}
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
        AND fe.evaluation_time_ms IS NOT NULL
      GROUP BY f.id, f.name, a.name
      HAVING COUNT(fe.id) >= 5
      ORDER BY avg_response_time ASC
      LIMIT 5`,
      params
    );

    const stats = result.rows[0];
    return {
      overall_stats: {
        avg_response_time: parseFloat(stats.avg_response_time) || 0,
        min_response_time: parseFloat(stats.min_response_time) || 0,
        max_response_time: parseFloat(stats.max_response_time) || 0,
        p50_response_time: parseFloat(stats.p50_response_time) || 0,
        p95_response_time: parseFloat(stats.p95_response_time) || 0,
        p99_response_time: parseFloat(stats.p99_response_time) || 0
      },
      slowest_flags: slowestFlags.rows,
      fastest_flags: fastestFlags.rows
    };
  }

  // 6. Flag Usage Ranking - Most/least used flags across user's apps
  static async getFlagUsageRanking(userId, options = {}) {
    const { timeRange = '30d', sortBy = 'evaluations', order = 'desc' } = options;
    const timeCondition = this.getTimeCondition(timeRange);
    
    let orderByClause = 'total_evaluations DESC';
    if (sortBy === 'response_time') {
      orderByClause = `avg_response_time ${order.toUpperCase()}`;
    } else if (sortBy === 'true_rate') {
      orderByClause = `true_percentage ${order.toUpperCase()}`;
    } else {
      orderByClause = `total_evaluations ${order.toUpperCase()}`;
    }

    const result = await db.query(
      `SELECT 
        f.id as flag_id,
        f.key as flag_key,
        f.name as flag_name,
        a.name as app_name,
        f.enabled,
        COUNT(fe.id) as total_evaluations,
        ROUND(AVG(fe.evaluation_time_ms)::numeric, 2) as avg_response_time,
        COUNT(CASE WHEN fe.result = true THEN 1 END) as true_results,
        CASE 
          WHEN COUNT(fe.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN fe.result = true THEN 1 END)::float / COUNT(fe.id) * 100)::numeric, 1)
          ELSE 0 
        END as true_percentage
      FROM flags f
      JOIN applications a ON f.app_id = a.id
      LEFT JOIN flag_evaluations fe ON f.id = fe.flag_id 
        AND fe.timestamp >= NOW() - INTERVAL '${timeCondition}'
      WHERE a.user_id = $1
      GROUP BY f.id, f.key, f.name, a.name, f.enabled
      ORDER BY ${orderByClause}`,
      [userId]
    );

    return result.rows.map(row => ({
      flag_id: row.flag_id,
      flag_key: row.flag_key,
      flag_name: row.flag_name,
      app_name: row.app_name,
      enabled: row.enabled,
      total_evaluations: parseInt(row.total_evaluations) || 0,
      avg_response_time: parseFloat(row.avg_response_time) || 0,
      true_percentage: parseFloat(row.true_percentage) || 0
    }));
  }

  // 7. Real-time Activity - Recent evaluations for monitoring
  static async getRecentActivity(userId, options = {}) {
    const { limit = 50, appId } = options;
    
    let whereClause = 'WHERE a.user_id = $1';
    let params = [userId];

    if (appId) {
      whereClause += ' AND a.id = $2';
      params.push(appId);
      params.push(limit);
    } else {
      params.push(limit);
    }

    const result = await db.query(
      `SELECT 
        fe.id as evaluation_id,
        fe.timestamp,
        f.name as flag_name,
        a.name as app_name,
        fe.result,
        fe.evaluation_time_ms as response_time
      FROM flag_evaluations fe
      JOIN flags f ON fe.flag_id = f.id
      JOIN applications a ON f.app_id = a.id
      ${whereClause}
      ORDER BY fe.timestamp DESC
      LIMIT $${params.length}`,
      params
    );

    return result.rows.map(row => ({
      evaluation_id: row.evaluation_id,
      timestamp: row.timestamp,
      flag_name: row.flag_name,
      app_name: row.app_name,
      result: row.result,
      response_time: row.response_time
    }));
  }

  // Helper method to convert time range to SQL interval
  static getTimeCondition(timeRange) {
    const timeMap = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    return timeMap[timeRange] || '30 days';
  }

  // Legacy methods (keeping for backward compatibility)
  static async getFlagStats(flagId, timeRange = '7d') {
    const timeCondition = this.getTimeCondition(timeRange);
    
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_evaluations,
        COUNT(CASE WHEN result = true THEN 1 END) as enabled_count,
        COUNT(CASE WHEN result = false THEN 1 END) as disabled_count,
        ROUND(AVG(evaluation_time_ms)::numeric, 2) as avg_evaluation_time
      FROM flag_evaluations 
      WHERE flag_id = $1 
        AND timestamp >= NOW() - INTERVAL '${timeCondition}'`,
      [flagId]
    );
    
    const stats = result.rows[0];
    return {
      totalEvaluations: parseInt(stats.total_evaluations) || 0,
      enabledCount: parseInt(stats.enabled_count) || 0,
      disabledCount: parseInt(stats.disabled_count) || 0,
      avgEvaluationTime: parseFloat(stats.avg_evaluation_time) || 0,
      enabledPercentage: stats.total_evaluations > 0 
        ? Math.round((stats.enabled_count / stats.total_evaluations) * 100) 
        : 0
    };
  }

  // Delete old evaluations (for cleanup)
  static async deleteOldEvaluations(daysToKeep = 30) {
    const result = await db.query(
      'DELETE FROM flag_evaluations WHERE timestamp < NOW() - INTERVAL $1 DAY',
      [daysToKeep]
    );
    return result.rowCount;
  }
}

module.exports = Evaluation;