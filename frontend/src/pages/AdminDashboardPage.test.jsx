import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

describe("AdminLayout", () => {
  it("renders the admin sidebar and outlet wrapper", () => {
    render(
      <BrowserRouter>
        <AdminLayout />
      </BrowserRouter>
    );

    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Vehicles/i)).toBeInTheDocument();
    expect(screen.getByText(/Purchase History/i)).toBeInTheDocument();
    expect(screen.getByText(/Customers/i)).toBeInTheDocument();
  });
});
