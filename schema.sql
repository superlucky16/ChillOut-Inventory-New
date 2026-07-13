CREATE TABLE IF NOT EXISTS inventory_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id TEXT NOT NULL,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'sleeves',
  counted_by TEXT NOT NULL DEFAULT 'Unknown',
  counted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshot ON inventory_counts(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_time ON inventory_counts(counted_at DESC);
