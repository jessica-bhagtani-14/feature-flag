const db = require('../config/database');

class Flag {
  static async findAll(appId) {
    const result = await db.query(
      'SELECT id, app_id, key, name, description, enabled, created_at, updated_at FROM flags WHERE app_id = $1 ORDER BY created_at DESC',
      [appId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, app_id, key, name, description, enabled, created_at, updated_at FROM flags WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByKey(appId, key) {
    const result = await db.query(
      'SELECT id, app_id, key, name, description, enabled, created_at, updated_at FROM flags WHERE app_id = $1 AND key = $2',
      [appId, key]
    );
    return result.rows[0];
  }

  static async findByAppId(appId) {
    const result = await db.query(
      'SELECT id, app_id, key, name, description, enabled, created_at, updated_at FROM flags WHERE app_id = $1',
      [appId]
    );
    return result.rows;
  }

  static async create(data) {
    const result = await db.query(
      'INSERT INTO flags (app_id, key, name, description, enabled) VALUES ($1, $2, $3, $4, $5) RETURNING id, app_id, key, name, description, enabled, created_at, updated_at',
      [data.app_id, data.key, data.name, data.description || null, data.enabled || false]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE flags SET key = $1, name = $2, description = $3, enabled = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, app_id, key, name, description, enabled, created_at, updated_at',
      [data.key, data.name, data.description || null, data.enabled, id]
    );
    return result.rows[0];
  }

  static async toggleEnabled(id) {
    const result = await db.query(
      'UPDATE flags SET enabled = NOT enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, app_id, key, name, description, enabled, created_at, updated_at',
      [id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM flags WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Flag;