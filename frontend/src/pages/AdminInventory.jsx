import { useState, useEffect, useCallback, useMemo } from "react";
import {
  listVehicles,
  searchVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  restockVehicle,
} from "../api/vehicles";
import SearchBar from "../components/SearchBar";
import VehicleFormModal from "../components/VehicleFormModal";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import { Th, Td } from "../components/Table";
import { CATEGORY_LABELS, formatPrice, SORT_OPTIONS, sortVehicles } from "../utils/vehicle";

const PAGE_SIZE = 8;

const STOCK_FILTERS = [
  { value: "", label: "All Stock Levels" },
  { value: "in", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "sold", label: "Sold Out" },
];

function stockStatus(vehicle) {
  if (vehicle.quantity === 0) return "sold";
  if (vehicle.quantity <= 2) return "low";
  return "in";
}

export default function AdminInventory() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [modalVehicle, setModalVehicle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

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

  const filteredVehicles = useMemo(
    () => (stockFilter ? vehicles.filter((v) => stockStatus(v) === stockFilter) : vehicles),
    [vehicles, stockFilter]
  );
  const sortedVehicles = useMemo(
    () => sortVehicles(filteredVehicles, sortBy),
    [filteredVehicles, sortBy]
  );
  const totalPages = Math.max(1, Math.ceil(sortedVehicles.length / PAGE_SIZE));
  const pageVehicles = sortedVehicles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [vehicles, sortBy, stockFilter]);

  const replaceVehicle = (updated) => {
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleRestock = async (id) => {
    setBusyId(id);
    try {
      const updated = await restockVehicle(id);
      replaceVehicle(updated);
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
            Vehicle Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-sm bg-amber px-4 py-2 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
        >
          + Add Vehicle
        </button>
      </div>

      <div className="mb-4">
        <SearchBar onSearch={handleSearch} onReset={load} />
      </div>

      <div className="mb-6 flex flex-wrap justify-end gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-stock-filter" className="font-mono text-xs uppercase tracking-wide text-muted">
            Stock Status
          </label>
          <select
            id="inventory-stock-filter"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
          >
            {STOCK_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-sort-by" className="font-mono text-xs uppercase tracking-wide text-muted">
            Sort by
          </label>
          <select
            id="inventory-sort-by"
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
          <p className="font-mono text-sm text-muted">
            No vehicles match right now. Try a different search or add one.
          </p>
        </div>
      ) : (
        <>
          <div className="plate max-h-[32rem] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-hairline">
                  <Th>Image</Th>
                  <Th>Vehicle</Th>
                  <Th>Category</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Stock</Th>
                  <Th align="right">Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pageVehicles.map((vehicle) => {
                  const outOfStock = vehicle.quantity === 0;
                  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;
                  return (
                    <tr key={vehicle.id}>
                      <Td>
                        <VehicleThumbnail vehicle={vehicle} />
                      </Td>
                      <Td>
                        {vehicle.make} {vehicle.model}
                      </Td>
                      <Td muted>{CATEGORY_LABELS[vehicle.category] || vehicle.category}</Td>
                      <Td align="right">{formatPrice(vehicle.price)}</Td>
                      <Td align="right">{vehicle.quantity}</Td>
                      <Td align="right">
                        <span
                          className={`font-mono text-[11px] uppercase tracking-wide ${
                            outOfStock ? "text-soldout" : lowStock ? "text-amber" : "text-available"
                          }`}
                        >
                          {outOfStock ? "Sold Out" : lowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setModalVehicle(vehicle)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyId === vehicle.id}
                            onClick={() => handleRestock(vehicle.id)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                          >
                            Restock
                          </button>
                          <button
                            type="button"
                            disabled={busyId === vehicle.id}
                            onClick={() => handleDelete(vehicle)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
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

function VehicleThumbnail({ vehicle }) {
  const [imageError, setImageError] = useState(false);

  if (!vehicle.image_url || imageError) {
    return (
      <div className="flex h-10 w-14 items-center justify-center rounded-sm bg-raised font-mono text-[9px] uppercase tracking-wide text-muted">
        No Image
      </div>
    );
  }

  return (
    <img
      src={vehicle.image_url}
      alt={`${vehicle.make} ${vehicle.model}`}
      onError={() => setImageError(true)}
      className="h-10 w-14 rounded-sm object-cover"
    />
  );
}
