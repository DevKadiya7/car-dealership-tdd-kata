import { useState, useEffect } from "react";

export function usePagination(items, pageSize, resetDeps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  return { page, setPage, totalPages, pageItems };
}
