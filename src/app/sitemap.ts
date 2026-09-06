import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.emulatornds.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [platforms, hacks] = await Promise.all([
    prisma.platform.findMany({ select: { slug: true } }),
    prisma.hack.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/platforms`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/files`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/patch`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const platformRoutes: MetadataRoute.Sitemap = platforms.map((p) => ({
    url: `${BASE_URL}/platforms/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const hackRoutes: MetadataRoute.Sitemap = hacks.map((h) => ({
    url: `${BASE_URL}/hacks/${h.slug}`,
    lastModified: h.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...platformRoutes, ...hackRoutes];
}
