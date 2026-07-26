import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminFormModal from "./AdminFormModal";

const existingAdmin = {
  id: "a1",
  email: "john@company.com",
  first_name: "John",
  last_name: "Partner",
  mobile_number: "9876500000",
  is_active: true,
};

async function fillNewAdminForm({ email = "john@company.com", mobile = "9876500000", password = "Admin@123", confirmPassword = password } = {}) {
  await userEvent.type(screen.getByLabelText(/first name/i), "John");
  await userEvent.type(screen.getByLabelText(/last name/i), "Partner");
  await userEvent.type(screen.getByLabelText(/^email/i), email);
  await userEvent.type(screen.getByLabelText(/mobile number/i), mobile);
  await userEvent.type(screen.getByLabelText(/^password/i), password);
  await userEvent.type(screen.getByLabelText(/confirm password/i), confirmPassword);
}

describe("AdminFormModal", () => {
  it("submits a new admin with all fields when adding", async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<AdminFormModal admin={null} onSave={onSave} onClose={() => {}} />);

    await fillNewAdminForm();
    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));

    expect(onSave).toHaveBeenCalledWith({
      email: "john@company.com",
      password: "Admin@123",
      first_name: "John",
      last_name: "Partner",
      mobile_number: "9876500000",
      is_active: true,
    });
  });

  it("shows required indicators next to required fields", () => {
    render(<AdminFormModal admin={null} onSave={() => {}} onClose={() => {}} />);

    const emailLabel = screen.getByText(/^email/i);
    expect(emailLabel.textContent).toMatch(/\*/);
  });

  it("shows a validation error when passwords do not match", async () => {
    const onSave = vi.fn();
    render(<AdminFormModal admin={null} onSave={onSave} onClose={() => {}} />);

    await fillNewAdminForm({ confirmPassword: "Different1" });
    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a validation error for a weak password", async () => {
    const onSave = vi.fn();
    render(<AdminFormModal admin={null} onSave={onSave} onClose={() => {}} />);

    await fillNewAdminForm({ password: "weak", confirmPassword: "weak" });
    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid email", async () => {
    const onSave = vi.fn();
    render(<AdminFormModal admin={null} onSave={onSave} onClose={() => {}} />);

    await fillNewAdminForm({ email: "not-an-email" });
    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a validation error for an invalid mobile number", async () => {
    const onSave = vi.fn();
    render(<AdminFormModal admin={null} onSave={onSave} onClose={() => {}} />);

    await fillNewAdminForm({ mobile: "abc" });
    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));

    expect(await screen.findByText(/enter a valid mobile number/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("pre-fills fields and hides password fields when editing an existing admin", () => {
    render(<AdminFormModal admin={existingAdmin} onSave={() => {}} onClose={() => {}} />);

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Partner");
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue("9876500000");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("john@company.com");
    expect(screen.getByLabelText(/^email/i)).toBeDisabled();
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it("submits updated profile fields without a password when editing", async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<AdminFormModal admin={existingAdmin} onSave={onSave} onClose={() => {}} />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, "Johnny");
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledWith({
      first_name: "Johnny",
      last_name: "Partner",
      mobile_number: "9876500000",
    });
  });
});
