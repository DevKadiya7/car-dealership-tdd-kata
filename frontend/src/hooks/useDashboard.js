import { useState, useEffect, useCallback } from "react";
import {
  getDashboardSummary,
  getRecentPurchases,
  getTopSelling,
  getLowStock,
  getSalesByCategory,
  getMonthlySales,
} from "../api/dashboard";

/**
 * Fetches all six admin dashboard endpoints in parallel and exposes
 * loading/error state plus a refresh function. Kept as one hook (rather
 * than six separate ones) since every dashboard section loads together
 * on a single page - there's no case where a caller needs just one slice
 * of this data independently of the rest.
 */
export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        recentPurchasesData,
        topSellingData,
        lowStockData,
        salesByCategoryData,
        monthlySalesData,
      ] = await Promise.all([
        getDashboardSummary(),
        getRecentPurchases(),
        getTopSelling(),
        getLowStock(),
        getSalesByCategory(),
        getMonthlySales(),
      ]);

      setSummary(summaryData);
      setRecentPurchases(recentPurchasesData);
      setTopSelling(topSellingData);
      setLowStock(lowStockData);
      setSalesByCategory(salesByCategoryData);
      setMonthlySales(monthlySalesData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // GET /api/dashboard/monthly-sales always returns exactly 12 rows
  // (Jan-Dec), even with zero purchases - it can never be literally
  // empty. So "no activity yet" is judged from total_sales instead of
  // checking every array for emptiness.
  const isEmpty = Boolean(summary) && summary.total_sales === 0;

  return {
    summary,
    recentPurchases,
    topSelling,
    lowStock,
    salesByCategory,
    monthlySales,
    loading,
    error,
    isEmpty,
    refresh: load,
  };
}
