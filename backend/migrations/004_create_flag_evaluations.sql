CREATE TABLE flag_evaluations (
    id SERIAL PRIMARY KEY,
    flag_id INTEGER REFERENCES flags(id) ON DELETE CASCADE,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    result BOOLEAN,
    user_context JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flags_app_id ON flags(app_id);
CREATE INDEX idx_flags_enabled ON flags(enabled);
CREATE INDEX idx_flag_evaluations_timestamp ON flag_evaluations(timestamp);
CREATE INDEX idx_flag_evaluations_flag_id ON flag_evaluations(flag_id);