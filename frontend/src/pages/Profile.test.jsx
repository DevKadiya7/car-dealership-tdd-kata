import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Profile from "./Profile";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();

function renderProfile(user = {}) {
  useAuth.mockReturnValue({
    user: {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      mobile_number: "9876543210",
      avatar_url: "",
      ...user,
    },
    updateProfile: mockUpdateProfile,
    changePassword: mockChangePassword,
  });
  return render(<Profile />);
}

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current profile values", () => {
    renderProfile();

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue("9876543210");
    expect(screen.getByText(/jane\.doe@example\.com/i)).toBeInTheDocument();
  });

  it("shows an avatar preview when an avatar URL is entered", async () => {
    renderProfile();

    expect(screen.queryByAltText(/avatar preview/i)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/avatar/i), "https://example.com/me.jpg");

    expect(screen.getByAltText(/avatar preview/i)).toHaveAttribute(
      "src",
      "https://example.com/me.jpg"
    );
  });

  it("shows a validation error for an invalid mobile number", async () => {
    renderProfile();

    const mobileInput = screen.getByLabelText(/mobile number/i);
    await userEvent.clear(mobileInput);
    await userEvent.type(mobileInput, "abc");
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByText(/enter a valid mobile number/i)).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("saves profile changes and shows a success message", async () => {
    mockUpdateProfile.mockResolvedValue();
    renderProfile();

    const firstName = screen.getByLabelText(/first name/i);
    await userEvent.clear(firstName);
    await userEvent.type(firstName, "Janet");
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: "Janet" })
    );
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
  });

  it("shows a validation error when the new password is weak", async () => {
    renderProfile();

    await userEvent.type(screen.getByLabelText(/current password/i), "OldPassw0rd!");
    await userEvent.type(screen.getByLabelText(/^new password/i), "weak");
    await userEvent.type(screen.getByLabelText(/confirm new password/i), "weak");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("shows a validation error when confirm password does not match", async () => {
    renderProfile();

    await userEvent.type(screen.getByLabelText(/current password/i), "OldPassw0rd!");
    await userEvent.type(screen.getByLabelText(/^new password/i), "NewPassw0rd!");
    await userEvent.type(screen.getByLabelText(/confirm new password/i), "Different1!");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("changes the password and shows a success message", async () => {
    mockChangePassword.mockResolvedValue();
    renderProfile();

    await userEvent.type(screen.getByLabelText(/current password/i), "OldPassw0rd!");
    await userEvent.type(screen.getByLabelText(/^new password/i), "NewPassw0rd!");
    await userEvent.type(screen.getByLabelText(/confirm new password/i), "NewPassw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(mockChangePassword).toHaveBeenCalledWith("OldPassw0rd!", "NewPassw0rd!");
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });

  it("shows a server error message when the current password is incorrect", async () => {
    mockChangePassword.mockRejectedValue({
      response: { data: { detail: "Current password is incorrect" } },
    });
    renderProfile();

    await userEvent.type(screen.getByLabelText(/current password/i), "WrongPassword1");
    await userEvent.type(screen.getByLabelText(/^new password/i), "NewPassw0rd!");
    await userEvent.type(screen.getByLabelText(/confirm new password/i), "NewPassw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument();
  });
});
