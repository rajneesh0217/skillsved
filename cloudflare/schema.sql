CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    program TEXT NOT NULL,
    profile TEXT NOT NULL,
    city TEXT NOT NULL,
    expectation TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL
);