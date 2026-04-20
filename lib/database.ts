import * as SQLite from 'expo-sqlite';
import type { DailyRecord, CollectionEntry, DaySummary, WeeklyReport, MonthlyReport } from '@/types';
import { initSettingsTable, getSetting } from '@/lib/settings';

const db = SQLite.openDatabaseSync('bag_tracker.db');

export function initDatabase(): void {
  initSettingsTable();
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS daily_records (
      id                 TEXT PRIMARY KEY,
      date               TEXT NOT NULL UNIQUE,
      full_bags_received INTEGER NOT NULL DEFAULT 0,
      created_at         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_entries (
      id                  TEXT PRIMARY KEY,
      daily_record_id     TEXT NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
      full_bags_taken     INTEGER NOT NULL DEFAULT 0,
      empty_bags_returned INTEGER NOT NULL DEFAULT 0,
      notes               TEXT NOT NULL DEFAULT '',
      timestamp           TEXT NOT NULL DEFAULT (datetime('now')),
      return_logged_at    TEXT DEFAULT NULL
    );
  `);

  // migrate: add return_logged_at if upgrading from old schema
  try {
    db.execSync(`ALTER TABLE collection_entries ADD COLUMN return_logged_at TEXT DEFAULT NULL;`);
  } catch (_) { /* column already exists */ }
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Daily Records ────────────────────────────────────────────────────────────

export function getDailyRecord(date: string): DailyRecord | null {
  return db.getFirstSync<DailyRecord>(`SELECT * FROM daily_records WHERE date = ?`, [date]) ?? null;
}

export function createDailyRecord(date: string, fullBagsReceived: number): DailyRecord {
  const id = uuid();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO daily_records (id, date, full_bags_received, created_at) VALUES (?, ?, ?, ?)`,
    [id, date, fullBagsReceived, now]
  );
  return getDailyRecord(date)!;
}

export function updateDailyRecord(id: string, fullBagsReceived: number): void {
  db.runSync(`UPDATE daily_records SET full_bags_received = ? WHERE id = ?`, [fullBagsReceived, id]);
}

export function deleteDailyRecord(id: string): void {
  db.runSync(`DELETE FROM daily_records WHERE id = ?`, [id]);
}

export function getAllDailyRecords(): DailyRecord[] {
  return db.getAllSync<DailyRecord>(`SELECT * FROM daily_records ORDER BY date DESC`);
}

// ─── Collection Entries ───────────────────────────────────────────────────────

export function getCollectionEntries(dailyRecordId: string): CollectionEntry[] {
  return db.getAllSync<CollectionEntry>(
    `SELECT * FROM collection_entries WHERE daily_record_id = ? ORDER BY timestamp ASC`,
    [dailyRecordId]
  );
}

export function addCollectionEntry(
  dailyRecordId: string,
  fullBagsTaken: number,
  notes: string = '',
  customTimestamp?: string
): CollectionEntry {
  const id = uuid();
  const now = customTimestamp ?? new Date().toISOString();
  db.runSync(
    `INSERT INTO collection_entries (id, daily_record_id, full_bags_taken, empty_bags_returned, notes, timestamp, return_logged_at)
     VALUES (?, ?, ?, 0, ?, ?, NULL)`,
    [id, dailyRecordId, fullBagsTaken, notes.trim(), now]
  );
  return db.getFirstSync<CollectionEntry>(`SELECT * FROM collection_entries WHERE id = ?`, [id])!;
}

export function logEmptyBagReturn(id: string, emptyBagsReturned: number): void {
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE collection_entries SET empty_bags_returned = ?, return_logged_at = ? WHERE id = ?`,
    [emptyBagsReturned, now, id]
  );
}

export function updateCollectionEntry(
  id: string,
  fullBagsTaken: number,
  emptyBagsReturned: number,
  notes: string = ''
): void {
  db.runSync(
    `UPDATE collection_entries SET full_bags_taken = ?, empty_bags_returned = ?, notes = ? WHERE id = ?`,
    [fullBagsTaken, emptyBagsReturned, notes.trim(), id]
  );
}

export function deleteCollectionEntry(id: string): void {
  db.runSync(`DELETE FROM collection_entries WHERE id = ?`, [id]);
}

// ─── Reminder helpers ─────────────────────────────────────────────────────────

// Returns entries with no return logged yet, collected within the return window
export function getPendingReturns(dailyRecordId: string): CollectionEntry[] {
  const windowMs = getSetting('returnWindowMinutes') * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  return db.getAllSync<CollectionEntry>(
    `SELECT * FROM collection_entries
     WHERE daily_record_id = ?
       AND return_logged_at IS NULL
       AND timestamp >= ?
     ORDER BY timestamp ASC`,
    [dailyRecordId, cutoff]
  );
}

// Returns entries with no return logged and past the return window (overdue)
export function getOverdueReturns(dailyRecordId: string): CollectionEntry[] {
  const windowMs = getSetting('returnWindowMinutes') * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  return db.getAllSync<CollectionEntry>(
    `SELECT * FROM collection_entries
     WHERE daily_record_id = ?
       AND return_logged_at IS NULL
       AND timestamp < ?
     ORDER BY timestamp ASC`,
    [dailyRecordId, cutoff]
  );
}

// ─── Summaries & Reports ──────────────────────────────────────────────────────

export function getDaySummary(date: string): DaySummary | null {
  const record = getDailyRecord(date);
  if (!record) return null;
  const entries = getCollectionEntries(record.id);
  const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
  const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
  const difference = record.full_bags_received - total_dispatched;
  return { record, entries, total_dispatched, total_returned, difference, has_mismatch: difference !== 0 };
}

export function getDailyReports(): DaySummary[] {
  return getAllDailyRecords().map((record) => {
    const entries = getCollectionEntries(record.id);
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    const difference = record.full_bags_received - total_dispatched;
    return { record, entries, total_dispatched, total_returned, difference, has_mismatch: difference !== 0 };
  });
}

export function getWeeklyReports(): WeeklyReport[] {
  const weeks: Record<string, WeeklyReport> = {};
  for (const record of getAllDailyRecords()) {
    const entries = getCollectionEntries(record.id);
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    const d = new Date(record.date + 'T00:00:00');
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const key = monday.toISOString().split('T')[0];
    if (!weeks[key]) {
      weeks[key] = {
        week_label: `${monday.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        start_date: key,
        end_date: sunday.toISOString().split('T')[0],
        total_received: 0, total_dispatched: 0, total_returned: 0, days_count: 0,
      };
    }
    weeks[key].total_received += record.full_bags_received;
    weeks[key].total_dispatched += total_dispatched;
    weeks[key].total_returned += total_returned;
    weeks[key].days_count += 1;
  }
  return Object.values(weeks).sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export function getMonthlyReports(): MonthlyReport[] {
  const months: Record<string, MonthlyReport> = {};
  for (const record of getAllDailyRecords()) {
    const entries = getCollectionEntries(record.id);
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    const d = new Date(record.date + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!months[key]) {
      months[key] = { month_label: d.toLocaleDateString([], { year: 'numeric', month: 'long' }), year, month, total_received: 0, total_dispatched: 0, total_returned: 0, days_count: 0 };
    }
    months[key].total_received += record.full_bags_received;
    months[key].total_dispatched += total_dispatched;
    months[key].total_returned += total_returned;
    months[key].days_count += 1;
  }
  return Object.values(months).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
}

export function generateCsvReport(): string {
  const lines = ['Date,Full Bags Received,Full Bags Dispatched,Empty Bags Returned,Difference'];
  for (const record of getAllDailyRecords()) {
    const entries = getCollectionEntries(record.id);
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    lines.push(`${record.date},${record.full_bags_received},${total_dispatched},${total_returned},${record.full_bags_received - total_dispatched}`);
  }
  return lines.join('\n');
}
