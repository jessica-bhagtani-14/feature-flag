CREATE TABLE flags (
    id SERIAL PRIMARY KEY,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, key)
);