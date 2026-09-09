"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  createdAt: string;
};

export default function AdminContactTable({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    setPendingId(id);
    try {
      await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (messages.length === 0) {
    return <p className="text-muted">No hay mensajes de contacto.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div key={m.id} className="border-base bg-surface rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="font-medium text-base">{m.subject}</span>
              <p className="text-muted text-xs">
                {m.name} &lt;
                <a href={`mailto:${m.email}`} className="hover-text-accent underline">
                  {m.email}
                </a>
                &gt; · {new Date(m.createdAt).toLocaleString("es")}
              </p>
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              disabled={pendingId === m.id}
              className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
          <p className="text-base mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
        </div>
      ))}
    </div>
  );
}
