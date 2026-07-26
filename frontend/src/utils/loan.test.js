import {
  ALLOWED_LOAN_DURATIONS,
  ANNUAL_INTEREST_RATE,
  DOWN_PAYMENT_RATE,
  calculateInterest,
  calculateLoanAmount,
  calculateMinimumDownPayment,
  calculateMonthlyEMI,
  calculateTotalPayable,
} from "./loan";

describe("loan calculation constants", () => {
  it("matches the business rules", () => {
    expect(DOWN_PAYMENT_RATE).toBe(0.3);
    expect(ANNUAL_INTEREST_RATE).toBe(0.08);
    expect(ALLOWED_LOAN_DURATIONS).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("calculateMinimumDownPayment", () => {
  it("is 30% of the vehicle price", () => {
    expect(calculateMinimumDownPayment(1000000)).toBe(300000);
  });

  it("rounds to 2 decimals", () => {
    expect(calculateMinimumDownPayment(999999)).toBe(299999.7);
  });
});

describe("calculateLoanAmount", () => {
  it("is price minus down payment", () => {
    expect(calculateLoanAmount(1000000, 300000)).toBe(700000);
  });

  it("is zero when down payment equals price", () => {
    expect(calculateLoanAmount(1000000, 1000000)).toBe(0);
  });
});

describe("calculateMonthlyEMI", () => {
  it.each([
    [1, 60891.9],
    [5, 14193.48],
    [7, 10910.35],
  ])("computes the reducing-balance EMI for %i year(s)", (years, expected) => {
    expect(calculateMonthlyEMI(700000, ANNUAL_INTEREST_RATE, years)).toBeCloseTo(expected, 2);
  });

  it("is zero for zero principal", () => {
    expect(calculateMonthlyEMI(0, ANNUAL_INTEREST_RATE, 5)).toBe(0);
  });
});

describe("calculateInterest", () => {
  it("is total paid minus principal", () => {
    const emi = calculateMonthlyEMI(700000, ANNUAL_INTEREST_RATE, 5);
    const interest = calculateInterest(emi, 5, 700000);
    expect(interest).toBeCloseTo(151608.8, 1);
  });
});

describe("calculateTotalPayable", () => {
  it("adds down payment, principal, and total interest", () => {
    const downPayment = 300000;
    const principal = 700000;
    const emi = calculateMonthlyEMI(principal, ANNUAL_INTEREST_RATE, 5);
    const interest = calculateInterest(emi, 5, principal);

    expect(calculateTotalPayable(downPayment, principal, interest)).toBeCloseTo(
      downPayment + principal + interest,
      2
    );
  });
});
