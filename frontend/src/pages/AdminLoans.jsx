import { listAllLoans, setLoanStatus } from "../api/loans";
import { Th, Td } from "../components/Table";
import Loader from "../components/Loader";
import { useAsyncList } from "../hooks/useAsyncList";
import { formatMoney } from "../utils/vehicle";
import { LOAN_STATUS_COLORS } from "../utils/loan";

export default function AdminLoans() {
  const {
    data: loans,
    loading,
    errorMsg,
    replaceItem: replaceLoan,
    busyId,
    runBusyAction,
  } = useAsyncList(listAllLoans, "Couldn't load loans. Is the backend running?");

  const handleSetStatus = (loan, status) =>
    runBusyAction(loan.id, async () => {
      const updated = await setLoanStatus(loan.id, status);
      replaceLoan(updated);
    });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
          Loan Management
        </h1>
      </div>

      {errorMsg && (
        <p className="mb-6 rounded-sm border border-soldout/40 bg-soldout/10 px-4 py-3 font-mono text-sm text-soldout">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <Loader label="Loading loans" />
      ) : loans.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No loan applications yet.</p>
        </div>
      ) : (
        <div className="plate max-h-[32rem] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-hairline">
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th align="right">Loan Amount</Th>
                <Th align="right">Duration</Th>
                <Th align="right">EMI</Th>
                <Th align="right">Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <Td>
                    <p className="text-ink">{loan.customer_name}</p>
                    <p className="font-mono text-xs text-muted">{loan.customer_email}</p>
                  </Td>
                  <Td muted>
                    {loan.vehicle_make} {loan.vehicle_model}
                  </Td>
                  <Td align="right">{formatMoney(loan.loan_amount)}</Td>
                  <Td align="right">{loan.duration_years} Years</Td>
                  <Td align="right">{formatMoney(loan.monthly_emi)}</Td>
                  <Td align="right">
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wide ${
                        LOAN_STATUS_COLORS[loan.status] || "text-muted"
                      }`}
                    >
                      {loan.status}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      {loan.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === loan.id}
                            onClick={() => handleSetStatus(loan, "approved")}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === loan.id}
                            onClick={() => handleSetStatus(loan, "rejected")}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {loan.status === "approved" && (
                        <button
                          type="button"
                          disabled={busyId === loan.id}
                          onClick={() => handleSetStatus(loan, "completed")}
                          className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
