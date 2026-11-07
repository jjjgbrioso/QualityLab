/**
 * Runs the LOCAL PostgreSQL server from the embedded-postgres dev dependency.
 * It needs no system install or admin rights. Data lives in web-app/.local-db.
 *
 * Usage: npm run db:start   (leave it running; Ctrl+C stops the server)
 */
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.LOCAL_DB_PORT ?? 5433);
const USER = "qualitylab";
// Local-only credential, published in .env.example. The server accepts local connections only.
const PASSWORD = "qualitylab_local";
const DATABASES = ["qualitylab_local", "qualitylab_test"];

async function main() {
  const databaseDir = path.resolve(process.cwd(), ".local-db");
  const server = new EmbeddedPostgres({
    databaseDir,
    port: PORT,
    user: USER,
    password: PASSWORD,
    authMethod: "scram-sha-256",
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
    onLog: () => {},
    onError: (message) => console.error(message),
  });

  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
    console.log(`Creating a new local cluster in ${databaseDir}`);
    await server.initialise();
  }

  await server.start();

  for (const name of DATABASES) {
    try {
      await server.createDatabase(name);
      console.log(`Created database ${name}`);
    } catch (error) {
      if (!String(error).includes("already exists")) throw error;
    }
  }

  console.log(`PostgreSQL is ready on 127.0.0.1:${PORT}. Press Ctrl+C to stop.`);

  const shutdown = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  setInterval(() => {}, 60_000);
}

main().catch((error) => {
  console.error("Could not start local PostgreSQL:", error);
  process.exit(1);
});
