export function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", muted = false }) {
  return (
    <td
      className={`px-4 py-3 font-body text-sm ${muted ? "text-muted" : "text-ink"} ${
        align === "right" ? "text-right font-mono text-xs" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}
