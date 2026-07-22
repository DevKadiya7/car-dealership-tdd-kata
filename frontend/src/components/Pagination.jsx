export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          type="button"
          onClick={() => onPageChange(pageNum)}
          aria-current={page === pageNum ? "page" : undefined}
          className={`rounded-sm border px-3 py-1.5 font-mono text-xs ${
            page === pageNum ? "border-amber text-amber" : "border-hairline text-muted hover:text-ink"
          }`}
        >
          {pageNum}
        </button>
      ))}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
