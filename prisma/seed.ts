import { Prisma } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

async function main() {
  const title = await prisma.title.upsert({
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

  const watchedOn = new Date("2024-01-01");
  const existingEntry = await prisma.diaryEntry.findFirst({
    where: {
      titleId: title.id,
      watchedOn,
    },
  });

  if (!existingEntry) {
    await prisma.diaryEntry.create({
      data: {
        titleId: title.id,
        watchedOn,
        rating: new Prisma.Decimal("7.5"),
        liked: true,
        rewatch: false,
        notes: "Seeded diary entry.",
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
