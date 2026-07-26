import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AdminAdmins from "./AdminAdmins";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  setAdminStatus,
} from "../api/adminUsers";
import { useAuth } from "../hooks/useAuth";

vi.mock("../api/adminUsers");
vi.mock("../hooks/useAuth");

const currentAdmin = {
  id: "admin-1",
  email: "admin@company.com",
  first_name: "Admin",
  last_name: "One",
  mobile_number: "9000000000",
  created_at: "2026-01-01T10:00:00Z",
  is_active: true,
};

const otherAdmin = {
  id: "admin-2",
  email: "john@company.com",
  first_name: "John",
  last_name: "Partner",
  mobile_number: "9111111111",
  created_at: "2026-02-01T10:00:00Z",
  is_active: true,
};

const inactiveAdmin = {
  id: "admin-3",
  email: "jane@company.com",
  first_name: "Jane",
  last_name: "Second",
  mobile_number: "9222222222",
  created_at: "2026-03-01T10:00:00Z",
  is_active: false,
};

describe("AdminAdmins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: currentAdmin });
  });

  it("shows a loading state while admins load", () => {
    listAdmins.mockImplementation(() => new Promise(() => {}));

    render(<AdminAdmins />);

    expect(screen.getByText(/loading admins/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no admins", async () => {
    listAdmins.mockResolvedValue([]);

    render(<AdminAdmins />);

    expect(await screen.findByText(/no admins/i)).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    listAdmins.mockRejectedValue(new Error("network down"));

    render(<AdminAdmins />);

    expect(await screen.findByText(/couldn't load admins/i)).toBeInTheDocument();
  });

  it("lists admins with email, mobile, registration date, and status", async () => {
    listAdmins.mockResolvedValue([currentAdmin, inactiveAdmin]);

    render(<AdminAdmins />);

    expect(await screen.findByText(/admin@company\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/9000000000/)).toBeInTheDocument();
    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
    expect(screen.getByText(/^inactive$/i)).toBeInTheDocument();
  });

  it("filters admins by search text", async () => {
    listAdmins.mockResolvedValue([currentAdmin, otherAdmin]);

    render(<AdminAdmins />);
    await screen.findByText(/admin@company\.com/i);

    await userEvent.type(screen.getByPlaceholderText(/search admins/i), "john");

    expect(screen.getByText(/john@company\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin@company\.com/i)).not.toBeInTheDocument();
  });

  it("paginates when there are more than one page of admins", async () => {
    const admins = Array.from({ length: 12 }, (_, i) => ({
      ...otherAdmin,
      id: `a${i}`,
      email: `admin${String(i).padStart(2, "0")}@company.com`,
    }));
    listAdmins.mockResolvedValue(admins);

    render(<AdminAdmins />);
    await screen.findByText(/admin00@company\.com/i);

    expect(screen.queryByText(/admin10@company\.com/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/admin10@company\.com/i)).toBeInTheDocument();
  });

  it("opens the Add Admin modal and creates a new admin", async () => {
    listAdmins.mockResolvedValue([currentAdmin]);
    createAdmin.mockResolvedValue({ ...otherAdmin });

    render(<AdminAdmins />);
    await screen.findByText(/admin@company\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /add admin/i }));
    expect(screen.getByRole("heading", { name: /add admin/i })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/first name/i), "John");
    await userEvent.type(screen.getByLabelText(/last name/i), "Partner");
    await userEvent.type(screen.getByLabelText(/^email/i), "john@company.com");
    await userEvent.type(screen.getByLabelText(/mobile number/i), "9111111111");
    await userEvent.type(screen.getByLabelText(/^password/i), "Admin@123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "Admin@123");

    const submitButtons = screen.getAllByRole("button", { name: /add admin/i });
    await userEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() =>
      expect(createAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john@company.com",
          password: "Admin@123",
          first_name: "John",
          last_name: "Partner",
          mobile_number: "9111111111",
        }),
      ),
    );
    expect(await screen.findByText(/john@company\.com/i)).toBeInTheDocument();
  });

  it("opens the Edit modal pre-filled and updates an admin", async () => {
    listAdmins.mockResolvedValue([currentAdmin, otherAdmin]);
    updateAdmin.mockResolvedValue({ ...otherAdmin, first_name: "Johnny" });

    render(<AdminAdmins />);
    await screen.findByText(/john@company\.com/i);

    const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
    await userEvent.click(editButtons[editButtons.length - 1]);

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument();

    const firstNameInput = screen.getByLabelText(/first name/i);
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, "Johnny");
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(updateAdmin).toHaveBeenCalledWith(
        "admin-2",
        expect.objectContaining({ first_name: "Johnny" }),
      ),
    );
    expect(await screen.findByText("Johnny Partner")).toBeInTheDocument();
  });

  it("resets an admin's password", async () => {
    listAdmins.mockResolvedValue([otherAdmin]);
    resetAdminPassword.mockResolvedValue({});

    render(<AdminAdmins />);
    await screen.findByText(/john@company\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await userEvent.type(screen.getByLabelText(/^new password/i), "NewPass123");
    await userEvent.type(screen.getByLabelText(/confirm new password/i), "NewPass123");

    const resetButtons = screen.getAllByRole("button", { name: /reset password/i });
    await userEvent.click(resetButtons[resetButtons.length - 1]);

    await waitFor(() => expect(resetAdminPassword).toHaveBeenCalledWith("admin-2", "NewPass123"));
  });

  it("deactivates another admin", async () => {
    listAdmins.mockResolvedValue([currentAdmin, otherAdmin]);
    setAdminStatus.mockResolvedValue({ ...otherAdmin, is_active: false });

    render(<AdminAdmins />);
    await screen.findByText(/john@company\.com/i);

    const deactivateButtons = screen.getAllByRole("button", { name: /deactivate/i });
    await userEvent.click(deactivateButtons.find((btn) => !btn.disabled));

    await waitFor(() => expect(setAdminStatus).toHaveBeenCalledWith("admin-2", false));
  });

  it("activates a deactivated admin", async () => {
    listAdmins.mockResolvedValue([inactiveAdmin]);
    setAdminStatus.mockResolvedValue({ ...inactiveAdmin, is_active: true });

    render(<AdminAdmins />);
    await screen.findByText(/jane@company\.com/i);

    await userEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() => expect(setAdminStatus).toHaveBeenCalledWith("admin-3", true));
  });

  it("disables the deactivate action for the currently logged-in admin's own row", async () => {
    listAdmins.mockResolvedValue([currentAdmin, otherAdmin]);

    render(<AdminAdmins />);
    await screen.findByText(/admin@company\.com/i);

    const deactivateButtons = screen.getAllByRole("button", { name: /deactivate/i });
    expect(deactivateButtons.some((btn) => btn.disabled)).toBe(true);
  });
});
