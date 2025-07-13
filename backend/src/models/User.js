const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findAll() {
    const result = await db.query(
      'SELECT id, username, email, organization, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, email, password_hash, organization, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await db.query(
      'SELECT id, username, email, password_hash, organization, created_at, updated_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT id, username, email, password_hash, organization, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findByUsernameOrEmail(usernameOrEmail) {
    const result = await db.query(
      'SELECT id, username, email, password_hash, organization, created_at, updated_at FROM users WHERE username = $1 OR email = $1',
      [usernameOrEmail]
    );
    return result.rows[0];
  }

  static async create(data) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, organization) VALUES ($1, $2, $3, $4) RETURNING id, username, email, organization, created_at, updated_at',
      [data.username, data.email, hashedPassword, data.organization || null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE users SET username = $1, email = $2, organization = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, email, organization, created_at, updated_at',
      [data.username, data.email, data.organization || null, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async exists(username, email) {
    const result = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    return result.rows.length > 0;
  }
}

module.exports = User;