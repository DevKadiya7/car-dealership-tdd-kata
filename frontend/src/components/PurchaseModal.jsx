import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { purchaseVehicle } from "../api/vehicles";
import { createLoan } from "../api/loans";
import { formatMoney, calculateTotals } from "../utils/vehicle";
import {
  ALLOWED_LOAN_DURATIONS,
  ANNUAL_INTEREST_RATE,
  calculateInterest,
  calculateLoanAmount,
  calculateMinimumDownPayment,
  calculateMonthlyEMI,
  calculateTotalPayable,
} from "../utils/loan";
import Invoice from "./Invoice";
import Modal from "./Modal";

const PAYMENT_METHODS = [
  { value: "credit", label: "Credit Card" },
  { value: "debit", label: "Debit Card" },
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "Net Banking" },
  { value: "cash", label: "Cash (Demo)" },
];

const UPI_PATTERN = /^[\w.-]+@[\w.-]+$/;
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;

function isExpiryInFuture(expiry) {
  const [month, year] = expiry.split("/").map(Number);
  const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59);
  return expiryDate.getTime() > Date.now();
}

export default function PurchaseModal({ vehicle, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState("form");
  const [paymentType, setPaymentType] = useState("full");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [downPayment, setDownPayment] = useState(() =>
    String(calculateMinimumDownPayment(vehicle.price))
  );
  const [durationYears, setDurationYears] = useState(5);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [purchasedVehicle, setPurchasedVehicle] = useState(null);
  const [loanResult, setLoanResult] = useState(null);

  const totals = calculateTotals(vehicle.price);
  const customerName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email;

  const vehiclePrice = Number(vehicle.price);
  const minimumDownPayment = calculateMinimumDownPayment(vehiclePrice);
  const downPaymentNumber = Number(downPayment) || 0;
  const loanAmount = calculateLoanAmount(vehiclePrice, downPaymentNumber);
  const monthlyEmi = calculateMonthlyEMI(loanAmount, ANNUAL_INTEREST_RATE, durationYears);
  const totalInterest = calculateInterest(monthlyEmi, durationYears, loanAmount);
  const totalPayable = calculateTotalPayable(downPaymentNumber, loanAmount, totalInterest);

  const validate = () => {
    if (paymentType === "loan") {
      const errors = {};
      if (!downPayment) {
        errors.downPayment = "Down payment is required.";
      } else if (downPaymentNumber < minimumDownPayment) {
        errors.downPayment = `Down payment cannot be less than 30% of the vehicle price (${formatMoney(minimumDownPayment)}).`;
      } else if (downPaymentNumber > vehiclePrice) {
        errors.downPayment = "Down payment cannot exceed the vehicle price.";
      }
      return errors;
    }

    const errors = {};
    if (paymentMethod === "credit" || paymentMethod === "debit") {
      const digits = cardNumber.replace(/\s+/g, "");
      if (!digits) errors.cardNumber = "Card number is required.";
      else if (!/^\d{16}$/.test(digits)) errors.cardNumber = "Enter a valid 16-digit card number.";

      if (!cardHolder.trim()) errors.cardHolder = "Card holder name is required.";

      if (!expiry) errors.expiry = "Expiry date is required.";
      else if (!EXPIRY_PATTERN.test(expiry) || !isExpiryInFuture(expiry)) {
        errors.expiry = "Enter a valid, unexpired expiry date (MM/YY).";
      }

      if (!cvv) errors.cvv = "CVV is required.";
      else if (!/^\d{3,4}$/.test(cvv)) errors.cvv = "Enter a valid CVV.";
    } else if (paymentMethod === "upi") {
      if (!upiId.trim()) errors.upiId = "UPI ID is required.";
      else if (!UPI_PATTERN.test(upiId)) errors.upiId = "Enter a valid UPI ID.";
    }
    return errors;
  };

  const paymentMethodLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (paymentType === "loan") {
        const created = await createLoan({
          vehicle_id: vehicle.id,
          down_payment: downPaymentNumber,
          duration_years: durationYears,
        });
        const updated = { ...vehicle, quantity: vehicle.quantity - 1 };
        setLoanResult(created);
        setPurchasedVehicle(updated);
        setStep("success");
        onSuccess(updated);
      } else {
        const updated = await purchaseVehicle(vehicle.id, paymentMethod);
        setPurchasedVehicle(updated);
        setStep("success");
        onSuccess(updated);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (paymentType === "loan"
            ? "The loan application could not be submitted. Please try again."
            : "Payment could not be completed. Please try again.")
      );
      setStep("failure");
    } finally {
      setSubmitting(false);
    }
  };

  const invoiceNumber = `INV-${vehicle.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const invoiceDate = new Date().toLocaleDateString();

  return (
    <Modal onClose={onClose}>
      <div className="plate max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        {step === "form" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                Complete Purchase
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="mb-5 space-y-3 font-mono text-xs">
              <div>
                <p className="uppercase tracking-wide text-muted">Customer</p>
                <p className="text-ink">{customerName}</p>
                <p className="text-muted">{user?.email}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-muted">Vehicle</p>
                <p className="text-ink">
                  {vehicle.make} {vehicle.model}
                </p>
              </div>
              <dl className="space-y-1 border-t border-dashed border-hairline pt-3">
                <div className="flex justify-between">
                  <dt className="text-muted">Price</dt>
                  <dd className="text-ink">{formatMoney(totals.base)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">GST (18%)</dt>
                  <dd className="text-ink">{formatMoney(totals.gst)}</dd>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <dt className="text-ink">Grand Total</dt>
                  <dd className="text-amber">{formatMoney(totals.total)}</dd>
                </div>
              </dl>
            </div>

            <form onSubmit={handleConfirm} noValidate className="space-y-4">
              <fieldset>
                <legend className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                  How would you like to pay?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-sm border border-hairline px-3 py-2 font-mono text-xs text-muted">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === "full"}
                      onChange={() => setPaymentType("full")}
                      className="accent-amber"
                    />
                    Full Payment
                  </label>
                  <label className="flex items-center gap-2 rounded-sm border border-hairline px-3 py-2 font-mono text-xs text-muted">
                    <input
                      type="radio"
                      name="paymentType"
                      value="loan"
                      checked={paymentType === "loan"}
                      onChange={() => setPaymentType("loan")}
                      className="accent-amber"
                    />
                    Loan
                  </label>
                </div>
              </fieldset>

              {paymentType === "full" && (
                <>
                  <fieldset>
                    <legend className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                      Payment Method
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method.value}
                          className="flex items-center gap-2 rounded-sm border border-hairline px-3 py-2 font-mono text-xs text-muted"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={paymentMethod === method.value}
                            onChange={() => setPaymentMethod(method.value)}
                            className="accent-amber"
                          />
                          {method.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {(paymentMethod === "credit" || paymentMethod === "debit") && (
                    <div className="space-y-3">
                      <Field
                        id="pm-card-number"
                        label="Card Number"
                        value={cardNumber}
                        onChange={setCardNumber}
                        placeholder="4111 1111 1111 1111"
                        error={fieldErrors.cardNumber}
                      />
                      <Field
                        id="pm-card-holder"
                        label="Card Holder"
                        value={cardHolder}
                        onChange={setCardHolder}
                        error={fieldErrors.cardHolder}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          id="pm-expiry"
                          label="Expiry"
                          value={expiry}
                          onChange={setExpiry}
                          placeholder="MM/YY"
                          error={fieldErrors.expiry}
                        />
                        <Field
                          id="pm-cvv"
                          label="CVV"
                          value={cvv}
                          onChange={setCvv}
                          type="password"
                          error={fieldErrors.cvv}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <Field
                      id="pm-upi"
                      label="UPI ID"
                      value={upiId}
                      onChange={setUpiId}
                      placeholder="name@bank"
                      error={fieldErrors.upiId}
                    />
                  )}
                </>
              )}

              {paymentType === "loan" && (
                <div className="space-y-3">
                  <Field
                    id="loan-down-payment"
                    label="Down Payment"
                    type="number"
                    value={downPayment}
                    onChange={setDownPayment}
                    error={fieldErrors.downPayment}
                  />

                  <div>
                    <label
                      htmlFor="loan-duration"
                      className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
                    >
                      Loan Duration
                    </label>
                    <select
                      id="loan-duration"
                      value={durationYears}
                      onChange={(e) => setDurationYears(Number(e.target.value))}
                      className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
                    >
                      {ALLOWED_LOAN_DURATIONS.map((years) => (
                        <option key={years} value={years}>
                          {years} {years === 1 ? "Year" : "Years"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <dl className="space-y-1 border-t border-dashed border-hairline pt-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted">Loan Amount</dt>
                      <dd className="text-ink">{formatMoney(loanAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Interest Rate</dt>
                      <dd className="text-ink">{ANNUAL_INTEREST_RATE * 100}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Estimated EMI</dt>
                      <dd className="text-ink">{formatMoney(monthlyEmi)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Total Interest</dt>
                      <dd className="text-ink">{formatMoney(totalInterest)}</dd>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <dt className="text-ink">Total Amount Payable</dt>
                      <dd className="text-amber">{formatMoney(totalPayable)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {error && <p className="font-mono text-xs text-soldout">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
              >
                {submitting
                  ? "Processing…"
                  : paymentType === "loan"
                  ? "Apply for Loan"
                  : "Confirm Purchase"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="text-center">
            <p className="mb-2 font-display text-2xl font-bold uppercase tracking-tight text-available">
              Purchase Successful
            </p>
            <p className="mb-6 font-mono text-xs text-muted">
              {paymentType === "loan"
                ? `Loan application submitted for ${formatMoney(loanAmount)} over ${durationYears} year${
                    durationYears === 1 ? "" : "s"
                  }.`
                : `Paid ${formatMoney(totals.total)} via ${paymentMethodLabel}.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("invoice")}
                className="flex-1 rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
              >
                View Invoice
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-sm border border-hairline px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {step === "invoice" && (
          <Invoice
            vehicle={purchasedVehicle || vehicle}
            customer={{ name: customerName, email: user?.email }}
            totals={totals}
            paymentMethod={paymentType === "loan" ? "Loan" : paymentMethodLabel}
            invoiceNumber={invoiceNumber}
            date={invoiceDate}
            loan={paymentType === "loan" ? loanResult : undefined}
          />
        )}

        {step === "failure" && (
          <div className="text-center">
            <p className="mb-2 font-display text-2xl font-bold uppercase tracking-tight text-soldout">
              Purchase Failed
            </p>
            <p className="mb-6 font-mono text-xs text-soldout">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex-1 rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-sm border border-hairline px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({ id, label, value, onChange, type = "text", placeholder, error }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
      />
      {error && <p className="mt-1 font-mono text-xs text-soldout">{error}</p>}
    </div>
  );
}
