import { listMyLoans } from "../api/loans";
import { Th, Td } from "../components/Table";
import Loader from "../components/Loader";
import { useAsyncList } from "../hooks/useAsyncList";
import { formatMoney } from "../utils/vehicle";
import { LOAN_STATUS_COLORS } from "../utils/loan";

function remainingBalance(loan) {
  if (loan.status === "completed") return 0;
  return Number(loan.loan_amount) + Number(loan.total_interest);
}

export default function MyLoans() {
  const { data: loans, loading, errorMsg } = useAsyncList(
    listMyLoans,
    "Couldn't load your loans. Is the backend running?"
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Financing</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">My Loans</h1>
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
          <p className="font-mono text-sm text-muted">No loans yet. Finance a vehicle to see it here.</p>
        </div>
      ) : (
        <div className="plate max-h-[32rem] overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-hairline">
                <Th>Vehicle</Th>
                <Th align="right">Loan Amount</Th>
                <Th align="right">Remaining</Th>
                <Th align="right">EMI</Th>
                <Th align="right">Status</Th>
                <Th align="right">Purchase Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <Td>
                    {loan.vehicle_make} {loan.vehicle_model}
                  </Td>
                  <Td align="right">{formatMoney(loan.loan_amount)}</Td>
                  <Td align="right">{formatMoney(remainingBalance(loan))}</Td>
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
                  <Td align="right" muted>
                    {new Date(loan.created_at).toLocaleDateString()}
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
