const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class Application {
  static async findAll() {
    console.log("Inside find all");
    const result = await db.query(
      'SELECT id, name, api_key, description, created_at, updated_at FROM applications ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT id, name, api_key, description, created_at, updated_at FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, api_key, description, created_at, updated_at FROM applications WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByApiKey(apiKey) {
    const result = await db.query(
      'SELECT id, name, api_key, description, created_at, updated_at FROM applications WHERE api_key = $1',
      [apiKey]
    );
    return result.rows[0];
  }

  static async create(data) {
    console.log(data.userId);
    const apiKey = this.generateApiKey();
    const result = await db.query(
      'INSERT INTO applications (name, api_key, description, user_id) VALUES ($1, $2, $3, $4) RETURNING id, name, api_key, description, created_at, updated_at',
      [data.name, apiKey, data.description || null, data.userId]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE applications SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, api_key, description, created_at, updated_at',
      [data.name, data.description || null, id]
    );
    return result.rows[0];
  }

  static async updateApiKey(id, newApiKey) {
    const result = await db.query(
      'UPDATE applications SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, api_key, description, created_at, updated_at',
      [newApiKey, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM applications WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async getStats(id) {
    // Get flag statistics for an application
    // Fixed: using app_id instead of application_id to match your schema
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_flags,
        COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_flags,
        COUNT(CASE WHEN enabled = false THEN 1 END) as disabled_flags
      FROM flags 
      WHERE app_id = $1
    `, [id]);
    
    return result.rows[0] || { total_flags: 0, enabled_flags: 0, disabled_flags: 0 };
  }

  static async getStatsByUser(userId) {
    const result = await db.query(`
      SELECT 
          COUNT(f.id) as total_flags,
          SUM(CASE WHEN f.enabled = true THEN 1 ELSE 0 END) as enabled_flags,
          SUM(CASE WHEN f.enabled = false THEN 1 ELSE 0 END) as disabled_flags
      FROM flags f
      JOIN applications a ON f.app_id = a.id
      WHERE a.user_id = $1;
    `, [userId]);
    
    return result.rows[0] || { total_flags: 0, enabled_flags: 0, disabled_flags: 0 };
  }


  static generateApiKey() {
    const prefix = 'ff_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }
}

module.exports = Application;