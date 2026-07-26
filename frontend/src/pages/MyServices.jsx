import { useState } from "react";
import { listMyServiceBookings } from "../api/serviceBookings";
import BookServiceModal from "../components/BookServiceModal";
import { Th, Td } from "../components/Table";
import Loader from "../components/Loader";
import { useAsyncList } from "../hooks/useAsyncList";
import { BOOKING_STATUS_COLORS, SERVICE_TYPE_LABELS } from "../utils/serviceBooking";

export default function MyServices() {
  const {
    data: bookings,
    setData: setBookings,
    loading,
    errorMsg,
  } = useAsyncList(listMyServiceBookings, "Couldn't load your service bookings. Is the backend running?");
  const [showBookModal, setShowBookModal] = useState(false);

  const handleBooked = (created) => {
    setBookings((prev) => [...prev, created]);
    setShowBookModal(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Aftersales</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
            My Services
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowBookModal(true)}
          className="rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
        >
          Book Service
        </button>
      </div>

      {errorMsg && (
        <p className="mb-6 rounded-sm border border-soldout/40 bg-soldout/10 px-4 py-3 font-mono text-sm text-soldout">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <Loader label="Loading service bookings" />
      ) : bookings.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">
            No service bookings yet. Book a service for a vehicle you own.
          </p>
        </div>
      ) : (
        <div className="plate max-h-[32rem] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-hairline">
                <Th>Vehicle</Th>
                <Th>Service Type</Th>
                <Th>Preferred Date</Th>
                <Th>Notes</Th>
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>
                    {booking.vehicle_make} {booking.vehicle_model}
                  </Td>
                  <Td muted>{SERVICE_TYPE_LABELS[booking.service_type] || booking.service_type}</Td>
                  <Td muted>{new Date(booking.preferred_date).toLocaleDateString()}</Td>
                  <Td muted>{booking.notes || "—"}</Td>
                  <Td align="right">
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wide ${
                        BOOKING_STATUS_COLORS[booking.status] || "text-muted"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBookModal && (
        <BookServiceModal onClose={() => setShowBookModal(false)} onSuccess={handleBooked} />
      )}
    </div>
  );
}
