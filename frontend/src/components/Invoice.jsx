import { formatMoney } from "../utils/vehicle";

export default function Invoice({ vehicle, customer, totals, paymentMethod, invoiceNumber, date }) {
  return (
    <div className="plate p-6">
      <div className="mb-6 flex items-start justify-between border-b border-dashed border-hairline pb-4">
        <div>
          <div className="mb-2 h-10 w-10 rounded-sm bg-amber" aria-hidden="true" />
          <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">
            Ironyard Motors
          </p>
        </div>
        <div className="text-right font-mono text-xs text-muted">
          <p>
            Invoice Number: <span className="text-ink">{invoiceNumber}</span>
          </p>
          <p>
            Purchase Date: <span className="text-ink">{date}</span>
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 font-mono text-xs">
        <div>
          <p className="mb-1 uppercase tracking-wide text-muted">Billed To</p>
          <p className="text-ink">{customer.name}</p>
          <p className="text-muted">{customer.email}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-wide text-muted">Vehicle</p>
          <p className="text-ink">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-muted">Stock No. {vehicle.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <dl className="space-y-2 border-t border-dashed border-hairline pt-4 font-mono text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Price</dt>
          <dd className="text-ink">{formatMoney(totals.base)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">GST (18%)</dt>
          <dd className="text-ink">{formatMoney(totals.gst)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-hairline pt-2 text-base">
          <dt className="font-semibold text-ink">Grand Total</dt>
          <dd className="font-semibold text-amber">{formatMoney(totals.total)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">Payment Method</dt>
          <dd className="text-ink">{paymentMethod}</dd>
        </div>
      </dl>

      <div className="mt-6 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-sm border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Print
        </button>
        <button
          type="button"
          disabled
          title="PDF export is not available in this demo"
          className="flex-1 rounded-sm border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted opacity-50"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
