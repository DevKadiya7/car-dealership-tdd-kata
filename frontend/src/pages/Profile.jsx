import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { MOBILE_PATTERN, passwordStrength, isPasswordStrong } from "../utils/validation";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarError, setAvatarError] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordServerError, setPasswordServerError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const strength = passwordStrength(newPassword);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    const errors = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!MOBILE_PATTERN.test(mobileNumber)) errors.mobileNumber = "Enter a valid mobile number.";
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        avatar_url: avatarUrl || undefined,
      });
      setProfileMessage("Profile updated successfully.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordServerError("");

    const errors = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!isPasswordStrong(newPassword)) {
      errors.newPassword = "Password must be at least 8 characters and include a letter and a number.";
    }
    if (confirmNewPassword !== newPassword) errors.confirmNewPassword = "Passwords do not match.";
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordServerError(
        err.response?.data?.detail || "Couldn't change your password. Try again."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Account</p>
      <h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-tight text-ink">
        Profile
      </h1>

      <div className="plate mb-8 p-6">
        <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-tight text-ink">
          Edit Profile
        </h2>

        <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
          <div className="flex items-center gap-4">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                onError={() => setAvatarError(true)}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-raised font-mono text-xs uppercase text-muted">
                {(firstName[0] || user?.email?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <label
                htmlFor="profile-avatar"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
              >
                Avatar (Image URL)
                <span className="normal-case text-muted/60"> (optional)</span>
              </label>
              <input
                id="profile-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setAvatarError(false);
                }}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="profile-first-name"
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              error={profileErrors.firstName}
            />
            <Field
              id="profile-last-name"
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              error={profileErrors.lastName}
            />
          </div>

          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-muted">Email</p>
            <p className="rounded-sm border border-hairline bg-raised/50 px-3 py-2 text-sm text-muted">
              {user?.email}
            </p>
          </div>

          <Field
            id="profile-mobile"
            label="Mobile Number"
            value={mobileNumber}
            onChange={setMobileNumber}
            error={profileErrors.mobileNumber}
          />

          {profileMessage && <p className="font-mono text-xs text-available">{profileMessage}</p>}

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="plate p-6">
        <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-tight text-ink">
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} noValidate className="space-y-4">
          <Field
            id="profile-current-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            error={passwordErrors.currentPassword}
          />
          <div>
            <Field
              id="profile-new-password"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              error={passwordErrors.newPassword}
            />
            {newPassword && (
              <p className={`mt-1 font-mono text-xs ${strength.color}`}>
                Password strength: {strength.label}
              </p>
            )}
          </div>
          <Field
            id="profile-confirm-new-password"
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            error={passwordErrors.confirmNewPassword}
          />

          {passwordServerError && (
            <p className="font-mono text-xs text-soldout">{passwordServerError}</p>
          )}
          {passwordMessage && <p className="font-mono text-xs text-available">{passwordMessage}</p>}

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {savingPassword ? "Updating…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", error }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
      />
      {error && <p className="mt-1 font-mono text-xs text-soldout">{error}</p>}
    </div>
  );
}
