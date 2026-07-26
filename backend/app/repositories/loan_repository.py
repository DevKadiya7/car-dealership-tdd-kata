"""Data access layer for vehicle loans."""
import uuid

from sqlalchemy.orm import Session

from app.models.loan import Loan


class LoanRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **fields) -> Loan:
        loan = Loan(**fields)
        self.db.add(loan)
        self.db.commit()
        self.db.refresh(loan)
        return loan

    def get_by_id(self, loan_id: uuid.UUID) -> Loan | None:
        return self.db.query(Loan).filter(Loan.id == loan_id).first()

    def serialize(self, loan: Loan) -> dict:
        return {
            "id": loan.id,
            "purchase_id": loan.purchase_id,
            "customer_id": loan.customer_id,
            "vehicle_id": loan.vehicle_id,
            "vehicle_price": loan.vehicle_price,
            "down_payment": loan.down_payment,
            "loan_amount": loan.loan_amount,
            "interest_rate": loan.interest_rate,
            "duration_years": loan.duration_years,
            "monthly_emi": loan.monthly_emi,
            "total_interest": loan.total_interest,
            "total_payable": loan.total_payable,
            "status": loan.status,
            "created_at": loan.created_at,
            "vehicle_make": loan.vehicle.make,
            "vehicle_model": loan.vehicle.model,
            "customer_email": loan.customer.email,
            "customer_name": " ".join(
                filter(None, [loan.customer.first_name, loan.customer.last_name])
            )
            or loan.customer.email,
        }

    def list_by_customer(self, customer_id: uuid.UUID) -> list[dict]:
        loans = self.db.query(Loan).filter(Loan.customer_id == customer_id).all()
        return [self.serialize(loan) for loan in loans]

    def list_all(self) -> list[dict]:
        loans = self.db.query(Loan).all()
        return [self.serialize(loan) for loan in loans]

    def update_status(self, loan: Loan, new_status: str) -> Loan:
        loan.status = new_status
        self.db.commit()
        self.db.refresh(loan)
        return loan
