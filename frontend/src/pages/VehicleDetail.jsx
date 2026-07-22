import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getVehicle, purchaseVehicle } from "../api/vehicles";
import Loader from "../components/Loader";

const CATEGORY_LABELS = {
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  coupe: "Coupe",
  convertible: "Convertible",
  hatchback: "Hatchback",
  van: "Van",
  electric: "Electric",
};

function formatPrice(price) {
  return Number(price).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function VehicleDetail() {
  const { id } = useParams();
  const location = useLocation();

  const [vehicle, setVehicle] = useState(location.state?.vehicle || null);
  const [loading, setLoading] = useState(!location.state?.vehicle);
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getVehicle(id);
      setVehicle(data);
    } catch {
      setErrorMsg("Couldn't load this vehicle. It may no longer be available.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!location.state?.vehicle) {
      load();
    }
  }, [load, location.state]);

  const handlePurchase = async () => {
    setBusy(true);
    try {
      const updated = await purchaseVehicle(id);
      setVehicle(updated);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Loader label="Fetching vehicle" />
      </div>
    );
  }

  if (errorMsg || !vehicle) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-soldout">{errorMsg || "Vehicle not found."}</p>
        </div>
      </div>
    );
  }

  const outOfStock = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        to="/"
        className="mb-6 inline-block font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
      >
        ← Back to Inventory
      </Link>

      <div className="plate overflow-hidden">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-80 w-full object-cover"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center bg-raised">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              No Image Available
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              {CATEGORY_LABELS[vehicle.category] || vehicle.category}
            </span>
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.15em] ${
                outOfStock ? "text-soldout" : lowStock ? "text-amber" : "text-available"
              }`}
            >
              {outOfStock ? "Sold Out" : lowStock ? "Low Stock" : "In Stock"}
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink">
            {vehicle.make}
          </h1>
          <p className="font-display text-2xl font-semibold uppercase leading-none text-muted">
            {vehicle.model}
          </p>

          <dl className="mt-6 space-y-2 border-t border-dashed border-hairline pt-4 font-mono text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Price</dt>
              <dd className="text-lg font-semibold text-ink">{formatPrice(vehicle.price)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">In Stock</dt>
              <dd className="text-ink">{String(vehicle.quantity).padStart(2, "0")} units</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Stock No.</dt>
              <dd className="text-muted">{vehicle.id.slice(0, 8).toUpperCase()}</dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={outOfStock || busy}
            onClick={handlePurchase}
            className="mt-6 w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted"
          >
            {outOfStock ? "Sold Out" : busy ? "Working…" : "Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
