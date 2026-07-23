export const CATEGORY_LABELS = {
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  coupe: "Coupe",
  convertible: "Convertible",
  hatchback: "Hatchback",
  van: "Van",
  electric: "Electric",
};

export function formatPrice(price) {
  return Number(price).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "make-asc", label: "Make (A to Z)" },
  { value: "make-desc", label: "Make (Z to A)" },
  { value: "category", label: "Category" },
  { value: "stock", label: "Stock Availability" },
];

export const GST_RATE = 0.18;

export function formatMoney(amount) {
  return Number(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function calculateTotals(price) {
  const base = Number(price);
  const gst = Math.round(base * GST_RATE * 100) / 100;
  const total = Math.round((base + gst) * 100) / 100;
  return { base, gst, total };
}

export function sortVehicles(vehicles, sortBy) {
  const sorted = [...vehicles];
  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case "price-desc":
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case "make-asc":
      return sorted.sort((a, b) => a.make.localeCompare(b.make));
    case "make-desc":
      return sorted.sort((a, b) => b.make.localeCompare(a.make));
    case "category":
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    case "stock":
      return sorted.sort((a, b) => b.quantity - a.quantity);
    default:
      return sorted;
  }
}
