export interface DailyRecord {
  id: string;
  date: string;
  full_bags_received: number;
  created_at: string;
}

export interface CollectionEntry {
  id: string;
  daily_record_id: string;
  full_bags_taken: number;
  empty_bags_returned: number;
  timestamp: string;
  notes: string;
  return_logged_at: string | null; // null = not yet returned
}

export interface DaySummary {
  record: DailyRecord;
  entries: CollectionEntry[];
  total_dispatched: number;
  total_returned: number;
  difference: number;
  has_mismatch: boolean;
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
