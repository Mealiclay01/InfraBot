import Database from 'better-sqlite3';

const db = new Database('infrabot.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS server_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    server_name TEXT,
    cpu_pct REAL,
    ram_pct REAL,
    disk_pct REAL,
    containers_json TEXT,
    failed_services_json TEXT
  );

  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tool TEXT,
    server_name TEXT,
    params TEXT,
    stdout TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('model', 'qwen2.5:0.5b')`).run();

export default db;
