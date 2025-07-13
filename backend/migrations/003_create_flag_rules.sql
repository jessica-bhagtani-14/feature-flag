CREATE TABLE flag_rules (
  id SERIAL PRIMARY KEY,
  flag_id INTEGER NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('toggle', 'percentage', 'conditional')),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB,
  target_percentage INTEGER CHECK (target_percentage >= 0 AND target_percentage <= 100),
  hash_key VARCHAR(50) DEFAULT 'user_id',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flag_rules_flag_id ON flag_rules(flag_id);
CREATE INDEX idx_flag_rules_enabled ON flag_rules(enabled);
CREATE INDEX idx_flag_rules_priority ON flag_rules(priority DESC);