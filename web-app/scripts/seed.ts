/**
 * Loads the baseline data into an empty database.
 * Usage: npm run db:seed
 * It refuses to run if data already exists. Use `npm run db:reset` to return to the baseline.
 */
import "./load-env";
import { connect, databaseUrl, seedDatabase } from "./seed-lib";

async function main() {
  const prisma = connect(databaseUrl());
  try {
    if ((await prisma.user.count()) > 0) {
      console.error("The database already has data. Run `npm run db:reset` to return to the baseline.");
      process.exitCode = 1;
      return;
    }
    console.log("Seeded:", await seedDatabase(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
