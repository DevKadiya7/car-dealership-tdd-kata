import { useState, useMemo } from "react";
import { listAllPurchases } from "../api/purchases";
import { Th, Td } from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import Invoice from "../components/Invoice";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePagination } from "../hooks/usePagination";
import { calculateTotals, formatMoney } from "../utils/vehicle";
import {
  PAYMENT_METHOD_LABELS,
  STATUS_COLORS,
  ORDER_SORT_OPTIONS,
  invoiceNumberFor,
  sortPurchases,
} from "../utils/purchase";

const PAGE_SIZE = 8;

export default function AdminOrders() {
  const { data: orders, loading, errorMsg } = useAsyncList(
    listAllPurchases,
    "Couldn't load orders. Is the backend running?"
  );
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewingOrder, setViewingOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (query) {
        const haystack = [
          invoiceNumberFor(order),
          order.customer_name,
          order.customer_email,
          `${order.vehicle_make} ${order.vehicle_model}`,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (paymentFilter && order.payment_method !== paymentFilter) return false;
      if (statusFilter && order.status !== statusFilter) return false;
      const orderDate = order.purchased_at.slice(0, 10);
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;
      return true;
    });
  }, [orders, search, paymentFilter, statusFilter, dateFrom, dateTo]);

  const sortedOrders = useMemo(() => sortPurchases(filteredOrders, sortBy), [filteredOrders, sortBy]);
  const { page, setPage, totalPages, pageItems: pageOrders } = usePagination(sortedOrders, PAGE_SIZE, [
    orders,
    search,
    paymentFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">Orders</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders by invoice, customer, email, or vehicle"
          className="rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none lg:col-span-2"
        />

        <div>
          <label htmlFor="order-payment-filter" className="sr-only">
            Payment Method
          </label>
          <select
            id="order-payment-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
          >
            <option value="">All Payment Methods</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="order-status-filter" className="sr-only">
            Order Status
          </label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="order-date-from" className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
            From Date
          </label>
          <input
            id="order-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="order-date-to" className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
            To Date
          </label>
          <input
            id="order-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="order-sort-by" className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
            Sort by
          </label>
          <select
            id="order-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
          >
            {ORDER_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <p className="mb-6 rounded-sm border border-soldout/40 bg-soldout/10 px-4 py-3 font-mono text-sm text-soldout">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <Loader label="Loading orders" />
      ) : filteredOrders.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No orders match right now.</p>
        </div>
      ) : (
        <>
          <div className="plate max-h-[32rem] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-hairline">
                  <Th>Invoice</Th>
                  <Th>Customer</Th>
                  <Th>Vehicle</Th>
                  <Th>Date</Th>
                  <Th>Payment</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">GST</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pageOrders.map((order) => {
                  const totals = calculateTotals(order.total_price);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setViewingOrder(order)}
                      className="cursor-pointer transition-colors hover:bg-raised/40"
                    >
                      <Td muted>{invoiceNumberFor(order)}</Td>
                      <Td>
                        <p className="text-ink">{order.customer_name}</p>
                        <p className="font-mono text-xs text-muted">{order.customer_email}</p>
                      </Td>
                      <Td muted>
                        {order.vehicle_make} {order.vehicle_model}
                      </Td>
                      <Td muted>{new Date(order.purchased_at).toLocaleDateString()}</Td>
                      <Td muted>{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</Td>
                      <Td align="right">{order.quantity}</Td>
                      <Td align="right">{formatMoney(totals.gst)}</Td>
                      <Td align="right">{formatMoney(totals.total)}</Td>
                      <Td align="right">
                        <span
                          className={`font-mono text-[11px] uppercase tracking-wide ${
                            STATUS_COLORS[order.status] || "text-muted"
                          }`}
                        >
                          {order.status}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {viewingOrder && (
        <Modal onClose={() => setViewingOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <Invoice
              vehicle={{
                id: viewingOrder.vehicle_id,
                make: viewingOrder.vehicle_make,
                model: viewingOrder.vehicle_model,
              }}
              customer={{ name: viewingOrder.customer_name, email: viewingOrder.customer_email }}
              totals={calculateTotals(viewingOrder.total_price)}
              paymentMethod={PAYMENT_METHOD_LABELS[viewingOrder.payment_method] || viewingOrder.payment_method}
              invoiceNumber={invoiceNumberFor(viewingOrder)}
              date={new Date(viewingOrder.purchased_at).toLocaleDateString()}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
