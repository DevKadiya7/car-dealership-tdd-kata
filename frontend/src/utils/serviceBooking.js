// Mirrors backend/app/utils/constants.py's SERVICE_TYPES and
// backend/app/schemas/service_booking.py's BOOKING_STATUSES.
export const SERVICE_TYPE_LABELS = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  battery_replacement: "Battery Replacement",
  general_inspection: "General Inspection",
  ac_service: "AC Service",
  wheel_alignment: "Wheel Alignment",
  full_service: "Full Service",
};

// Shared between AdminServiceBookings (every booking) and MyServices (a
// customer's own bookings) - both render the same status values.
export const BOOKING_STATUS_COLORS = {
  pending: "text-amber",
  confirmed: "text-available",
  completed: "text-muted",
  cancelled: "text-soldout",
};

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// A customer's purchase history can contain the same vehicle more than
// once (bought two of the same listing) - service booking only needs
// the distinct vehicles they own, for the vehicle picker.
export function uniqueOwnedVehicles(purchases) {
  const seen = new Map();
  purchases.forEach((purchase) => {
    if (!seen.has(purchase.vehicle_id)) {
      seen.set(purchase.vehicle_id, {
        vehicle_id: purchase.vehicle_id,
        vehicle_make: purchase.vehicle_make,
        vehicle_model: purchase.vehicle_model,
      });
    }
  });
  return Array.from(seen.values());
}
