import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Vehicles", to: "/admin/vehicles" },
  { label: "Purchase History", to: "/admin/purchases" },
  { label: "Customers", to: "/admin/customers" },
  { label: "Settings", to: "/admin/settings" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-hairline bg-surface lg:w-72 lg:border-r lg:border-b-0">
          <div className="mx-auto flex max-w-6xl flex-col px-6 py-8 lg:max-w-full lg:px-5">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-amber" />
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-tight text-ink">Admin</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Control center</p>
              </div>
            </div>

            <nav className="space-y-1 text-sm font-medium uppercase tracking-[0.2em] text-muted">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-sm px-3 py-3 transition-colors hover:bg-amber/10 ${
                      isActive ? "text-amber" : "text-muted"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-bg px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Admin Panel</p>
                <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight text-ink">Dashboard</h1>
              </div>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
