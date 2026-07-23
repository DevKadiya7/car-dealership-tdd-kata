import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function NavLinks({ isAdmin }) {
  return (
    <>
      <Link
        to="/"
        className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
      >
        Inventory
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
        >
          Admin
        </Link>
      )}
    </>
  );
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    if (!window.confirm("Log out of your account?")) return;
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
            Ironyard
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber">Motors</span>
        </Link>

        {user && (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted sm:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>

            <nav className="hidden items-center gap-5 sm:flex">
              <NavLinks isAdmin={isAdmin} />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-ink"
                >
                  {user.email}
                  {isAdmin && (
                    <span className="rounded-sm border border-amber/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber">
                      Admin
                    </span>
                  )}
                </button>

                {profileOpen && (
                  <div className="plate absolute right-0 top-full z-10 mt-2 min-w-[10rem] space-y-1 p-2">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-sm border border-hairline px-3 py-1.5 text-center font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </>
        )}
      </div>

      {user && menuOpen && (
        <nav className="flex flex-col gap-3 border-t border-hairline px-6 py-4 sm:hidden">
          <NavLinks isAdmin={isAdmin} />
          <span className="font-mono text-xs text-muted">{user.email}</span>
          {isAdmin && (
            <span className="w-fit rounded-sm border border-amber/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber">
              Admin
            </span>
          )}
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="w-fit font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-ink"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-sm border border-hairline px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:border-soldout hover:text-soldout"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
