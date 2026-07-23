export const PAYMENT_METHOD_LABELS = {
  credit: "Credit Card",
  debit: "Debit Card",
  upi: "UPI",
  netbanking: "Net Banking",
  cash: "Cash (Demo)",
  unknown: "Unknown",
};

export const STATUS_COLORS = {
  completed: "text-available",
  pending: "text-amber",
  cancelled: "text-soldout",
};

export const ORDER_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-desc", label: "Highest Amount" },
  { value: "amount-asc", label: "Lowest Amount" },
];

export function invoiceNumberFor(purchase) {
  return `INV-${purchase.id.slice(0, 8).toUpperCase()}`;
}

export function sortPurchases(purchases, sortBy) {
  const sorted = [...purchases];
  switch (sortBy) {
    case "oldest":
      return sorted.sort((a, b) => new Date(a.purchased_at) - new Date(b.purchased_at));
    case "amount-desc":
      return sorted.sort((a, b) => Number(b.total_price) - Number(a.total_price));
    case "amount-asc":
      return sorted.sort((a, b) => Number(a.total_price) - Number(b.total_price));
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at));
  }
}
