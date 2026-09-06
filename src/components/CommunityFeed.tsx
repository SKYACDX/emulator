"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Post = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: { username: string };
  canDelete: boolean;
};

export default function CommunityFeed({
  slug,
  isMember,
  posts,
}: {
  slug: string;
  isMember: boolean;
  posts: Post[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setLoading(true);
    try {
      let imageKey: string | undefined;
      if (image) {
        const presignRes = await fetch(`/api/communities/${slug}/posts/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: image.name, contentType: image.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          setError(presignData.error ?? "No se pudo subir la imagen");
          return;
        }
        await fetch(presignData.uploadUrl, {
          method: "PUT",
          body: image,
          headers: { "Content-Type": image.type },
        });
        imageKey = presignData.storedName;
      }

      const res = await fetch(`/api/communities/${slug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, imageKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar");
        return;
      }
      setBody("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    await fetch(`/api/communities/${slug}/posts/${postId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {isMember && (
        <form onSubmit={handleSubmit} className="border-base bg-surface flex flex-col gap-2 rounded-lg border p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Comparte un avance, progreso o algo con la comunidad..."
            rows={3}
            maxLength={2000}
            className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-muted text-sm"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id} className="border-base bg-surface rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-sm font-medium">{post.author.username}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs">
                  {new Date(post.createdAt).toLocaleString("es")}
                </span>
                {post.canDelete && (
                  <button onClick={() => handleDelete(post.id)} className="text-xs text-red-400 hover:text-red-300">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            <p className="text-base mt-2 whitespace-pre-wrap text-sm">{post.body}</p>
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="" className="border-base mt-2 max-h-96 rounded border object-contain" />
            )}
          </li>
        ))}
        {posts.length === 0 && (
          <p className="text-muted text-sm">Nadie ha publicado nada todavía.</p>
        )}
      </ul>
    </div>
  );
}
