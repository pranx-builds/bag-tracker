import { supabase } from '@/lib/supabase';
import { getSetting } from '@/lib/settings';
import { getTodayDate, getMondayOf } from '@/utils/date';
import type { DailyRecord, CollectionEntry, DaySummary, WeeklyReport, MonthlyReport, Shop, ShopTodaySummary } from '@/types';
import { MAX_PIN_GENERATION_ATTEMPTS } from '@/constants';

export { getTodayDate, formatDate, formatDateTime } from '@/utils/date';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Daily Records ────────────────────────────────────────────────────────────

export async function getDailyRecord(shopId: string, date: string): Promise<DailyRecord | null> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('shop_id', shopId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDailyRecord(shopId: string, date: string, fullBagsReceived: number): Promise<DailyRecord> {
  const { data, error } = await supabase
    .from('daily_records')
    .upsert({ id: uuid(), shop_id: shopId, date, full_bags_received: fullBagsReceived })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDailyRecord(id: string, fullBagsReceived: number): Promise<void> {
  const { error } = await supabase
    .from('daily_records')
    .update({ full_bags_received: fullBagsReceived })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDailyRecord(id: string): Promise<void> {
  const { error } = await supabase.from('daily_records').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllDailyRecords(shopId: string): Promise<DailyRecord[]> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('shop_id', shopId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Collection Entries ───────────────────────────────────────────────────────

export async function getCollectionEntries(dailyRecordId: string): Promise<CollectionEntry[]> {
  const { data, error } = await supabase
    .from('collection_entries')
    .select('*')
    .eq('daily_record_id', dailyRecordId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addCollectionEntry(
  shopId: string,
  dailyRecordId: string,
  fullBagsTaken: number,
  notes: string = '',
  customTimestamp?: string
): Promise<CollectionEntry> {
  const now = customTimestamp ?? new Date().toISOString();
  const { data, error } = await supabase
    .from('collection_entries')
    .insert({
      id: uuid(),
      shop_id: shopId,
      daily_record_id: dailyRecordId,
      full_bags_taken: fullBagsTaken,
      empty_bags_returned: 0,
      notes: notes.trim(),
      timestamp: now,
      return_logged_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function logEmptyBagReturn(id: string, emptyBagsReturned: number): Promise<void> {
  const { error } = await supabase
    .from('collection_entries')
    .update({ empty_bags_returned: emptyBagsReturned, return_logged_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateCollectionEntry(
  id: string,
  fullBagsTaken: number,
  emptyBagsReturned: number,
  notes: string = '',
  timestamp?: string
): Promise<void> {
  const payload: Record<string, unknown> = {
    full_bags_taken: fullBagsTaken,
    empty_bags_returned: emptyBagsReturned,
    notes: notes.trim(),
  };
  if (timestamp) payload.timestamp = timestamp;
  const { error } = await supabase.from('collection_entries').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteCollectionEntry(id: string): Promise<void> {
  const { error } = await supabase.from('collection_entries').delete().eq('id', id);
  if (error) throw error;
}

// ─── Reminder helpers ─────────────────────────────────────────────────────────

export async function getPendingReturns(dailyRecordId: string): Promise<CollectionEntry[]> {
  const windowMs = getSetting('returnWindowMinutes') * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .from('collection_entries')
    .select('*')
    .eq('daily_record_id', dailyRecordId)
    .is('return_logged_at', null)
    .gte('timestamp', cutoff)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getOverdueReturns(dailyRecordId: string): Promise<CollectionEntry[]> {
  const windowMs = getSetting('returnWindowMinutes') * 60 * 1000;
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .from('collection_entries')
    .select('*')
    .eq('daily_record_id', dailyRecordId)
    .is('return_logged_at', null)
    .lt('timestamp', cutoff)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Summaries & Reports ──────────────────────────────────────────────────────

export async function getDaySummary(shopId: string, date: string): Promise<DaySummary | null> {
  const record = await getDailyRecord(shopId, date);
  if (!record) return null;
  const entries = await getCollectionEntries(record.id);
  const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
  const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
  const remaining = record.full_bags_received - total_dispatched;
  const missing = total_dispatched - total_returned;
  return { record, entries, total_dispatched, total_returned, remaining, missing, has_missing: missing > 0 };
}

export async function getDailyReports(shopId: string): Promise<DaySummary[]> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('*, collection_entries(*)')
    .eq('shop_id', shopId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const entries: CollectionEntry[] = (row.collection_entries ?? []).sort(
      (a: CollectionEntry, b: CollectionEntry) => a.timestamp.localeCompare(b.timestamp)
    );
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    const remaining = row.full_bags_received - total_dispatched;
    const missing = total_dispatched - total_returned;
    const record: DailyRecord = { id: row.id, shop_id: row.shop_id, date: row.date, full_bags_received: row.full_bags_received, created_at: row.created_at };
    return { record, entries, total_dispatched, total_returned, remaining, missing, has_missing: missing > 0 };
  });
}

export async function getWeeklyReports(shopId: string): Promise<WeeklyReport[]> {
  const dailyReports = await getDailyReports(shopId);
  const weeks: Record<string, WeeklyReport> = {};
  for (const { record, entries } of dailyReports) {
    const total_dispatched = entries.reduce((s, e) => s + e.full_bags_taken, 0);
    const total_returned = entries.reduce((s, e) => s + e.empty_bags_returned, 0);
    const d = new Date(record.date + 'T00:00:00');
    const monday = getMondayOf(d);
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

export async function getMonthlyReports(shopId: string): Promise<MonthlyReport[]> {
  const dailyReports = await getDailyReports(shopId);
  const months: Record<string, MonthlyReport> = {};
  for (const { record, entries } of dailyReports) {
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

export async function generateCsvReport(shopId: string): Promise<string> {
  const reports = await getDailyReports(shopId);
  const lines = ['Date,Full Bags Received,Full Bags Dispatched,Empty Bags Returned,Difference'];
  for (const { record, total_dispatched, total_returned } of reports) {
    lines.push(`${record.date},${record.full_bags_received},${total_dispatched},${total_returned},${record.full_bags_received - total_dispatched}`);
  }
  return lines.join('\n');
}

// ─── Shop Management (Admin) ──────────────────────────────────────────────────

export async function getAllShops(): Promise<Shop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createShop(name: string): Promise<Shop> {
  let pin = '';
  for (let attempt = 0; attempt < MAX_PIN_GENERATION_ATTEMPTS; attempt++) {
    pin = String(Math.floor(1000 + Math.random() * 9000));
    const { data } = await supabase.from('shops').select('id').eq('pin', pin).maybeSingle();
    if (!data) break;
    if (attempt === MAX_PIN_GENERATION_ATTEMPTS - 1) {
      throw new Error(`Could not generate unique PIN after ${MAX_PIN_GENERATION_ATTEMPTS} attempts`);
    }
  }
  const adminPin = await getAdminPin();
  if (pin === adminPin) pin = String(parseInt(pin) + 1);

  const { data, error } = await supabase
    .from('shops')
    .insert({ name: name.trim(), pin, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleShopActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('shops').update({ is_active }).eq('id', id);
  if (error) throw error;
}

export async function deleteShop(id: string): Promise<void> {
  const { error } = await supabase.from('shops').delete().eq('id', id);
  if (error) throw error;
}

export async function getAdminPin(): Promise<string> {
  const { data, error } = await supabase
    .from('admin_config')
    .select('value')
    .eq('key', 'pin')
    .single();
  if (error) throw error;
  return data.value;
}

export async function setAdminPin(pin: string): Promise<void> {
  const { error } = await supabase
    .from('admin_config')
    .upsert({ key: 'pin', value: pin });
  if (error) throw error;
}

export async function getAllShopsTodaySummary(): Promise<ShopTodaySummary[]> {
  const today = getTodayDate();
  const shops = await getAllShops();
  return Promise.all(
    shops.map(async (shop) => {
      const record = await getDailyRecord(shop.id, today);
      if (!record) return { shop, record: null, total_dispatched: 0, total_returned: 0, entries_count: 0, partial_missing: 0 };
      const entries = await getCollectionEntries(record.id);
      return {
        shop,
        record,
        total_dispatched: entries.reduce((s, e) => s + e.full_bags_taken, 0),
        total_returned: entries.reduce((s, e) => s + e.empty_bags_returned, 0),
        entries_count: entries.length,
        partial_missing: entries
          .filter(e => e.return_logged_at !== null && e.empty_bags_returned < e.full_bags_taken)
          .reduce((s, e) => s + (e.full_bags_taken - e.empty_bags_returned), 0),
      };
    })
  );
}
