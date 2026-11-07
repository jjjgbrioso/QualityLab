/**
 * Deletes ALL data, then reloads the baseline, so automation starts from a known state.
 * Usage: npm run db:reset
 * A remote database is refused unless QL_ALLOW_REMOTE_RESET=yes is set for that one command.
 */
import "./load-env";
import { connect, databaseUrl, seedDatabase, wipeDatabase } from "./seed-lib";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

async function main() {
  const url = databaseUrl();
  const { hostname } = new URL(url);

  if (!LOCAL_HOSTS.has(hostname) && process.env.QL_ALLOW_REMOTE_RESET !== "yes") {
    console.error(`Refusing to reset the remote database at ${hostname}.`);
    console.error("Set QL_ALLOW_REMOTE_RESET=yes for this one command if you intend to do this.");
    process.exitCode = 1;
    return;
  }

  const prisma = connect(url);
  try {
    await wipeDatabase(prisma);
    console.log("Reset to baseline:", await seedDatabase(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});
