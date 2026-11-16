import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { initializeDatabase, mapVacancy } from "./database.js";

config();

const app = express();
const db = initializeDatabase();
const serverDirectory = fileURLToPath(new URL(".", import.meta.url));
const projectDirectory = resolve(serverDirectory, "..");
const distDirectory = resolve(projectDirectory, "dist");
const sessionCookieName = "arbeitflow_session";
const sessionDurationMs = 1000 * 60 * 60 * 24;
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function getSessionUser(request) {
  const token = request.cookies[sessionCookieName];

  if (typeof token !== "string" || token.length < 32) {
    return null;
  }

  const session = db
    .prepare(`
      SELECT users.id, users.email, users.role, sessions.token_hash, sessions.expires_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `)
    .get(hashSessionToken(token), Date.now());

  return session
    ? { id: session.id, email: session.email, role: session.role }
    : null;
}

function requireAuth(request, response, next) {
  const user = getSessionUser(request);

  if (!user) {
    response.status(401).json({ error: "Увійдіть, щоб продовжити." });
    return;
  }

  request.user = user;
  next();
}

function requireAdmin(request, response, next) {
  if (request.user.role !== "admin") {
    response.status(403).json({ error: "Ця дія доступна лише адміністратору." });
    return;
  }

  next();
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parseText(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function parseStringList(value, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  const items = value.map((item) => parseText(item, maxLength));

  if (items.some((item) => item === null)) {
    return null;
  }

  return [...new Set(items)];
}

function validateVacancy(body) {
  if (!isRecord(body)) {
    return { error: "Надішліть дані вакансії." };
  }

  const title = parseText(body.title, 120);
  const company = parseText(body.company, 120);
  const location = parseText(body.location, 120);
  const schedule = parseText(body.schedule, 80);
  const salary = parseText(body.salary, 80);
  const description = parseText(body.description, 2000);
  const stack = parseStringList(body.stack, 15, 50);
  const requirements = parseStringList(body.requirements, 20, 200);
  const initialsInput =
    body.initials === undefined || body.initials === "" ? "" : parseText(body.initials, 4);

  if (!title || !company || !location || !schedule || !salary || !description) {
    return { error: "Заповніть усі текстові поля вакансії." };
  }

  if (!stack || stack.length === 0 || !requirements || initialsInput === null) {
    return { error: "Перевірте список технологій, вимог та ініціали компанії." };
  }

  const initials =
    initialsInput ||
    company
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toUpperCase();

  return {
    value: { title, company, initials, location, schedule, salary, stack, description, requirements },
  };
}

function setSessionCookie(response, token) {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: sessionDurationMs,
    path: "/",
  });
}

function clearSessionCookie(response) {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({ error: "Забагато спроб входу. Спробуйте пізніше." });
  },
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/auth/me", (request, response) => {
  response.json({ user: getSessionUser(request) });
});

app.post("/api/auth/login", loginLimiter, async (request, response) => {
  const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";

  if (!email || email.length > 254 || !password || password.length > 200) {
    response.status(400).json({ error: "Вкажіть коректну електронну адресу та пароль." });
    return;
  }

  const account = db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?").get(email);

  if (!account || !(await bcrypt.compare(password, account.password_hash))) {
    response.status(401).json({ error: "Неправильна електронна адреса або пароль." });
    return;
  }

  const previousToken = request.cookies[sessionCookieName];

  if (typeof previousToken === "string") {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(previousToken));
  }

  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashSessionToken(token), account.id, Date.now() + sessionDurationMs);
  setSessionCookie(response, token);
  response.json({ user: { id: account.id, email: account.email, role: account.role } });
});

app.post("/api/auth/logout", (request, response) => {
  const token = request.cookies[sessionCookieName];

  if (typeof token === "string") {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSessionToken(token));
  }

  clearSessionCookie(response);
  response.json({ ok: true });
});

app.get("/api/vacancies", (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim().toLocaleLowerCase("uk") : "";
  const location = typeof request.query.location === "string" ? request.query.location.trim().toLocaleLowerCase("uk") : "";
  const stack = typeof request.query.stack === "string" ? request.query.stack.trim().toLocaleLowerCase("uk") : "";
  const rows = db.prepare("SELECT * FROM vacancies ORDER BY created_at DESC, id DESC").all();
  const vacancies = rows.map(mapVacancy).filter((vacancy) => {
    const matchesSearch =
      !search ||
      [vacancy.title, vacancy.company, ...vacancy.stack]
        .join(" ")
        .toLocaleLowerCase("uk")
        .includes(search);
    const matchesLocation =
      !location ||
      [vacancy.location, vacancy.schedule, vacancy.schedule === "Віддалено" ? "remote" : ""]
        .join(" ")
        .toLocaleLowerCase("uk")
        .includes(location);
    const matchesStack = !stack || vacancy.stack.some((item) => item.toLocaleLowerCase("uk") === stack);

    return matchesSearch && matchesLocation && matchesStack;
  });

  response.json({ vacancies });
});

app.get("/api/vacancies/:id", (request, response) => {
  const id = parseId(request.params.id);

  if (!id) {
    response.status(400).json({ error: "Некоректний ідентифікатор вакансії." });
    return;
  }

  const row = db.prepare("SELECT * FROM vacancies WHERE id = ?").get(id);

  if (!row) {
    response.status(404).json({ error: "Вакансію не знайдено." });
    return;
  }

  response.json({ vacancy: mapVacancy(row) });
});

app.post("/api/vacancies", requireAuth, requireAdmin, (request, response) => {
  const result = validateVacancy(request.body);

  if (result.error) {
    response.status(400).json({ error: result.error });
    return;
  }

  const vacancy = result.value;
  const insertion = db.prepare(`
    INSERT INTO vacancies (
      title, company, initials, location, schedule, salary,
      stack_json, description, requirements_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vacancy.title,
    vacancy.company,
    vacancy.initials,
    vacancy.location,
    vacancy.schedule,
    vacancy.salary,
    JSON.stringify(vacancy.stack),
    vacancy.description,
    JSON.stringify(vacancy.requirements),
  );
  const row = db.prepare("SELECT * FROM vacancies WHERE id = ?").get(Number(insertion.lastInsertRowid));

  response.status(201).json({ vacancy: mapVacancy(row) });
});

app.put("/api/vacancies/:id", requireAuth, requireAdmin, (request, response) => {
  const id = parseId(request.params.id);

  if (!id) {
    response.status(400).json({ error: "Некоректний ідентифікатор вакансії." });
    return;
  }

  const result = validateVacancy(request.body);

  if (result.error) {
    response.status(400).json({ error: result.error });
    return;
  }

  const vacancy = result.value;
  const update = db.prepare(`
    UPDATE vacancies SET
      title = ?, company = ?, initials = ?, location = ?, schedule = ?, salary = ?,
      stack_json = ?, description = ?, requirements_json = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(
    vacancy.title,
    vacancy.company,
    vacancy.initials,
    vacancy.location,
    vacancy.schedule,
    vacancy.salary,
    JSON.stringify(vacancy.stack),
    vacancy.description,
    JSON.stringify(vacancy.requirements),
    id,
  );

  if (update.changes === 0) {
    response.status(404).json({ error: "Вакансію не знайдено." });
    return;
  }

  response.json({ vacancy: mapVacancy(db.prepare("SELECT * FROM vacancies WHERE id = ?").get(id)) });
});

app.delete("/api/vacancies/:id", requireAuth, requireAdmin, (request, response) => {
  const id = parseId(request.params.id);

  if (!id) {
    response.status(400).json({ error: "Некоректний ідентифікатор вакансії." });
    return;
  }

  const deletion = db.prepare("DELETE FROM vacancies WHERE id = ?").run(id);

  if (deletion.changes === 0) {
    response.status(404).json({ error: "Вакансію не знайдено." });
    return;
  }

  response.json({ ok: true });
});

app.get("/api/favorites", requireAuth, (request, response) => {
  const rows = db.prepare("SELECT vacancy_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(request.user.id);
  response.json({ vacancyIds: rows.map((row) => row.vacancy_id) });
});

app.post("/api/favorites/:vacancyId", requireAuth, (request, response) => {
  const vacancyId = parseId(request.params.vacancyId);
  const vacancyExists = vacancyId && db.prepare("SELECT 1 FROM vacancies WHERE id = ?").get(vacancyId);

  if (!vacancyId || !vacancyExists) {
    response.status(404).json({ error: "Вакансію не знайдено." });
    return;
  }

  db.prepare("INSERT OR IGNORE INTO favorites (user_id, vacancy_id) VALUES (?, ?)")
    .run(request.user.id, vacancyId);
  response.status(201).json({ ok: true });
});

app.delete("/api/favorites/:vacancyId", requireAuth, (request, response) => {
  const vacancyId = parseId(request.params.vacancyId);

  if (!vacancyId) {
    response.status(400).json({ error: "Некоректний ідентифікатор вакансії." });
    return;
  }

  db.prepare("DELETE FROM favorites WHERE user_id = ? AND vacancy_id = ?")
    .run(request.user.id, vacancyId);
  response.json({ ok: true });
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API endpoint не знайдено." });
});

if (existsSync(resolve(distDirectory, "index.html"))) {
  app.use(express.static(distDirectory));
  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api/")) {
      response.sendFile(resolve(distDirectory, "index.html"));
      return;
    }

    next();
  });
}

app.use((error, _request, response, next) => {
  console.error("API request failed.", error);

  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.status === 413) {
    response.status(413).json({ error: "Запит завеликий." });
    return;
  }

  if (error.status === 400) {
    response.status(400).json({ error: "Запит містить некоректний JSON." });
    return;
  }

  response.status(500).json({ error: "Внутрішня помилка сервера." });
});

db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`ArbeitFlow API listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
