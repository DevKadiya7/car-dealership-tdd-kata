import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import Navbar from "./Navbar";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockLogout = vi.fn();

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar />
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="*" element={<div>Current Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("renders only the brand when logged out", () => {
    useAuth.mockReturnValue({ user: null, isAdmin: false, logout: mockLogout });

    renderNavbar();

    expect(screen.getByText(/ironyard/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("shows the Inventory link for a logged-in customer, but no Admin link", () => {
    useAuth.mockReturnValue({
      user: { email: "customer@example.com", role: "customer" },
      isAdmin: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByRole("link", { name: /inventory/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^admin$/i })).not.toBeInTheDocument();
  });

  it("shows both Inventory and Admin links for an admin user", () => {
    useAuth.mockReturnValue({
      user: { email: "admin@example.com", role: "admin" },
      isAdmin: true,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByRole("link", { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^admin$/i })).toBeInTheDocument();
  });

  it("toggles the mobile menu open and closed via the hamburger button", async () => {
    useAuth.mockReturnValue({
      user: { email: "customer@example.com", role: "customer" },
      isAdmin: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getAllByRole("link", { name: /inventory/i })).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getAllByRole("link", { name: /inventory/i })).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.getAllByRole("link", { name: /inventory/i })).toHaveLength(1);
  });

  it("opens the profile dropdown and shows the Log out option", async () => {
    useAuth.mockReturnValue({
      user: { email: "customer@example.com", role: "customer" },
      isAdmin: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "customer@example.com" }));
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("asks for confirmation and logs out when confirmed", async () => {
    useAuth.mockReturnValue({
      user: { email: "customer@example.com", role: "customer" },
      isAdmin: false,
      logout: mockLogout,
    });

    renderNavbar();

    await userEvent.click(screen.getByRole("button", { name: "customer@example.com" }));
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
  });

  it("does not log out when the confirmation is cancelled", async () => {
    window.confirm = vi.fn(() => false);
    useAuth.mockReturnValue({
      user: { email: "customer@example.com", role: "customer" },
      isAdmin: false,
      logout: mockLogout,
    });

    renderNavbar();

    await userEvent.click(screen.getByRole("button", { name: "customer@example.com" }));
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
