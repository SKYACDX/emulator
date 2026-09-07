import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.emulatornds.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [platforms, hacks, communities, users, hasAppListing] = await Promise.all([
    prisma.platform.findMany({ select: { slug: true } }),
    prisma.hack.findMany({ select: { slug: true, createdAt: true } }),
    prisma.community.findMany({ select: { slug: true } }),
    prisma.user.findMany({ select: { username: true } }),
    prisma.appListing.findFirst({ select: { id: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/platforms`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/files`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/patch`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/communities`, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE_URL}/themes`, changeFrequency: "daily", priority: 0.5 },
    ...(hasAppListing
      ? [{ url: `${BASE_URL}/app`, changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
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

  const communityRoutes: MetadataRoute.Sitemap = communities.map((c) => ({
    url: `${BASE_URL}/communities/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.4,
  }));

  const profileRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${BASE_URL}/u/${u.username}`,
    changeFrequency: "weekly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...platformRoutes, ...hackRoutes, ...communityRoutes, ...profileRoutes];
}
