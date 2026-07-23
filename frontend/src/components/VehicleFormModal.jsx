import { useState, useEffect } from "react";
import { VEHICLE_CATEGORIES } from "../api/vehicles";
import Modal from "./Modal";

const blankForm = { make: "", model: "", category: "sedan", price: "", quantity: "", image_url: "" };

export default function VehicleFormModal({ vehicle, onSave, onClose }) {
  const [form, setForm] = useState(blankForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageError, setImageError] = useState(false);
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

  useEffect(() => {
    setImageError(false);
  }, [form.image_url]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.make.trim()) errors.make = "Make is required.";
    if (!form.model.trim()) errors.model = "Model is required.";
    if (!(Number(form.price) > 0)) errors.price = "Price must be greater than zero.";
    if (form.quantity === "" || Number(form.quantity) < 0) {
      errors.quantity = "Quantity cannot be negative.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
    <Modal>
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

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label
              htmlFor="vehicle-make"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Make<span className="text-soldout"> *</span>
            </label>
            <input
              id="vehicle-make"
              name="make"
              value={form.make}
              onChange={handleChange}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
            {fieldErrors.make && (
              <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.make}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="vehicle-model"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Model<span className="text-soldout"> *</span>
            </label>
            <input
              id="vehicle-model"
              name="model"
              value={form.model}
              onChange={handleChange}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
            {fieldErrors.model && (
              <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.model}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="vehicle-category"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Category<span className="text-soldout"> *</span>
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
                Price (USD)<span className="text-soldout"> *</span>
              </label>
              <input
                id="vehicle-price"
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                min="0.01"
                step="0.01"
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
              {fieldErrors.price && (
                <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.price}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="vehicle-quantity"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Quantity<span className="text-soldout"> *</span>
              </label>
              <input
                id="vehicle-quantity"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                type="number"
                min="0"
                step="1"
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
              {fieldErrors.quantity && (
                <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.quantity}</p>
              )}
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
            <p className="mt-1 font-mono text-[11px] text-muted/70">
              Paste a direct link to an image. Leave blank to show the fallback placeholder.
            </p>
            {form.image_url &&
              (imageError ? (
                <p className="mt-2 font-mono text-xs text-soldout">
                  Couldn't load that image. Check the URL.
                </p>
              ) : (
                <img
                  src={form.image_url}
                  alt="Image preview"
                  onError={() => setImageError(true)}
                  className="mt-2 h-32 w-full rounded-sm object-cover"
                />
              ))}
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
    </Modal>
  );
}
