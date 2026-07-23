import { useState, useEffect, useCallback, useMemo } from "react";
import { listCustomers, setCustomerStatus, deleteCustomer } from "../api/customers";
import { Th, Td } from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { formatMoney } from "../utils/vehicle";

const PAGE_SIZE = 9;

function customerName(customer) {
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listCustomers();
      setCustomers(data);
    } catch {
      setErrorMsg("Couldn't load customers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((c) =>
      [customerName(c), c.email].some((field) => field.toLowerCase().includes(query))
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pageCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [customers, search]);

  const replaceCustomer = (updated) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  };

  const handleToggleStatus = async (customer) => {
    setBusyId(customer.id);
    try {
      const updated = await setCustomerStatus(customer.id, !customer.is_active);
      replaceCustomer(updated);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Remove ${customerName(customer)}? This cannot be undone.`)) return;
    setBusyId(customer.id);
    try {
      await deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
          Customers
        </h1>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or email"
          className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none sm:max-w-sm"
        />
      </div>

      {errorMsg && (
        <p className="mb-6 rounded-sm border border-soldout/40 bg-soldout/10 px-4 py-3 font-mono text-sm text-soldout">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <Loader label="Loading customers" />
      ) : filteredCustomers.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No customers match right now.</p>
        </div>
      ) : (
        <>
          <div className="plate max-h-[32rem] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-hairline">
                  <Th>Customer</Th>
                  <Th>Mobile</Th>
                  <Th>Registered</Th>
                  <Th align="right">Purchases</Th>
                  <Th align="right">Total Spent</Th>
                  <Th align="right">Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pageCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <CustomerAvatar customer={customer} />
                        <div>
                          <p className="text-ink">{customerName(customer)}</p>
                          <p className="font-mono text-xs text-muted">{customer.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td muted>{customer.mobile_number || "—"}</Td>
                    <Td muted>
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}
                    </Td>
                    <Td align="right">{customer.total_purchases}</Td>
                    <Td align="right">{formatMoney(customer.total_spent)}</Td>
                    <Td align="right">
                      <span
                        className={`font-mono text-[11px] uppercase tracking-wide ${
                          customer.is_active ? "text-available" : "text-soldout"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Disabled"}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCustomer(customer)}
                          className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          disabled={busyId === customer.id}
                          onClick={() => handleToggleStatus(customer)}
                          className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                        >
                          {customer.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === customer.id}
                          onClick={() => handleDelete(customer)}
                          className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {viewingCustomer && (
        <CustomerProfileModal customer={viewingCustomer} onClose={() => setViewingCustomer(null)} />
      )}
    </div>
  );
}

function CustomerAvatar({ customer }) {
  const [imageError, setImageError] = useState(false);
  const name = customerName(customer);

  if (!customer.avatar_url || imageError) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised font-mono text-xs uppercase text-muted">
        {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={customer.avatar_url}
      alt={name}
      onError={() => setImageError(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  );
}

function CustomerProfileModal({ customer, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="plate w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {customerName(customer)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <dl className="space-y-3 font-mono text-sm">
          <Row label="Email" value={customer.email} />
          <Row label="Mobile" value={customer.mobile_number || "—"} />
          <Row
            label="Registered"
            value={customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}
          />
          <Row label="Total Purchases" value={String(customer.total_purchases)} />
          <Row label="Total Spent" value={formatMoney(customer.total_spent)} />
          <Row label="Status" value={customer.is_active ? "Active" : "Disabled"} />
        </dl>
      </div>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
