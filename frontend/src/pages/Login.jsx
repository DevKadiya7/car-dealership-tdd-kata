import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { EMAIL_PATTERN } from "../utils/validation";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errors = {};
    if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }
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
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4">
      <div className="plate w-full max-w-sm p-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Service Entrance</p>
        <h1 className="mb-6 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink">
          Sign In
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
            />
            {fieldErrors.email && (
              <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Password
            </label>
            <div className="flex gap-2">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink focus:border-amber focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="shrink-0 rounded-sm border border-hairline px-3 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 font-mono text-xs text-soldout">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 accent-amber"
              />
              Remember me
            </label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-mono text-xs text-amber hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {error && <p className="font-mono text-xs text-soldout">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-xs text-muted">
          New here?{" "}
          <Link to="/register" className="text-amber hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
