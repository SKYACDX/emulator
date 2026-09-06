"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "USER" | "MODERATOR" | "ADMIN";

type User = {
  id: string;
  username: string;
  email: string;
  role: Role;
  hackCount: number;
  createdAt: string;
};

const ROLE_LABELS: Record<Role, string> = {
  USER: "Usuario",
  MODERATOR: "Moderador",
  ADMIN: "Admin",
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  USER: "rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400",
  MODERATOR: "rounded bg-sky-900 px-2 py-0.5 text-xs text-sky-300",
  ADMIN: "rounded bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300",
};

export default function AdminUsersTable({
  users,
  currentAdminId,
}: {
  users: User[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(user: User, nextRole: Role) {
    if (nextRole === user.role) return;
    if (
      !confirm(
        `¿Cambiar el rol de "${user.username}" de ${ROLE_LABELS[user.role]} a ${ROLE_LABELS[nextRole]}?`
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(user: User) {
    if (
      !confirm(
        `¿Eliminar la cuenta de "${user.username}" y sus ${user.hackCount} hack(s)? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      {error && <p className="p-3 text-sm text-red-400">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-900 text-neutral-400">
          <tr>
            <th className="px-3 py-2">Usuario</th>
            <th className="px-3 py-2">Correo</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Hacks</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentAdminId;
            return (
              <tr key={user.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 text-white">
                  {user.username}
                  {isSelf && <span className="ml-2 text-xs text-neutral-500">(tú)</span>}
                </td>
                <td className="px-3 py-2 text-neutral-400">{user.email}</td>
                <td className="px-3 py-2">
                  <span className={ROLE_BADGE_CLASS[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-400">{user.hackCount}</td>
                <td className="px-3 py-2 text-right">
                  {!isSelf && (
                    <div className="flex justify-end gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                        disabled={pendingId === user.id}
                        className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-white disabled:opacity-60"
                      >
                        <option value="USER">Usuario</option>
                        <option value="MODERATOR">Moderador</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={pendingId === user.id}
                        className="rounded bg-red-700 px-3 py-1 text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
