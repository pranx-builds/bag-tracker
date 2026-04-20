import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bag_tracker.db');

export interface AppSettings {
  returnWindowMinutes: number; // minutes before reminder shows and overdue triggers
  defaultNotes: string;        // pre-fill notes on new collection
  showCountdownTimer: boolean; // show live countdown badge on collections
  use24HourTime: boolean;      // time format in pickers
  userName: string;            // name shown in dashboard greeting
}

const DEFAULTS: AppSettings = {
  returnWindowMinutes: 20,
  defaultNotes: '',
  showCountdownTimer: true,
  use24HourTime: true,
  userName: '',
};

export function initSettingsTable(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  try {
    const row = db.getFirstSync<{ value: string }>(`SELECT value FROM app_settings WHERE key = ?`, [key]);
    if (!row) return DEFAULTS[key];
    const raw = row.value;
    if (raw === 'true') return true as AppSettings[K];
    if (raw === 'false') return false as AppSettings[K];
    const num = Number(raw);
    if (!isNaN(num) && raw.trim() !== '') return num as AppSettings[K];
    return raw as AppSettings[K];
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  db.runSync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    [key, String(value)]
  );
}

export function getAllSettings(): AppSettings {
  return {
    returnWindowMinutes: getSetting('returnWindowMinutes'),
    defaultNotes: getSetting('defaultNotes'),
    showCountdownTimer: getSetting('showCountdownTimer'),
    use24HourTime: getSetting('use24HourTime'),
    userName: getSetting('userName'),
  };
}
