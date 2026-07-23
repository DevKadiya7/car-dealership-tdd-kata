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

  return { data, setData, loading, setLoading, errorMsg, setErrorMsg, reload: load };
}
