import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// LOCAL reads .env.local. Set QL_ENV=staging to read .env.staging.local. Vercel sets variables directly.
const envFiles = process.env.QL_ENV === "staging" ? [".env.staging.local"] : [".env.local", ".env"];
config({ path: envFiles, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` must also work where no database is configured, such as a fresh clone.
  datasource: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "" },
});
