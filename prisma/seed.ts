import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.title.upsert({
    where: {
      tmdbId_mediaType: {
        tmdbId: 1,
        mediaType: "movie",
      },
    },
    update: {
      title: "Example Film",
      originalTitle: "Example Film",
      overview: "Seeded example title.",
      releaseDate: new Date("2020-01-01"),
      genres: ["Drama"],
      runtimeMinutes: 120,
    },
    create: {
      tmdbId: 1,
      mediaType: "movie",
      title: "Example Film",
      originalTitle: "Example Film",
      overview: "Seeded example title.",
      releaseDate: new Date("2020-01-01"),
      genres: ["Drama"],
      runtimeMinutes: 120,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
