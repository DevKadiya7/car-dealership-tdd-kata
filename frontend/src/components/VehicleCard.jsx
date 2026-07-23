import { useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_LABELS, formatPrice } from "../utils/vehicle";
import PurchaseModal from "./PurchaseModal";

export default function VehicleCard({ vehicle, isAdmin, onPurchase, onRestock, onEdit, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const outOfStock = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="plate flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      {/* Header strip: category stamp + stock status */}
      <div className="flex items-center justify-between border-b border-hairline bg-raised/60 px-4 py-2">
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

      {vehicle.image_url ? (
        <div className="h-44 w-full overflow-hidden">
          <img
            src={vehicle.image_url}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-raised">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            No Image Available
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <Link to={`/vehicles/${vehicle.id}`} state={{ vehicle }} className="group">
          <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink group-hover:text-amber">
            {vehicle.make}
          </h3>
          <p className="font-display text-xl font-semibold uppercase leading-none text-muted">
            {vehicle.model}
          </p>
          <span className="mt-1 inline-block font-mono text-[11px] uppercase tracking-wide text-amber">
            View Details
          </span>
        </Link>

        {/* Spec rows - the odometer-readout treatment */}
        <dl className="space-y-1.5 border-t border-dashed border-hairline pt-3 font-mono text-sm">
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

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={outOfStock || busy}
            onClick={() => setShowPurchase(true)}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted"
          >
            {outOfStock ? "Sold Out" : "Purchase"}
          </button>

          {isAdmin && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onEdit(vehicle)}
                className="rounded-sm border border-hairline px-2 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => onRestock(vehicle))}
                className="rounded-sm border border-hairline px-2 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available"
              >
                Restock
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => onDelete(vehicle))}
                className="rounded-sm border border-hairline px-2 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showPurchase && (
        <PurchaseModal
          vehicle={vehicle}
          onClose={() => setShowPurchase(false)}
          onSuccess={onPurchase}
        />
      )}
    </article>
  );
}
