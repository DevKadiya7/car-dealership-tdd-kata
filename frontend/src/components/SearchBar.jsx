import { useState } from "react";
import { VEHICLE_CATEGORIES } from "../api/vehicles";

const emptyFilters = { make: "", model: "", category: "", min_price: "", max_price: "" };

export default function SearchBar({ onSearch, onReset }) {
  const [filters, setFilters] = useState(emptyFilters);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Strip empty fields so we don't send meaningless query params
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
    onSearch(active);
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="plate grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      <input
        name="make"
        value={filters.make}
        onChange={handleChange}
        placeholder="Make"
        className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none"
      />
      <input
        name="model"
        value={filters.model}
        onChange={handleChange}
        placeholder="Model"
        className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none"
      />
      <select
        name="category"
        value={filters.category}
        onChange={handleChange}
        className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
      >
        <option value="">Any category</option>
        {VEHICLE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c[0].toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>
      <input
        name="min_price"
        value={filters.min_price}
        onChange={handleChange}
        type="number"
        min="0"
        placeholder="Min price"
        className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none"
      />
      <input
        name="max_price"
        value={filters.max_price}
        onChange={handleChange}
        type="number"
        min="0"
        placeholder="Max price"
        className="rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-sm bg-amber px-3 py-2 text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-sm border border-hairline px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
