import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listVehicles,
  searchVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
} from "../api/vehicles";
import SearchBar from "../components/SearchBar";
import VehicleCard from "../components/VehicleCard";
import VehicleFormModal from "../components/VehicleFormModal";
import Loader from "../components/Loader";
import { SORT_OPTIONS, sortVehicles } from "../utils/vehicle";

const PAGE_SIZE = 9;

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalVehicle, setModalVehicle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listVehicles();
      setVehicles(data);
    } catch {
      setErrorMsg("Couldn't load the inventory. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSearch = async (filters) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await searchVehicles(filters);
      setVehicles(data);
    } catch {
      setErrorMsg("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = vehicles.length;
    const soldOut = vehicles.filter((v) => v.quantity === 0).length;
    return { total, available: total - soldOut, soldOut };
  }, [vehicles]);

  const sortedVehicles = useMemo(() => sortVehicles(vehicles, sortBy), [vehicles, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sortedVehicles.length / PAGE_SIZE));
  const pageVehicles = sortedVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [vehicles, sortBy]);

  const replaceVehicle = (updated) => {
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handlePurchase = async (vehicle) => {
    const updated = await purchaseVehicle(vehicle.id);
    replaceVehicle(updated);
  };

  const handleRestock = async (vehicle) => {
    const updated = await restockVehicle(vehicle.id);
    replaceVehicle(updated);
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Remove ${vehicle.make} ${vehicle.model} from inventory?`)) return;
    await deleteVehicle(vehicle.id);
    setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
  };

  const handleSave = async (formData) => {
    if (modalVehicle) {
      const updated = await updateVehicle(modalVehicle.id, formData);
      replaceVehicle(updated);
    } else {
      const created = await addVehicle(formData);
      setVehicles((prev) => [created, ...prev]);
    }
    setModalVehicle(null);
    setShowAddModal(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Gauge-style stat strip */}
      <div className="mb-6 grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-sm border border-hairline">
        <Stat label="Total" value={stats.total} />
        <Stat label="Available" value={stats.available} tone="text-available" />
        <Stat label="Sold Out" value={stats.soldOut} tone="text-soldout" />
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
          Showroom Floor
        </h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-sm bg-amber px-4 py-2 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="mb-4">
        <SearchBar onSearch={handleSearch} onReset={loadAll} />
      </div>

      <div className="mb-8 flex justify-end">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="font-mono text-xs uppercase tracking-wide text-muted">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
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
        <Loader label="Fetching inventory" />
      ) : vehicles.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No vehicles match right now. Try a different search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                onPurchase={handlePurchase}
                onRestock={handleRestock}
                onEdit={setModalVehicle}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  aria-current={page === pageNum ? "page" : undefined}
                  className={`rounded-sm border px-3 py-1.5 font-mono text-xs ${
                    page === pageNum
                      ? "border-amber text-amber"
                      : "border-hairline text-muted hover:text-ink"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {(showAddModal || modalVehicle) && (
        <VehicleFormModal
          vehicle={modalVehicle}
          onSave={handleSave}
          onClose={() => {
            setModalVehicle(null);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className={`font-mono text-2xl font-semibold ${tone}`}>{String(value).padStart(2, "0")}</p>
    </div>
  );
}
