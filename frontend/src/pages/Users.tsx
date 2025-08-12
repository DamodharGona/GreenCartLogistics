import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import usersService, { type UserEntity } from "../services/usersService";

const Users: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<UserEntity[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserEntity | null>(null);
  const [form, setForm] = useState<{
    username: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER";
  }>({ username: "", email: "", password: "", role: "ADMIN" });

  const canSubmit = useMemo(() => {
    if (editing)
      return (
        form.email.trim().length > 0 && ["ADMIN", "MANAGER"].includes(form.role)
      );
    return (
      form.username.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.password.trim().length >= 6
    );
  }, [form, editing]);

  const load = async () => {
    const res = await usersService.list({ page, limit, search });
    setItems(res.data || []);
    setTotalPages(res.pagination?.totalPages || 1);
  };

  useEffect(() => {
    load();
  }, [page, limit, search]);

  const resetForm = () =>
    setForm({ username: "", email: "", password: "", role: "ADMIN" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (editing) {
      await usersService.update(editing.id, {
        email: form.email,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      await usersService.create(form);
    }
    setShowForm(false);
    setEditing(null);
    resetForm();
    load();
  };

  const onEdit = (u: UserEntity) => {
    setEditing(u);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      role: u.role,
    });
    setShowForm(true);
  };

  const onDeactivate = async (id: number) => {
    if (!confirm("Deactivate this user?")) return;
    await usersService.deactivate(id);
    load();
  };

  if (user?.role !== "ADMIN")
    return <div className="card">Only ADMIN can manage users.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Administer application users</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(true);
          }}
        >
          Add User
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          className="input-field max-w-sm"
          placeholder="Search username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {u.role.toLowerCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        className="text-primary-600 hover:text-primary-900"
                        onClick={() => onEdit(u)}
                      >
                        Edit
                      </button>
                      {u.isActive && (
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => onDeactivate(u.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editing ? "Edit User" : "Add User"}
            </h3>
            <form onSubmit={onSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input-field mt-1"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field mt-1"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  className="input-field mt-1"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as any })
                  }
                >
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editing ? "New Password (optional)" : "Password (min 6)"}
                  {!editing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  className="input-field mt-1"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    !canSubmit ||
                    !form.email.trim() ||
                    (editing
                      ? false
                      : !form.username.trim() || !form.password.trim())
                  }
                >
                  {editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
