import { config } from "dotenv";

// LOCAL reads .env.local. Set QL_ENV=staging to read .env.staging.local instead.
const files = process.env.QL_ENV === "staging" ? [".env.staging.local"] : [".env.local", ".env"];
config({ path: files, quiet: true });
