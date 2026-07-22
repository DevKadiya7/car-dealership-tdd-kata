import { useState, useEffect } from "react";
import { VEHICLE_CATEGORIES } from "../api/vehicles";

const blankForm = { make: "", model: "", category: "sedan", price: "", quantity: "", image_url: "" };

export default function VehicleFormModal({ vehicle, onSave, onClose }) {
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(vehicle);

  useEffect(() => {
    if (vehicle) {
      setForm({
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        price: String(vehicle.price),
        quantity: String(vehicle.quantity),
        image_url: vehicle.image_url || "",
      });
    } else {
      setForm(blankForm);
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({
        make: form.make,
        model: form.model,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        image_url: form.image_url || undefined,
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="plate w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {isEditing ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="vehicle-make"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Make
            </label>
            <input
              id="vehicle-make"
              name="make"
              value={form.make}
              onChange={handleChange}
              required
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="vehicle-model"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Model
            </label>
            <input
              id="vehicle-model"
              name="model"
              value={form.model}
              onChange={handleChange}
              required
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="vehicle-category"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Category
            </label>
            <select
              id="vehicle-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            >
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="vehicle-price"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Price (USD)
              </label>
              <input
                id="vehicle-price"
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                min="0.01"
                step="0.01"
                required
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="vehicle-quantity"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Quantity
              </label>
              <input
                id="vehicle-quantity"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                type="number"
                min="0"
                step="1"
                required
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="vehicle-image-url"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Image URL
              <span className="normal-case text-muted/60"> (optional)</span>
            </label>
            <input
              id="vehicle-image-url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              type="url"
              placeholder="https://example.com/car.jpg"
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>

          {error && <p className="font-mono text-xs text-soldout">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}
