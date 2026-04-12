"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ManagedUserType = "STUDENT" | "ADMINISTRATION";

interface ManagedRole {
  id: number;
  name: string;
}

interface ManagedPermission {
  id: number;
  key: string;
  label: string;
  description: string | null;
}

interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: ManagedPermission[];
}

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  userType: ManagedUserType;
  roles: ManagedRole[];
  permissionKeys: string[];
  isActive: boolean;
  hasProfile: boolean;
  createdAt: string;
}

interface ApiPayload {
  users?: ManagedUser[];
  updated?: ManagedUser;
  roles?: RoleWithPermissions[];
  permissions?: ManagedPermission[];
  currentUserId?: number;
  currentUserPermissions?: string[];
  error?: string;
}

interface EditDraft {
  name: string;
  email: string;
  userType: ManagedUserType;
}

interface PasswordResetDraft {
  password: string;
  confirmPassword: string;
}

interface AdministrationUserManagerProps {
  className?: string;
  tab: "users" | "rbac";
}

export function AdministrationUserManager({ className, tab }: AdministrationUserManagerProps) {
  const USERS_PER_PAGE = 8;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<ManagedPermission[]>([]);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [passwordResetDraft, setPasswordResetDraft] = useState<PasswordResetDraft | null>(null);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  const [creatingRole, setCreatingRole] = useState(false);
  const [roleDraftName, setRoleDraftName] = useState("");
  const [roleDraftDescription, setRoleDraftDescription] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [rolePermissionDraft, setRolePermissionDraft] = useState<number[]>([]);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const canAccessUsers = currentUserPermissions.includes("users.access");
  const canEditUsers = currentUserPermissions.includes("users.edit");
  const canToggleUsers = currentUserPermissions.includes("users.toggle-active");
  const canResetPasswords = currentUserPermissions.includes("users.reset-password");
  const canCreateRoles = currentUserPermissions.includes("roles.create");
  const canUpdateRoles = currentUserPermissions.includes("roles.update");
  const canAssignRoles = currentUserPermissions.includes("roles.assign");
  const canAccessRbac = canCreateRoles || canUpdateRoles || canAssignRoles;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const sortedUsers = useMemo(
    () => users.slice().sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [users],
  );

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) {
      return sortedUsers;
    }

    return sortedUsers.filter((user) => {
      const searchable = [
        String(user.id),
        user.name,
        user.email,
        user.userType,
        user.isActive ? "enabled" : "disabled",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [normalizedSearch, sortedUsers]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId) ?? null,
    [editingRoleId, roles],
  );

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, page, USERS_PER_PAGE]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const endpoint = tab === "users" ? "/api/administration/users" : "/api/administration/roles";

      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        setFeedback(payload.error ?? "Unable to load users.");
        setUsers([]);
        setRoles([]);
        setPermissions([]);
        return;
      }

      setUsers(payload.users ?? []);
      setRoles(payload.roles ?? []);
      setPermissions(payload.permissions ?? []);
      setCurrentUserId(typeof payload.currentUserId === "number" ? payload.currentUserId : null);
      setCurrentUserPermissions(payload.currentUserPermissions ?? []);
      setPage(1);
    } catch {
      setFeedback("Unable to load users.");
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setCurrentUserId(null);
      setCurrentUserPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function patchUserInState(updatedUser: ManagedUser) {
    setUsers((current) => current.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
  }

  async function runUserAction(input: Record<string, unknown>): Promise<ManagedUser | null> {
    const targetId = typeof input.userId === "number" ? input.userId : null;
    if (!targetId) {
      return null;
    }

    setBusyUserId(targetId);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        setFeedback(payload.error ?? "Request failed.");
        return null;
      }

      if (payload.updated) {
        patchUserInState(payload.updated);
      }

      setFeedback("Update completed.");
      return payload.updated ?? null;
    } catch {
      setFeedback("Request failed.");
      return null;
    } finally {
      setBusyUserId(null);
    }
  }

  async function createRole() {
    if (!canCreateRoles) {
      setFeedback("You do not have permission to create roles.");
      return;
    }

    const name = roleDraftName.trim();
    const description = roleDraftDescription.trim();

    if (!name) {
      setFeedback("Role name is required.");
      return;
    }

    setCreatingRole(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/administration/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok) {
        setFeedback(payload.error ?? "Unable to create role.");
        return;
      }

      setRoleDraftName("");
      setRoleDraftDescription("");
      setRoles(payload.roles ?? []);
      setFeedback("Role created.");
      void loadUsers();
    } catch {
      setFeedback("Unable to create role.");
    } finally {
      setCreatingRole(false);
    }
  }

  function startRoleEdit(role: RoleWithPermissions) {
    setEditingRoleId(role.id);
    setRolePermissionDraft(role.permissions.map((permission) => permission.id));
  }

  function cancelRoleEdit() {
    if (savingRolePermissions) {
      return;
    }

    setEditingRoleId(null);
    setRolePermissionDraft([]);
  }

  function toggleRolePermissionDraft(permissionId: number) {
    setRolePermissionDraft((current) =>
      current.includes(permissionId)
        ? current.filter((entry) => entry !== permissionId)
        : [...current, permissionId],
    );
  }

  async function saveRolePermissions() {
    if (!editingRole) {
      return;
    }

    if (!canUpdateRoles) {
      setFeedback("You do not have permission to update role permissions.");
      return;
    }

    const currentPermissions = new Set(editingRole.permissions.map((permission) => permission.id));
    const draftedPermissions = new Set(rolePermissionDraft);

    const toAttach = Array.from(draftedPermissions).filter((permissionId) => !currentPermissions.has(permissionId));
    const toDetach = Array.from(currentPermissions).filter((permissionId) => !draftedPermissions.has(permissionId));

    if (toAttach.length === 0 && toDetach.length === 0) {
      setFeedback("No permission changes to save.");
      cancelRoleEdit();
      return;
    }

    setSavingRolePermissions(true);
    setUpdatingRoleId(editingRole.id);
    setFeedback(null);

    try {
      const mutations = [
        ...toAttach.map((permissionId) => ({ action: "attachPermission" as const, permissionId })),
        ...toDetach.map((permissionId) => ({ action: "detachPermission" as const, permissionId })),
      ];

      for (const mutation of mutations) {
        const response = await fetch("/api/administration/roles", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: mutation.action,
            roleId: editingRole.id,
            permissionId: mutation.permissionId,
          }),
        });
        const payload = (await response.json()) as ApiPayload;

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to update role permissions.");
          return;
        }

        setRoles(payload.roles ?? []);
      }

      setFeedback("Role permissions updated.");
      setEditingRoleId(null);
      setRolePermissionDraft([]);
      void loadUsers();
    } catch {
      setFeedback("Unable to update role permissions.");
    } finally {
      setSavingRolePermissions(false);
      setUpdatingRoleId(null);
    }
  }

  function startEdit(user: ManagedUser) {
    setResettingUserId(null);
    setPasswordResetDraft(null);
    setPasswordResetError(null);

    setEditingUserId(user.id);
    setEditDraft({
      name: user.name,
      email: user.email,
      userType: user.userType,
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditDraft(null);
  }

  function startResetPassword(userId: number) {
    setEditingUserId(null);
    setEditDraft(null);
    setResettingUserId(userId);
    setPasswordResetDraft({
      password: "",
      confirmPassword: "",
    });
    setPasswordResetError(null);
  }

  function cancelResetPassword() {
    setResettingUserId(null);
    setPasswordResetDraft(null);
    setPasswordResetError(null);
  }

  async function submitEdit(userId: number) {
    if (!editDraft) {
      return;
    }

    const updated = await runUserAction({
      userId,
      action: "edit",
      name: editDraft.name,
      email: editDraft.email,
      userType: editDraft.userType,
    });

    if (!updated) {
      return;
    }

    cancelEdit();
    void loadUsers();
  }

  async function submitPasswordReset() {
    if (resettingUserId === null || !passwordResetDraft) {
      return;
    }

    const password = passwordResetDraft.password.trim();
    const confirmPassword = passwordResetDraft.confirmPassword.trim();

    if (!password || !confirmPassword) {
      setPasswordResetError("Please enter and confirm the password.");
      return;
    }

    if (password.length < 8) {
      setPasswordResetError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordResetError("Passwords do not match.");
      return;
    }

    setPasswordResetError(null);

    const updated = await runUserAction({
      userId: resettingUserId,
      action: "resetPassword",
      newPassword: password,
    });

    if (updated) {
      cancelResetPassword();
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setFeedback(`Copied ${email} to clipboard.`);
    } catch {
      setFeedback("Unable to copy email.");
    }
  }

  return (
    <>
      <section className={`${className ?? "mt-12"} border-[2px] border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg uppercase tracking-[0.08em] text-[var(--color-text)]">
              {tab === "users" ? "Users" : "RBAC"}
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {tab === "users"
                ? "Manage user accounts and assign a role to each administration user."
                : "Create roles and manage the permissions attached to each role."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            Refresh
          </button>
        </div>

        {tab === "rbac" ? (
          !canAccessRbac ? (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">You do not have permission to access RBAC.</p>
          ) : (
          <div className="mt-4 grid gap-4 border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <h3 className="font-heading text-sm uppercase tracking-[0.08em] text-[var(--color-text)]">Roles</h3>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                type="text"
                value={roleDraftName}
                onChange={(event) => setRoleDraftName(event.target.value)}
                placeholder="Role name (e.g. PROJECT_REVIEWER)"
                className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
              <input
                type="text"
                value={roleDraftDescription}
                onChange={(event) => setRoleDraftDescription(event.target.value)}
                placeholder="Role description (optional)"
                className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="button"
                disabled={creatingRole || !canCreateRoles}
                onClick={() => void createRole()}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {creatingRole ? "Creating..." : "Create role"}
              </button>
            </div>

            {loading ? (
              <RbacTableSkeleton />
            ) : roles.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No roles found.</p>
            ) : (
              <div className="overflow-x-auto border border-[var(--color-border)] bg-white">
                <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                  <thead className="bg-[var(--color-bg)]">
                    <tr>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Role</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Description</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Permissions</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => {
                      const isUpdating = updatingRoleId === role.id;

                      return (
                        <tr key={role.id} className="border-t border-[var(--color-border)] align-top">
                          <td className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)]">
                            {role.name}
                          </td>
                          <td className="px-3 py-2 text-[var(--color-text-muted)]">{role.description || "No description."}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                              {role.isSystem ? "System role" : "Custom role"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-[var(--color-text-muted)]">{role.permissions.length} attached</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              disabled={!canUpdateRoles || isUpdating || savingRolePermissions}
                              onClick={() => startRoleEdit(role)}
                              className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
                            >
                              {isUpdating ? "Saving..." : "Edit"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!canCreateRoles || !canUpdateRoles ? (
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                Your account permissions may limit role creation or role permission updates.
              </p>
            ) : null}
          </div>
          )
        ) : null}

        {tab === "users" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="grid min-w-[240px] max-w-md flex-1 gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Search users</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              placeholder="Search by id, name, email, type, or status"
            />
          </label>

          {normalizedSearch ? (
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {filteredUsers.length} result{filteredUsers.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        ) : null}

        {feedback ? (
          <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {feedback}
          </p>
        ) : null}

        {tab === "users" ? (!canAccessUsers ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">You do not have permission to access users.</p>
        ) : loading ? (
          <UserTableSkeleton />
        ) : sortedUsers.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">No users found.</p>
        ) : filteredUsers.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">No users match your search.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
              <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
                <thead className="bg-[var(--color-bg)]">
                  <tr>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">ID</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Profile</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Created</th>
                    <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                    const isBusy = busyUserId === user.id;

                    return (
                      <tr key={user.id} className="border-t border-[var(--color-border)] align-top">
                        <td className="px-3 py-2 text-[var(--color-text-muted)]">{user.id}</td>
                        <td className="px-3 py-2 text-[var(--color-text)]">{user.name}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => void copyEmail(user.email)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            title="Click to copy email"
                          >
                            {user.email}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                              user.userType === "ADMINISTRATION"
                                ? "border-sky-200 bg-sky-50 text-sky-700"
                                : "border-violet-200 bg-violet-50 text-violet-700"
                            }`}
                          >
                            {user.userType}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                              user.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {user.isActive ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                              user.hasProfile
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {user.hasProfile ? "Complete" : "Missing"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[var(--color-text-muted)]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!canEditUsers || isBusy || busyUserId !== null || resettingUserId !== null}
                              onClick={() => startEdit(user)}
                              className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={!canToggleUsers || isBusy || (user.isActive && user.id === currentUserId)}
                              onClick={() =>
                                void runUserAction({
                                  userId: user.id,
                                  action: user.isActive ? "disable" : "enable",
                                })
                              }
                              className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
                            >
                              {user.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              disabled={!canResetPasswords || isBusy || busyUserId !== null || editingUserId !== null}
                              onClick={() => startResetPassword(user.id)}
                              className="border border-[var(--color-accent)] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50"
                            >
                              Reset password
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageCount > 1 ? (
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pb-1 pt-4">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  ← Prev
                </button>

                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Page {page} of {pageCount}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={page === pageCount}
                  className="border border-[var(--color-border-strong)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            ) : null}

            {!canAccessUsers ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                Your account cannot access the users table.
              </p>
            ) : null}

            {canAccessUsers && (!canEditUsers || !canToggleUsers || !canResetPasswords) ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                Some user actions are hidden or disabled based on your permissions.
              </p>
            ) : null}
          </>
        )) : null}
      </section>

      {tab === "users" && editingUserId !== null && editDraft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && busyUserId !== editingUserId) {
              cancelEdit();
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-xl border-[2px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base uppercase tracking-[0.08em] text-[var(--color-text)]">Edit user</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Update name, email, and type.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</span>
                <input
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            name: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Name"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</span>
                <input
                  value={editDraft.email}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            email: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Email"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</span>
                <select
                  value={editDraft.userType}
                  onChange={(e) =>
                    setEditDraft((current) =>
                      current
                        ? {
                            ...current,
                            userType: e.target.value as ManagedUserType,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMINISTRATION">ADMINISTRATION</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitEdit(editingUserId)}
                disabled={busyUserId === editingUserId}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {busyUserId === editingUserId ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "rbac" && editingRole ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              cancelRoleEdit();
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-3xl border-[2px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base uppercase tracking-[0.08em] text-[var(--color-text)]">Edit role permissions</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {editingRole.name} {editingRole.isSystem ? "(System role)" : "(Custom role)"}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelRoleEdit}
                disabled={savingRolePermissions}
                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] overflow-y-auto border border-[var(--color-border)] bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => {
                  const isAttached = rolePermissionDraft.includes(permission.id);

                  return (
                    <label key={permission.id} className="flex items-start gap-2 border border-[var(--color-border)] px-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={() => toggleRolePermissionDraft(permission.id)}
                        disabled={savingRolePermissions || !canUpdateRoles}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="grid gap-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                          {permission.key}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">{permission.description || permission.label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {!canUpdateRoles ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                Your account cannot update role permissions.
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelRoleEdit}
                disabled={savingRolePermissions}
                className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveRolePermissions()}
                disabled={savingRolePermissions || !canUpdateRoles}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {savingRolePermissions ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "users" && resettingUserId !== null && passwordResetDraft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && busyUserId !== resettingUserId) {
              cancelResetPassword();
            }
          }}
          role="presentation"
        >
          <div className="w-full max-w-lg border-[2px] border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-base uppercase tracking-[0.08em] text-[var(--color-text)]">Reset password</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  Enter and confirm a new password.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelResetPassword}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">New password</span>
                <input
                  type="password"
                  value={passwordResetDraft.password}
                  onChange={(e) =>
                    setPasswordResetDraft((current) =>
                      current
                        ? {
                            ...current,
                            password: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Minimum 8 characters"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Confirm password</span>
                <input
                  type="password"
                  value={passwordResetDraft.confirmPassword}
                  onChange={(e) =>
                    setPasswordResetDraft((current) =>
                      current
                        ? {
                            ...current,
                            confirmPassword: e.target.value,
                          }
                        : current,
                    )
                  }
                  className="w-full border border-[var(--color-border)] bg-white px-2.5 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                  placeholder="Re-enter password"
                />
              </label>
            </div>

            {passwordResetError ? (
              <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                {passwordResetError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelResetPassword}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-border-strong)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitPasswordReset()}
                disabled={busyUserId === resettingUserId}
                className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)] disabled:opacity-40"
              >
                {busyUserId === resettingUserId ? "Saving..." : "Confirm reset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserTableSkeleton() {
  const rows = Array.from({ length: 7 });

  return (
    <div className="mt-4 overflow-x-auto border border-[var(--color-border)]">
      <table className="w-full min-w-[1300px] border-collapse text-left text-sm">
        <thead className="bg-[var(--color-bg)]">
          <tr>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">ID</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Name</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Email</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Status</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Profile</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Created</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, index) => (
            <tr key={index} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-3"><div className="h-3 w-6 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-28 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-40 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-24 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-16 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-20 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-20 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-36 animate-pulse bg-[var(--color-border)]" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RbacTableSkeleton() {
  const rows = Array.from({ length: 5 });

  return (
    <div className="overflow-x-auto border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="bg-[var(--color-bg)]">
          <tr>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Role</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Description</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Type</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Permissions</th>
            <th className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, index) => (
            <tr key={index} className="border-t border-[var(--color-border)] align-top">
              <td className="px-3 py-3"><div className="h-3 w-28 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-40 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-24 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-20 animate-pulse bg-[var(--color-border)]" /></td>
              <td className="px-3 py-3"><div className="h-3 w-14 animate-pulse bg-[var(--color-border)]" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
