import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { initializeDatabase } from "./database.js";

const envPath = resolve(".env");

if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    "PORT=3001\n",
    { flag: "wx" },
  );
}

config({ path: envPath });

const credentialsPath = resolve("credentials.local.txt");

if (!existsSync(credentialsPath)) {
  const credentials = [
    "ADMIN_EMAIL=admin@example.com",
    `ADMIN_PASSWORD=${randomBytes(24).toString("base64url")}`,
    "USER_EMAIL=user@example.com",
    `USER_PASSWORD=${randomBytes(24).toString("base64url")}`,
    "",
  ].join("\n");
  writeFileSync(credentialsPath, credentials, { flag: "wx", mode: 0o600 });
}

const credentials = Object.fromEntries(
  readFileSync(credentialsPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const requiredCredentialKeys = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "USER_EMAIL",
  "USER_PASSWORD",
];

if (requiredCredentialKeys.some((key) => !credentials[key])) {
  throw new Error(`The credentials file must define: ${requiredCredentialKeys.join(", ")}.`);
}

const db = initializeDatabase();
const insertOrUpdateUser = db.prepare(`
  INSERT INTO users (email, password_hash, role)
  VALUES (?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET
    password_hash = excluded.password_hash,
    role = excluded.role
`);

for (const account of [
  { email: credentials.ADMIN_EMAIL, password: credentials.ADMIN_PASSWORD, role: "admin" },
  { email: credentials.USER_EMAIL, password: credentials.USER_PASSWORD, role: "user" },
]) {
  insertOrUpdateUser.run(account.email.toLowerCase(), await bcrypt.hash(account.password, 12), account.role);
}

db.close();
console.log("Local demo accounts are ready. Credentials are in credentials.local.txt.");
