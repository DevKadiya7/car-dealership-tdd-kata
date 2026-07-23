import { createPortal } from "react-dom";

// Renders into document.body via a portal so `fixed` positioning is always
// relative to the viewport - if this were mounted inline, any ancestor with
// an active `transform` (e.g. VehicleCard's hover lift) would become the
// containing block instead, trapping the overlay inside that ancestor.
export default function Modal({ children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {children}
    </div>,
    document.body
  );
}
