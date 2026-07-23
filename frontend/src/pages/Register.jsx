import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { EMAIL_PATTERN, MOBILE_PATTERN, passwordStrength, isPasswordStrong } from "../utils/validation";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
    if (!MOBILE_PATTERN.test(mobileNumber)) errors.mobileNumber = "Enter a valid mobile number.";
    if (!isPasswordStrong(password)) {
      errors.password = "Password must be at least 8 characters and include a letter and a number.";
    }
    if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
    if (!termsAccepted) errors.termsAccepted = "You must accept the Terms & Conditions.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        mobile_number: mobileNumber,
        password,
        terms_accepted: termsAccepted,
      });
      // Registration doesn't return a token, so log in right after
      // to get one and land the user straight on the dashboard.
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try a different email.");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(password);

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10">
      <div className="plate w-full max-w-lg p-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">New Account</p>
        <h1 className="mb-6 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink">
          Register
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="reg-first-name"
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              error={fieldErrors.firstName}
            />
            <Field
              id="reg-last-name"
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              error={fieldErrors.lastName}
            />
          </div>

          <Field
            id="reg-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={fieldErrors.email}
          />

          <Field
            id="reg-mobile"
            label="Mobile Number"
            value={mobileNumber}
            onChange={setMobileNumber}
            error={fieldErrors.mobileNumber}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Field
                id="reg-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
              />
              {password && (
                <p className={`mt-1 font-mono text-xs ${strength.color}`}>
                  Password strength: {strength.label}
                </p>
              )}
            </div>
            <Field
              id="reg-confirm-password"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={fieldErrors.confirmPassword}
            />
          </div>

          <div>
            <label className="flex items-start gap-2 font-mono text-xs text-muted">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-amber"
              />
              I agree to the Terms &amp; Conditions
            </label>
            {fieldErrors.termsAccepted && (
              <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.termsAccepted}</p>
            )}
          </div>

          {error && <p className="font-mono text-xs text-soldout">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", error, optional = false }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted">
        {label}
        {optional && <span className="normal-case text-muted/60"> (optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
      />
      {error && <p className="mt-1 font-mono text-xs text-soldout">{error}</p>}
    </div>
  );
}
