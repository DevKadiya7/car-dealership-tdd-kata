import {
  DISCOUNT_RATE,
  GST_RATE,
  calculateDiscountAmount,
  calculateDiscountedPrice,
  calculateGst,
  calculateGrandTotal,
  calculatePricingBreakdown,
} from "./pricing";

describe("pricing rates", () => {
  it("match the Today Only promotional rules", () => {
    expect(DISCOUNT_RATE).toBe(0.1);
    expect(GST_RATE).toBe(0.18);
  });
});

describe("calculateDiscountAmount", () => {
  it("is 10% of the price", () => {
    expect(calculateDiscountAmount("20000.00")).toBe(2000);
  });
});

describe("calculateDiscountedPrice", () => {
  it("is price minus the 10% discount", () => {
    expect(calculateDiscountedPrice("20000.00")).toBe(18000);
  });
});

describe("calculateGst", () => {
  it("is 18% of the amount", () => {
    expect(calculateGst("18000.00")).toBe(3240);
  });
});

describe("calculateGrandTotal", () => {
  it("is amount plus GST", () => {
    expect(calculateGrandTotal("18000.00")).toBe(21240);
  });
});

describe("calculatePricingBreakdown", () => {
  it("returns the original price, 10% discount, subtotal, GST, and grand total", () => {
    expect(calculatePricingBreakdown("20000.00")).toEqual({
      originalPrice: 20000,
      discountAmount: 2000,
      subtotal: 18000,
      gst: 3240,
      grandTotal: 21240,
    });
  });
});
