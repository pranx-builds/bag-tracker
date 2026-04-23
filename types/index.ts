export interface DailyRecord {
  id: string;
  shop_id: string;
  date: string;
  full_bags_received: number;
  created_at: string;
}

export interface CollectionEntry {
  id: string;
  shop_id: string;
  daily_record_id: string;
  full_bags_taken: number;
  empty_bags_returned: number;
  timestamp: string;
  notes: string;
  return_logged_at: string | null;
}

export interface DaySummary {
  record: DailyRecord;
  entries: CollectionEntry[];
  total_dispatched: number;
  total_returned: number;
  remaining: number;    // full_bags_received - total_dispatched (still in inventory)
  missing: number;      // total_dispatched - total_returned (collected but not returned empty)
  has_missing: boolean;
}

export interface WeeklyReport {
  week_label: string;
  start_date: string;
  end_date: string;
  total_received: number;
  total_dispatched: number;
  total_returned: number;
  days_count: number;
}

export interface MonthlyReport {
  month_label: string;
  year: number;
  month: number;
  total_received: number;
  total_dispatched: number;
  total_returned: number;
  days_count: number;
}

export interface Shop {
  id: string;
  name: string;
  pin: string;
  is_active: boolean;
  created_at: string;
}

export interface ShopTodaySummary {
  shop: Shop;
  record: DailyRecord | null;
  total_dispatched: number;
  total_returned: number;
  entries_count: number;
  partial_missing: number;
}
