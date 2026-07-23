import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listVehicles,
  searchVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  restockVehicle,
} from "../api/vehicles";
import SearchBar from "../components/SearchBar";
import VehicleCard from "../components/VehicleCard";
import VehicleFormModal from "../components/VehicleFormModal";
import Pagination from "../components/Pagination";
import { SORT_OPTIONS, sortVehicles, CATEGORY_LABELS, formatPrice } from "../utils/vehicle";

const PAGE_SIZE = 9;

const FEATURED_COUNT = 3;

export default function Dashboard() {
  const { isAdmin, user } = useAuth();
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

  const featuredVehicles = useMemo(
    () => vehicles.filter((v) => v.quantity > 0).slice(0, FEATURED_COUNT),
    [vehicles]
  );

  const sortedVehicles = useMemo(() => sortVehicles(vehicles, sortBy), [vehicles, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sortedVehicles.length / PAGE_SIZE));
  const pageVehicles = sortedVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [vehicles, sortBy]);

  const replaceVehicle = (updated) => {
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
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
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
        </p>
        <p className="font-mono text-sm text-muted">
          Explore today&rsquo;s best picks from the showroom floor.
        </p>
      </div>

      {!loading && featuredVehicles.length > 0 && (
        <div className="mb-8" data-testid="featured-vehicles">
          <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-ink">
            Featured Vehicles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featuredVehicles.map((vehicle) => (
              <FeaturedCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      )}

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
        <div
          role="status"
          aria-label="Loading vehicles"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No vehicles match right now. Try a different search.</p>
        </div>
      ) : (
        <>
          <div
            data-testid="vehicle-grid"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pageVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                onPurchase={replaceVehicle}
                onRestock={handleRestock}
                onEdit={setModalVehicle}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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

function FeaturedCard({ vehicle }) {
  return (
    <div className="plate flex items-center gap-3 overflow-hidden p-3 transition-transform hover:-translate-y-0.5">
      {vehicle.image_url ? (
        <img
          src={vehicle.image_url}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="h-14 w-20 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-sm bg-raised font-mono text-[9px] uppercase text-muted">
          No Image
        </div>
      )}
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wide text-amber">
          {CATEGORY_LABELS[vehicle.category] || vehicle.category}
        </p>
        <h4 className="truncate font-display text-lg font-bold uppercase leading-none tracking-tight text-ink">
          {vehicle.make} {vehicle.model}
        </h4>
        <p className="font-mono text-xs text-muted">{formatPrice(vehicle.price)}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="plate animate-pulse overflow-hidden">
      <div className="h-44 w-full bg-raised" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-2/3 rounded-sm bg-raised" />
        <div className="h-4 w-1/3 rounded-sm bg-raised" />
        <div className="h-10 w-full rounded-sm bg-raised" />
      </div>
    </div>
  );
}
