import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { seedDatabase } from "./seed";

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DB_PATH = path.join(DATA_DIR, "crash-log.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    runMigrations(db);
    if (process.env.NODE_ENV !== "production") {
      seedDatabase(db);
    }
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crashes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_description TEXT,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('minor', 'moderate', 'severe')),
      crash_type TEXT NOT NULL CHECK(crash_type IN ('vehicle', 'road_hazard', 'dooring', 'solo', 'pedestrian', 'bicycle', 'ebike', 'other')),
      date_of_crash DATE NOT NULL,
      reported_to_police INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crash_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crash_id INTEGER NOT NULL REFERENCES crashes(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commute_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      date TEXT NOT NULL,
      weather INTEGER NOT NULL CHECK(weather BETWEEN 1 AND 5),
      safety INTEGER NOT NULL CHECK(safety BETWEEN 1 AND 5),
      legs INTEGER NOT NULL CHECK(legs BETWEEN 1 AND 5),
      soul INTEGER NOT NULL CHECK(soul BETWEEN 1 AND 5),
      joys TEXT,
      sorrows TEXT,
      distance_miles REAL,
      duration_minutes INTEGER,
      rush_hour INTEGER DEFAULT 0,
      time_of_day TEXT CHECK(time_of_day IN ('am', 'pm'))
    );
  `);
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

function runMigrations(db: Database.Database) {
  if (!hasColumn(db, "commute_logs", "distance_miles")) {
    db.exec(`ALTER TABLE commute_logs ADD COLUMN distance_miles REAL`);
  }
  if (!hasColumn(db, "commute_logs", "duration_minutes")) {
    db.exec(`ALTER TABLE commute_logs ADD COLUMN duration_minutes INTEGER`);
  }
  if (!hasColumn(db, "commute_logs", "rush_hour")) {
    db.exec(`ALTER TABLE commute_logs ADD COLUMN rush_hour INTEGER DEFAULT 0`);
  }
  if (!hasColumn(db, "commute_logs", "time_of_day")) {
    db.exec(`ALTER TABLE commute_logs ADD COLUMN time_of_day TEXT CHECK(time_of_day IN ('am', 'pm'))`);
  }
}

export interface CrashPhoto {
  id: number;
  crash_id: number;
  filename: string;
  label: string | null;
  created_at: string;
}

export interface Crash {
  id: number;
  created_at: string;
  lat: number;
  lng: number;
  location_description: string | null;
  description: string;
  severity: "minor" | "moderate" | "severe";
  crash_type: "vehicle" | "road_hazard" | "dooring" | "solo" | "pedestrian" | "bicycle" | "ebike" | "other";
  date_of_crash: string;
  reported_to_police: number;
  photos?: CrashPhoto[];
}

export function getAllCrashes(filters?: {
  severity?: string;
  crash_type?: string;
  date_from?: string;
  date_to?: string;
}): Crash[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (filters?.severity) {
    conditions.push("severity = @severity");
    params.severity = filters.severity;
  }
  if (filters?.crash_type) {
    conditions.push("crash_type = @crash_type");
    params.crash_type = filters.crash_type;
  }
  if (filters?.date_from) {
    conditions.push("date_of_crash >= @date_from");
    params.date_from = filters.date_from;
  }
  if (filters?.date_to) {
    conditions.push("date_of_crash <= @date_to");
    params.date_to = filters.date_to;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const crashes = db.prepare(`SELECT * FROM crashes ${where} ORDER BY date_of_crash DESC`).all(params) as Crash[];

  // Attach photos to each crash
  const photoStmt = db.prepare("SELECT * FROM crash_photos WHERE crash_id = ? ORDER BY id");
  for (const crash of crashes) {
    crash.photos = photoStmt.all(crash.id) as CrashPhoto[];
  }

  return crashes;
}

export function insertCrash(data: {
  lat: number;
  lng: number;
  location_description?: string;
  description: string;
  severity: string;
  crash_type: string;
  date_of_crash: string;
  reported_to_police?: boolean;
}): Crash {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO crashes (lat, lng, location_description, description, severity, crash_type, date_of_crash, reported_to_police)
    VALUES (@lat, @lng, @location_description, @description, @severity, @crash_type, @date_of_crash, @reported_to_police)
  `);
  const result = stmt.run({
    lat: data.lat,
    lng: data.lng,
    location_description: data.location_description || null,
    description: data.description,
    severity: data.severity,
    crash_type: data.crash_type,
    date_of_crash: data.date_of_crash,
    reported_to_police: data.reported_to_police ? 1 : 0,
  });
  return db.prepare("SELECT * FROM crashes WHERE id = ?").get(result.lastInsertRowid) as Crash;
}

export function getStats() {
  const db = getDb();

  const byMonth = db.prepare(`
    SELECT strftime('%Y-%m', date_of_crash) as month, COUNT(*) as count
    FROM crashes GROUP BY month ORDER BY month
  `).all() as { month: string; count: number }[];

  const byType = db.prepare(`
    SELECT crash_type, COUNT(*) as count
    FROM crashes GROUP BY crash_type ORDER BY count DESC
  `).all() as { crash_type: string; count: number }[];

  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM crashes GROUP BY severity ORDER BY count DESC
  `).all() as { severity: string; count: number }[];

  const total = db.prepare("SELECT COUNT(*) as count FROM crashes").get() as { count: number };

  const reportedRate = db.prepare(`
    SELECT
      SUM(CASE WHEN reported_to_police = 1 THEN 1 ELSE 0 END) as reported,
      COUNT(*) as total
    FROM crashes
  `).get() as { reported: number; total: number };

  return { byMonth, byType, bySeverity, total: total.count, reportedRate };
}

export function insertPhoto(crashId: number, filename: string, label?: string): CrashPhoto {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO crash_photos (crash_id, filename, label)
    VALUES (@crash_id, @filename, @label)
  `);
  const result = stmt.run({
    crash_id: crashId,
    filename,
    label: label || null,
  });
  return db.prepare("SELECT * FROM crash_photos WHERE id = ?").get(result.lastInsertRowid) as CrashPhoto;
}

export function getPhotoCount(crashId: number): number {
  const db = getDb();
  return (db.prepare("SELECT COUNT(*) as count FROM crash_photos WHERE crash_id = ?").get(crashId) as { count: number }).count;
}

// --- Commute Log ---

export interface CommuteLog {
  id: number;
  created_at: string;
  date: string;
  weather: number;
  safety: number;
  legs: number;
  soul: number;
  joys: string | null;
  sorrows: string | null;
  distance_miles: number | null;
  duration_minutes: number | null;
  rush_hour: number;
  time_of_day: "am" | "pm" | null;
}

export function getAllCommuteLogs(): CommuteLog[] {
  const db = getDb();
  return db.prepare("SELECT * FROM commute_logs ORDER BY date DESC").all() as CommuteLog[];
}

export function insertCommuteLog(data: {
  date: string;
  weather: number;
  safety: number;
  legs: number;
  soul: number;
  joys?: string;
  sorrows?: string;
  distance_miles?: number;
  duration_minutes?: number;
  rush_hour?: boolean;
  time_of_day?: "am" | "pm";
}): CommuteLog {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO commute_logs (date, weather, safety, legs, soul, joys, sorrows, distance_miles, duration_minutes, rush_hour, time_of_day)
    VALUES (@date, @weather, @safety, @legs, @soul, @joys, @sorrows, @distance_miles, @duration_minutes, @rush_hour, @time_of_day)
  `);
  const result = stmt.run({
    date: data.date,
    weather: data.weather,
    safety: data.safety,
    legs: data.legs,
    soul: data.soul,
    joys: data.joys || null,
    sorrows: data.sorrows || null,
    distance_miles: data.distance_miles ?? null,
    duration_minutes: data.duration_minutes ?? null,
    rush_hour: data.rush_hour ? 1 : 0,
    time_of_day: data.time_of_day || null,
  });
  return db.prepare("SELECT * FROM commute_logs WHERE id = ?").get(result.lastInsertRowid) as CommuteLog;
}

export function getCommuteStats() {
  const db = getDb();

  const total = (db.prepare("SELECT COUNT(*) as count FROM commute_logs").get() as { count: number }).count;

  const averages = db.prepare(`
    SELECT
      ROUND(AVG(weather), 1) as avg_weather,
      ROUND(AVG(safety), 1) as avg_safety,
      ROUND(AVG(legs), 1) as avg_legs,
      ROUND(AVG(soul), 1) as avg_soul
    FROM commute_logs
  `).get() as { avg_weather: number; avg_safety: number; avg_legs: number; avg_soul: number } | undefined;

  const byWeek = db.prepare(`
    SELECT strftime('%Y-W%W', date) as week,
      ROUND(AVG(weather), 1) as weather,
      ROUND(AVG(safety), 1) as safety,
      ROUND(AVG(legs), 1) as legs,
      ROUND(AVG(soul), 1) as soul
    FROM commute_logs GROUP BY week ORDER BY week
  `).all() as { week: string; weather: number; safety: number; legs: number; soul: number }[];

  const recent = db.prepare(
    "SELECT * FROM commute_logs ORDER BY date DESC LIMIT 7"
  ).all() as CommuteLog[];

  return { total, averages, byWeek, recent };
}
