import { useState, useMemo } from "react";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  setAdminStatus,
} from "../api/adminUsers";
import { Th, Td } from "../components/Table";
import Pagination from "../components/Pagination";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import AdminFormModal from "../components/AdminFormModal";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePagination } from "../hooks/usePagination";
import { useAuth } from "../hooks/useAuth";
import { isPasswordStrong } from "../utils/validation";

const PAGE_SIZE = 9;

function adminName(admin) {
  return [admin.first_name, admin.last_name].filter(Boolean).join(" ") || admin.email;
}

export default function AdminAdmins() {
  const { user: currentUser } = useAuth();
  const {
    data: admins,
    setData: setAdmins,
    loading,
    errorMsg,
  } = useAsyncList(listAdmins, "Couldn't load admins. Is the backend running?");
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [resettingAdmin, setResettingAdmin] = useState(null);
  const [toast, setToast] = useState("");

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admins;
    return admins.filter((a) =>
      [adminName(a), a.email].some((field) => field.toLowerCase().includes(query)),
    );
  }, [admins, search]);

  const {
    page,
    setPage,
    totalPages,
    pageItems: pageAdmins,
  } = usePagination(filteredAdmins, PAGE_SIZE, [admins, search]);

  const replaceAdmin = (updated) => {
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
  };

  const handleCreate = async (payload) => {
    const created = await createAdmin(payload);
    setAdmins((prev) => [...prev, created]);
    setShowAddModal(false);
    setToast("Admin created successfully.");
  };

  const handleUpdate = async (payload) => {
    const updated = await updateAdmin(editingAdmin.id, payload);
    replaceAdmin(updated);
    setEditingAdmin(null);
    setToast("Admin updated successfully.");
  };

  const handleResetPassword = async (newPassword) => {
    await resetAdminPassword(resettingAdmin.id, newPassword);
    setResettingAdmin(null);
    setToast("Password reset successfully.");
  };

  const handleToggleStatus = async (admin) => {
    setBusyId(admin.id);
    try {
      const updated = await setAdminStatus(admin.id, !admin.is_active);
      replaceAdmin(updated);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">Back Office</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-ink">
            Admin Users
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90"
        >
          Add Admin
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search admins by name or email"
          className="w-full rounded-sm border border-hairline bg-raised px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-amber focus:outline-none sm:max-w-sm"
        />
      </div>

      {toast && (
        <p className="mb-6 rounded-sm border border-available/40 bg-available/10 px-4 py-3 font-mono text-sm text-available">
          {toast}
        </p>
      )}

      {errorMsg && (
        <p className="mb-6 rounded-sm border border-soldout/40 bg-soldout/10 px-4 py-3 font-mono text-sm text-soldout">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <Loader label="Loading admins" />
      ) : filteredAdmins.length === 0 ? (
        <div className="plate p-10 text-center">
          <p className="font-mono text-sm text-muted">No admins match right now.</p>
        </div>
      ) : (
        <>
          <div className="plate max-h-[32rem] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-hairline">
                  <Th>Admin</Th>
                  <Th>Mobile</Th>
                  <Th>Registered</Th>
                  <Th align="right">Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {pageAdmins.map((admin) => {
                  const isSelf = Boolean(currentUser) && admin.id === currentUser.id;
                  const cannotDeactivateSelf = isSelf && admin.is_active;
                  return (
                    <tr key={admin.id}>
                      <Td>
                        <div>
                          <p className="text-ink">
                            {adminName(admin)}
                            {isSelf && (
                              <span className="ml-2 font-mono text-[10px] uppercase text-muted">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-xs text-muted">{admin.email}</p>
                        </div>
                      </Td>
                      <Td muted>{admin.mobile_number || "—"}</Td>
                      <Td muted>
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                      </Td>
                      <Td align="right">
                        <span
                          className={`font-mono text-[11px] uppercase tracking-wide ${
                            admin.is_active ? "text-available" : "text-soldout"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingAdmin(admin)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setResettingAdmin(admin)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-amber hover:text-amber"
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            disabled={busyId === admin.id || cannotDeactivateSelf}
                            title={cannotDeactivateSelf ? "You cannot deactivate your own account" : undefined}
                            onClick={() => handleToggleStatus(admin)}
                            className="rounded-sm border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted transition-colors hover:border-available hover:text-available disabled:opacity-50"
                          >
                            {admin.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {showAddModal && (
        <AdminFormModal admin={null} onSave={handleCreate} onClose={() => setShowAddModal(false)} />
      )}
      {editingAdmin && (
        <AdminFormModal admin={editingAdmin} onSave={handleUpdate} onClose={() => setEditingAdmin(null)} />
      )}
      {resettingAdmin && (
        <ResetPasswordModal
          admin={resettingAdmin}
          onSave={handleResetPassword}
          onClose={() => setResettingAdmin(null)}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({ admin, onSave, onClose }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordStrong(password)) {
      setFieldError("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
    if (confirmPassword !== password) {
      setFieldError("Passwords do not match.");
      return;
    }
    setFieldError("");

    setSaving(true);
    try {
      await onSave(password);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't reset the password. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="plate w-full max-w-sm p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            Reset Password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <p className="mb-4 font-mono text-xs text-muted">{admin.email}</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label
              htmlFor="reset-new-password"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              New Password
            </label>
            <input
              id="reset-new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="reset-confirm-password"
              className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted"
            >
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-sm border border-hairline bg-raised px-3 py-2 text-sm text-ink focus:border-amber focus:outline-none"
            />
          </div>

          {fieldError && <p className="font-mono text-xs text-soldout">{fieldError}</p>}
          {error && <p className="font-mono text-xs text-soldout">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-bg transition-colors hover:bg-amber/90 disabled:opacity-60"
          >
            {saving ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
