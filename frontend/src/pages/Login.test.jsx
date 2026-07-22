import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import Login from "./Login";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockLogin = vi.fn();

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Home Landing</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it("shows a validation error for an invalid email and does not call login", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/^password/i), "somepassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows a validation error when password is empty and does not call login", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("has a Remember Me checkbox that is unchecked by default and toggles on click", async () => {
    renderLogin();

    const checkbox = screen.getByRole("checkbox", { name: /remember me/i });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("shows a Forgot Password placeholder", () => {
    renderLogin();

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it("shows a loading state and disables the submit button while signing in", async () => {
    let resolveLogin;
    mockLogin.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    const loadingButton = await screen.findByRole("button", { name: /signing in/i });
    expect(loadingButton).toBeDisabled();

    resolveLogin();
  });

  it("logs in with valid credentials and navigates to the home page", async () => {
    mockLogin.mockResolvedValue();

    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    expect(await screen.findByText(/home landing/i)).toBeInTheDocument();
  });
});
