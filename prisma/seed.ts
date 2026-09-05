import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const PLATFORMS = [
  { slug: "nes", name: "Nintendo Entertainment System" },
  { slug: "snes", name: "Super Nintendo" },
  { slug: "n64", name: "Nintendo 64" },
  { slug: "gb", name: "Game Boy" },
  { slug: "gbc", name: "Game Boy Color" },
  { slug: "gba", name: "Game Boy Advance" },
  { slug: "nds", name: "Nintendo DS" },
  { slug: "3ds", name: "Nintendo 3DS" },
  { slug: "switch", name: "Nintendo Switch" },
];

async function main() {
  for (const platform of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: { name: platform.name },
      create: platform,
    });
  }
  console.log(`Seeded ${PLATFORMS.length} platforms.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
