"use client";

import { useEffect, useRef, useState } from "react";
import { Linkify } from "@/lib/linkify";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: string;
  mine: boolean;
};

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin);
      if (lastTimestamp.current) url.searchParams.set("after", lastTimestamp.current);
      const res = await fetch(url);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (data.messages.length > 0) {
        lastTimestamp.current = data.messages[data.messages.length - 1].createdAt;
        setMessages((prev) => [...prev, ...data.messages]);
      }
    }

    // Initial load replaces state; subsequent polls append only new messages.
    async function initial() {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setMessages(data.messages);
      lastTimestamp.current = data.messages.at(-1)?.createdAt ?? null;
    }

    initial();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: sent.id, body: draft, createdAt: sent.createdAt, sender: "", mine: true },
        ]);
        lastTimestamp.current = sent.createdAt;
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-lg border border-base bg-surface">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
              {!m.mine && <span className="text-muted text-xs">{m.sender}</span>}
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.mine ? "btn-accent" : "bg-page text-base"
                }`}
              >
                <Linkify text={m.body} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <form onSubmit={handleSend} className="border-base flex gap-2 border-t p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={2000}
          className="border-base bg-page flex-1 rounded border px-3 py-2 text-sm text-base"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
