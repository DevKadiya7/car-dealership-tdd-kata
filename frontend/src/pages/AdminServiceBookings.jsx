import { useState } from "react";
import { listAllServiceBookings, setServiceBookingStatus } from "../api/serviceBookings";
import { Th, Td } from "../components/Table";
import Loader from "../components/Loader";
import { useAsyncList } from "../hooks/useAsyncList";
import { BOOKING_STATUS_COLORS, SERVICE_TYPE_LABELS } from "../utils/serviceBooking";

export default function AdminServiceBookings() {
  const {
    data: bookings,
    loading,
    errorMsg,
    replaceItem: replaceBooking,
  } = useAsyncList(listAllServiceBookings, "Couldn't load service bookings. Is the backend running?");
  const [busyId, setBusyId] = useState(null);

  const handleSetStatus = async (booking, status) => {
    setBusyId(booking.id);
    try {
      const updated = await setServiceBookingStatus(booking.id, status);
      replaceBooking(updated);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
          Service Bookings
        </h1>
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
          <p className="font-mono text-sm text-muted">No service bookings yet.</p>
        </div>
      ) : (
        <div className="plate max-h-[32rem] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-hairline">
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th>Service Type</Th>
                <Th>Preferred Date</Th>
                <Th align="right">Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>
                    <p className="text-ink">{booking.customer_name}</p>
                    <p className="font-mono text-xs text-muted">{booking.customer_email}</p>
                  </Td>
                  <Td muted>
                    {booking.vehicle_make} {booking.vehicle_model}
                  </Td>
                  <Td muted>{SERVICE_TYPE_LABELS[booking.service_type] || booking.service_type}</Td>
                  <Td muted>{new Date(booking.preferred_date).toLocaleDateString()}</Td>
                  <Td align="right">
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wide ${
                        BOOKING_STATUS_COLORS[booking.status] || "text-muted"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      {booking.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === booking.id}
                            onClick={() => handleSetStatus(booking, "confirmed")}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={busyId === booking.id}
                            onClick={() => handleSetStatus(booking, "cancelled")}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => handleSetStatus(booking, "completed")}
                          className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
