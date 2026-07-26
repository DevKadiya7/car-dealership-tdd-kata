// Single source of truth for the loan/EMI math - mirrors
// backend/app/utils/loan.py so the PurchaseModal's real-time loan summary
// always agrees with what the server persists.
export const DOWN_PAYMENT_RATE = 0.3;
export const ANNUAL_INTEREST_RATE = 0.08;
export const ALLOWED_LOAN_DURATIONS = [1, 2, 3, 4, 5, 6, 7];

// Shared between AdminLoans (admin's view of every application) and
// MyLoans (a customer's own applications) - both render the same status
// values, so the color mapping has one home instead of two copies.
export const LOAN_STATUS_COLORS = {
  pending: "text-amber",
  approved: "text-available",
  rejected: "text-soldout",
  completed: "text-muted",
};

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMinimumDownPayment(price) {
  return round2(Number(price) * DOWN_PAYMENT_RATE);
}

export function calculateLoanAmount(price, downPayment) {
  return round2(Number(price) - Number(downPayment));
}

export function calculateMonthlyEMI(principal, annualRate, durationYears) {
  const p = Number(principal);
  if (p === 0) return 0;

  const monthlyRate = annualRate / 12;
  const totalInstallments = durationYears * 12;
  const growth = (1 + monthlyRate) ** totalInstallments;
  const emi = (p * monthlyRate * growth) / (growth - 1);
  return round2(emi);
}

export function calculateInterest(monthlyEmi, durationYears, principal) {
  const totalPaid = monthlyEmi * (durationYears * 12);
  return round2(totalPaid - Number(principal));
}

export function calculateTotalPayable(downPayment, principal, totalInterest) {
  return round2(Number(downPayment) + Number(principal) + Number(totalInterest));
}
