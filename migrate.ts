import fs from "fs";
import path from "path";
import pool from "./index";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMigrations(retries = 20, delayMs = 1500) {
  const candidates = [
    path.join(process.cwd(), "src", "db", "migrations"),
    path.join(__dirname, "migrations"),
  ];
  const migrationsDir = candidates.find((dir) => fs.existsSync(dir));
  if (!migrationsDir) {
    throw new Error("No migrations directory found");
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await pool.query(sql);
      }
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(delayMs);
    }
  }
}
