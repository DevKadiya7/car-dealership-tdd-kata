import { useState, useEffect, useCallback } from "react";
import { listVehicles, restockVehicle, deleteVehicle } from "../api/vehicles";
import Loader from "../components/Loader";
import { useDashboard } from "../hooks/useDashboard";

const formatCurrency = (value) =>
  Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function AdminDashboard() {
  const {
    summary,
    recentPurchases,
    topSelling,
    lowStock,
    salesByCategory,
    monthlySales,
    loading: dashboardLoading,
    error: dashboardError,
    isEmpty,
  } = useDashboard();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to load vehicles", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attention = vehicles
    .filter((v) => v.quantity <= 2)
    .sort((a, b) => a.quantity - b.quantity);

  const handleRestock = async (id) => {
    setBusyId(id);
    try {
      const updated = await restockVehicle(id);
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Remove ${vehicle.make} ${vehicle.model}?`)) return;
    setBusyId(vehicle.id);
    try {
      await deleteVehicle(vehicle.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {dashboardLoading ? (
        <div className="mb-8">
          <Loader />
        </div>
      ) : dashboardError ? (
        <div className="plate mb-8 p-6 text-center">
          <p className="font-mono text-sm text-soldout">
            Failed to load dashboard analytics. Please try again later.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="plate mb-8 p-6 text-center">
          <p className="font-mono text-sm text-muted">No dashboard data available yet.</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard label="Total Customers" value={summary.total_customers} />
              <SummaryCard label="Total Sales" value={summary.total_sales} />
              <SummaryCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {recentPurchases && recentPurchases.length > 0 && (
              <DashboardSection title="Recent Purchases">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hairline">
                      <Th>Vehicle</Th>
                      <Th>Customer</Th>
                      <Th align="right">Price</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {recentPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <Td>
                          {purchase.vehicle_make} {purchase.vehicle_model}
                        </Td>
                        <Td muted>{purchase.customer_email}</Td>
                        <Td align="right">{formatCurrency(purchase.price)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardSection>
            )}

            {topSelling && topSelling.length > 0 && (
              <DashboardSection title="Top Selling Vehicles">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hairline">
                      <Th>Vehicle</Th>
                      <Th align="right">Units Sold</Th>
                      <Th align="right">Revenue</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {topSelling.map((vehicle) => (
                      <tr key={vehicle.vehicle_id}>
                        <Td>
                          {vehicle.make} {vehicle.model}
                        </Td>
                        <Td align="right">{vehicle.units_sold}</Td>
                        <Td align="right">{formatCurrency(vehicle.revenue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardSection>
            )}
          </div>

          {lowStock && lowStock.length > 0 && (
            <DashboardSection title="Low Stock Vehicles">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-hairline">
                    <Th>Vehicle</Th>
                    <Th align="right">Stock Left</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {lowStock.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <Td>
                        {vehicle.make} {vehicle.model}
                      </Td>
                      <Td align="right">
                        <span
                          className={vehicle.quantity === 0 ? "text-soldout" : "text-amber"}
                        >
                          {vehicle.quantity === 0 ? "Sold out" : vehicle.quantity}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardSection>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {salesByCategory && salesByCategory.length > 0 && (
              <DashboardSection title="Sales by Category">
                <div className="space-y-1">
                  {salesByCategory.map((row) => (
                    <BarRow
                      key={row.category}
                      label={row.category}
                      value={row.units_sold}
                      maxValue={Math.max(...salesByCategory.map((r) => r.units_sold))}
                      displayValue={`${row.units_sold} sold`}
                    />
                  ))}
                </div>
              </DashboardSection>
            )}

            {monthlySales && monthlySales.length > 0 && (
              <DashboardSection title="Monthly Sales">
                <div className="space-y-1">
                  {monthlySales.map((row) => (
                    <BarRow
                      key={row.month}
                      label={row.month}
                      value={Number(row.revenue)}
                      maxValue={Math.max(...monthlySales.map((r) => Number(r.revenue)))}
                      displayValue={formatCurrency(row.revenue)}
                    />
                  ))}
                </div>
              </DashboardSection>
            )}
          </div>
        </>
      )}

      <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
      <h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-tight text-ink">
        Needs Attention
      </h1>

      {loading ? (
        <Loader label="Checking stock levels" />
      ) : attention.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">
            Every listing has healthy stock. Nothing needs restocking right now.
          </p>
        </div>
      ) : (
        <ul className="plate divide-y divide-hairline">
          {attention.map((vehicle) => (
            <li key={vehicle.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-display text-lg font-semibold uppercase leading-none text-ink">
                  {vehicle.make} {vehicle.model}
                </p>
                <p
                  className={`mt-1 font-mono text-xs uppercase tracking-wide ${
                    vehicle.quantity === 0 ? "text-soldout" : "text-amber"
                  }`}
                >
                  {vehicle.quantity === 0 ? "Sold out" : `${vehicle.quantity} left`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === vehicle.id}
                  onClick={() => handleRestock(vehicle.id)}
                  className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                >
                  Restock +1
                </button>
                <button
                  type="button"
                  disabled={busyId === vehicle.id}
                  onClick={() => handleDelete(vehicle)}
                  className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="plate px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function DashboardSection({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-ink">
        {title}
      </h2>
      <div className="plate p-4">{children}</div>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      className={`pb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", muted = false }) {
  return (
    <td
      className={`py-2.5 font-body text-sm ${muted ? "text-muted" : "text-ink"} ${
        align === "right" ? "text-right font-mono text-xs" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function BarRow({ label, value, maxValue, displayValue }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 truncate font-mono text-xs capitalize text-ink">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
        <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-xs text-muted">{displayValue}</span>
    </div>
  );
}
