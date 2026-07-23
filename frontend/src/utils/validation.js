export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_PATTERN = /^\+?\d{10,15}$/;

export function passwordStrength(password) {
  const labels = ["Weak", "Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "text-soldout",
    "text-soldout",
    "text-soldout",
    "text-amber",
    "text-amber",
    "text-available",
  ];
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return { label: labels[score], color: colors[score] };
}

export function isPasswordStrong(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}
