import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDaySummary, getPendingReturns, getOverdueReturns } from '@/lib/database';
import { getTodayDate } from '@/utils/date';
import { STATUS_POLL_INTERVAL_MS } from '@/constants';
import { logger } from '@/lib/logger';
import type { DaySummary } from '@/types';

export function useShopDashboard(shopId: string) {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const today = getTodayDate();

  const loadData = useCallback(async () => {
    if (!shopId) return;
    try {
      const s = await getDaySummary(shopId, today);
      setSummary(s);
      if (s) {
        const [pending, overdue] = await Promise.all([
          getPendingReturns(s.record.id),
          getOverdueReturns(s.record.id),
        ]);
        setPendingCount(pending.length);
        setOverdueCount(overdue.length);
      } else {
        setPendingCount(0);
        setOverdueCount(0);
      }
    } catch (err) {
      logger.error('useShopDashboard loadData:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, today]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const id = setInterval(async () => {
      if (!summary) return;
      try {
        const [pending, overdue] = await Promise.all([
          getPendingReturns(summary.record.id),
          getOverdueReturns(summary.record.id),
        ]);
        setPendingCount(pending.length);
        setOverdueCount(overdue.length);
      } catch (err) {
        logger.error('useShopDashboard poll:', err);
      }
    }, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [summary]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return { summary, loading, refreshing, pendingCount, overdueCount, today, loadData, onRefresh };
}
