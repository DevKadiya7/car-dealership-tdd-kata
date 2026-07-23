export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-4 w-4 rounded-full border-2 border-hairline border-t-amber animate-spin" />
      <span className="font-mono text-sm tracking-wide">{label}…</span>
    </div>
  );
}
