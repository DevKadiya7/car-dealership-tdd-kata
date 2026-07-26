import { useState } from "react";
import { listMyPurchases } from "../api/purchases";
import { createServiceBooking } from "../api/serviceBookings";
import { useAsyncList } from "../hooks/useAsyncList";
import { SERVICE_TYPE_LABELS, todayIsoDate, uniqueOwnedVehicles } from "../utils/serviceBooking";
import Loader from "./Loader";
import Modal from "./Modal";

export default function BookServiceModal({ onClose, onSuccess }) {
  const { data: purchases, loading } = useAsyncList(
    listMyPurchases,
    "Couldn't load your vehicles. Is the backend running?"
  );
  const ownedVehicles = uniqueOwnedVehicles(purchases);

  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("oil_change");
  const [preferredDate, setPreferredDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  const selectedVehicleId = vehicleId || ownedVehicles[0]?.vehicle_id || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (preferredDate < todayIsoDate()) {
      setFieldError("Preferred date cannot be in the past.");
      return;
    }
    setFieldError("");

    setSubmitting(true);
    try {
      const created = await createServiceBooking({
        vehicle_id: selectedVehicleId,
        service_type: serviceType,
        preferred_date: preferredDate,
        notes: notes || null,
      });
      setBooked(true);
      onSuccess(created);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Couldn't book the service appointment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="plate w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            Book Service
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        {loading ? (
          <Loader label="Loading your vehicles" />
        ) : booked ? (
          <div className="text-center">
            <p className="mb-2 font-display text-xl font-bold uppercase tracking-tight text-available">
              Request Submitted
            </p>
            <p className="mb-6 font-mono text-xs text-muted">
              We'll confirm your appointment shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
            >
              Close
            </button>
          </div>
        ) : ownedVehicles.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            You haven't purchased any vehicles yet - service booking is only available for
            vehicles you own.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label
                htmlFor="booking-vehicle"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Vehicle
              </label>
              <select
                id="booking-vehicle"
                value={selectedVehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              >
                {ownedVehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.vehicle_make} {vehicle.vehicle_model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="booking-service-type"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Service Type
              </label>
              <select
                id="booking-service-type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              >
                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="booking-date"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Preferred Date
              </label>
              <input
                id="booking-date"
                type="date"
                min={todayIsoDate()}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
              {fieldError && <p className="mt-1 font-mono text-xs text-soldout">{fieldError}</p>}
            </div>

            <div>
              <label
                htmlFor="booking-notes"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Notes
              </label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>

            {error && <p className="font-mono text-xs text-soldout">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
            >
              {submitting ? "Booking…" : "Book Service"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
