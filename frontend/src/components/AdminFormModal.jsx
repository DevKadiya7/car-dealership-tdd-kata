import { useState, useEffect } from "react";
import Modal from "./Modal";
import { EMAIL_PATTERN, MOBILE_PATTERN, passwordStrength, isPasswordStrong } from "../utils/validation";

const blankForm = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  password: "",
  confirm_password: "",
  is_active: true,
};

export default function AdminFormModal({ admin, onSave, onClose }) {
  const [form, setForm] = useState(blankForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(admin);

  useEffect(() => {
    if (admin) {
      setForm({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email,
        mobile_number: admin.mobile_number || "",
        password: "",
        confirm_password: "",
        is_active: admin.is_active !== false,
      });
    } else {
      setForm(blankForm);
    }
  }, [admin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "First name is required.";
    if (!form.last_name.trim()) errors.last_name = "Last name is required.";
    if (!isEditing) {
      if (!EMAIL_PATTERN.test(form.email)) errors.email = "Enter a valid email address.";
      if (!isPasswordStrong(form.password)) {
        errors.password = "Password must be at least 8 characters and include a letter and a number.";
      }
      if (form.confirm_password !== form.password) {
        errors.confirm_password = "Passwords do not match.";
      }
    }
    if (!MOBILE_PATTERN.test(form.mobile_number)) {
      errors.mobile_number = "Enter a valid mobile number.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      if (isEditing) {
        await onSave({
          first_name: form.first_name,
          last_name: form.last_name,
          mobile_number: form.mobile_number,
        });
      } else {
        await onSave({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          mobile_number: form.mobile_number,
          is_active: form.is_active,
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const strength = passwordStrength(form.password);

  return (
    <Modal onClose={onClose}>
      <div className="plate w-full max-w-md p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            {isEditing ? "Edit Admin" : "Add Admin"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="admin-first-name"
              name="first_name"
              label="First Name"
              value={form.first_name}
              onChange={handleChange}
              error={fieldErrors.first_name}
              required
            />
            <Field
              id="admin-last-name"
              name="last_name"
              label="Last Name"
              value={form.last_name}
              onChange={handleChange}
              error={fieldErrors.last_name}
              required
            />
          </div>

          <Field
            id="admin-email"
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            required
            disabled={isEditing}
          />

          <Field
            id="admin-mobile"
            name="mobile_number"
            label="Mobile Number"
            value={form.mobile_number}
            onChange={handleChange}
            error={fieldErrors.mobile_number}
            required
          />

          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Field
                  id="admin-password"
                  name="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  required
                />
                {form.password && (
                  <p className={`mt-1 font-mono text-xs ${strength.color}`}>
                    Password strength: {strength.label}
                  </p>
                )}
              </div>
              <Field
                id="admin-confirm-password"
                name="confirm_password"
                label="Confirm Password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange}
                error={fieldErrors.confirm_password}
                required
              />
            </div>
          )}

          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-muted">Role</p>
            <p className="rounded-sm border border-hairline bg-raised/50 px-3 py-2 text-sm text-muted">
              Admin
            </p>
          </div>

          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-3.5 w-3.5 accent-amber"
            />
            Active
          </label>

          {error && <p className="font-mono text-xs text-soldout">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Admin"}
          </button>
        </form>
      </div>
    </Modal>
  );
}

function Field({ id, name, label, value, onChange, type = "text", error, required = false, disabled = false }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
        {label}
        {required && <span className="text-soldout"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none disabled:opacity-60"
      />
      {error && <p className="mt-1 font-mono text-xs text-soldout">{error}</p>}
    </div>
  );
}
