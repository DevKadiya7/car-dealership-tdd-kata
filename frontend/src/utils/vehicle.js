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
