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
