import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import Register from "./Register";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockRegister = vi.fn();
const mockLogin = vi.fn();

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>Home Landing</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillRequiredFields(overrides = {}) {
  const values = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    mobileNumber: "9876543210",
    password: "Passw0rd!",
    confirmPassword: "Passw0rd!",
    ...overrides,
  };

  if (values.firstName) await userEvent.type(screen.getByLabelText(/first name/i), values.firstName);
  if (values.lastName) await userEvent.type(screen.getByLabelText(/last name/i), values.lastName);
  if (values.email) await userEvent.type(screen.getByLabelText(/^email/i), values.email);
  if (values.mobileNumber)
    await userEvent.type(screen.getByLabelText(/mobile number/i), values.mobileNumber);
  if (values.password) await userEvent.type(screen.getByLabelText(/^password/i), values.password);
  if (values.confirmPassword)
    await userEvent.type(screen.getByLabelText(/confirm password/i), values.confirmPassword);
}

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ register: mockRegister, login: mockLogin });
  });

  it("renders all registration fields and the terms checkbox", () => {
    renderRegister();

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /terms/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^city/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^state/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^country/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/postal code/i)).not.toBeInTheDocument();
  });

  it("shows an error when first name is missing", async () => {
    renderRegister();
    await fillRequiredFields({ firstName: "" });
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows an error when mobile number is invalid", async () => {
    renderRegister();
    await fillRequiredFields({ mobileNumber: "not-a-number" });
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter a valid mobile number/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows an error when password is weak", async () => {
    renderRegister();
    await fillRequiredFields({ password: "weak", confirmPassword: "weak" });
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows an error when confirm password does not match", async () => {
    renderRegister();
    await fillRequiredFields({ confirmPassword: "Different1!" });
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows an error when terms are not accepted", async () => {
    renderRegister();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/must accept the terms/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows a password strength indicator that updates as the user types", async () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/^password/i);
    await userEvent.type(passwordInput, "abc");
    expect(await screen.findByText(/weak/i)).toBeInTheDocument();

    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, "Str0ngPass!23");
    expect(await screen.findByText(/strong/i)).toBeInTheDocument();
  });

  it("submits the full profile and logs in on success", async () => {
    mockRegister.mockResolvedValue();
    mockLogin.mockResolvedValue();

    renderRegister();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockRegister).toHaveBeenCalledWith({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      mobile_number: "9876543210",
      password: "Passw0rd!",
      terms_accepted: true,
    });
    expect(mockLogin).toHaveBeenCalledWith("jane.doe@example.com", "Passw0rd!");
    expect(await screen.findByText(/home landing/i)).toBeInTheDocument();
  });

  it("shows a server error message when the email is already registered", async () => {
    mockRegister.mockRejectedValue({
      response: { data: { detail: "Email 'jane.doe@example.com' is already registered" } },
    });

    renderRegister();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("checkbox", { name: /terms/i }));
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
