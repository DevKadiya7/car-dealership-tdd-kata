import { useState, useCallback, useEffect } from "react";

// Fetch-on-mount with loading/error state - the same shape repeated across
// every admin list page (AdminInventory, AdminCustomers) before this was
// extracted out.
export function useAsyncList(fetchFn, errorMessage) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await fetchFn();
      setData(result);
    } catch {
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, errorMessage]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merges a partial update into the matching item by id - the same
  // "replace one row after a PATCH response" logic repeated across every
  // admin list page (AdminCustomers, AdminAdmins) before this was extracted.
  const replaceItem = useCallback((updated) => {
    setData((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
  }, []);

  // Tracks which row is mid-action (to disable its buttons) for the
  // duration of an async call - the same "setBusyId, await, clear it in a
  // finally" shape repeated across every admin list page with row actions
  // (AdminCustomers, AdminInventory, AdminAdmins, AdminLoans,
  // AdminServiceBookings) before this was extracted. Doesn't assume what
  // the action does with the result (replaceItem vs. removing the row),
  // it just returns/propagates it.
  const [busyId, setBusyId] = useState(null);

  const runBusyAction = useCallback(async (id, action) => {
    setBusyId(id);
    try {
      return await action();
    } finally {
      setBusyId(null);
    }
  }, []);

  return {
    data,
    setData,
    loading,
    setLoading,
    errorMsg,
    setErrorMsg,
    reload: load,
    replaceItem,
    busyId,
    runBusyAction,
  };
}
