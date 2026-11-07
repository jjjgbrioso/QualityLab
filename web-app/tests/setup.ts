import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

// Integration tests must never touch the database used for manual work.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

process.env.JWT_SECRET ??= "unit-test-secret-that-is-at-least-32-characters";
process.env.DUPLICATE_WINDOW_SECONDS = "30";
