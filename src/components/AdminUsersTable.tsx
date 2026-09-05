"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  hackCount: number;
  createdAt: string;
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

  async function handleToggleRole(user: User) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      !confirm(
        nextRole === "ADMIN"
          ? `¿Hacer administrador a "${user.username}"?`
          : `¿Quitarle el rol de administrador a "${user.username}"?`
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
                  <span
                    className={
                      user.role === "ADMIN"
                        ? "rounded bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
                    }
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-400">{user.hackCount}</td>
                <td className="px-3 py-2 text-right">
                  {!isSelf && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={pendingId === user.id}
                        className="rounded bg-neutral-800 px-3 py-1 text-white hover:bg-neutral-700 disabled:opacity-60"
                      >
                        {user.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                      </button>
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
