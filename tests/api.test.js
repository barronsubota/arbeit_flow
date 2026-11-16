import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let temporaryDirectory;
let serverProcess;
let baseUrl;
let adminCredentials;
let userCredentials;
let serverOutput = "";

function reservePort() {
  return new Promise((resolvePort, reject) => {
    const reservation = createServer();
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", () => {
      const address = reservation.address();
      const port = typeof address === "object" && address ? address.port : null;
      reservation.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolvePort(port);
      });
    });
  });
}

function waitForServer() {
  return new Promise((resolveWait, rejectWait) => {
    const finish = (error) => {
      clearTimeout(timeout);
      serverProcess.stdout.off("data", onOutput);
      serverProcess.stderr.off("data", onErrorOutput);
      serverProcess.off("exit", onExit);

      if (error) {
        rejectWait(error);
      } else {
        resolveWait();
      }
    };
    const onOutput = (chunk) => {
      serverOutput += chunk.toString();
      if (serverOutput.includes("ArbeitFlow API listening on")) {
        finish();
      }
    };
    const onErrorOutput = (chunk) => {
      serverOutput += chunk.toString();
    };
    const onExit = () => {
      finish(new Error(`Test API server exited before starting. ${serverOutput}`));
    };
    const timeout = setTimeout(
      () => finish(new Error(`Test API server did not start. ${serverOutput}`)),
      10000,
    );

    serverProcess.stdout.on("data", onOutput);
    serverProcess.stderr.on("data", onErrorOutput);
    serverProcess.once("exit", onExit);
  });
}

async function request(path, { body, cookie, headers = {}, method = "GET", origin } = {}) {
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders["content-type"] = "application/json";
  }
  if (cookie) {
    requestHeaders.cookie = cookie;
  }
  if (origin) {
    requestHeaders.origin = origin;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();

  return {
    response,
    json: text ? JSON.parse(text) : null,
  };
}

async function login(email, password) {
  const { response, json } = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  assert.equal(response.status, 200);
  assert.ok(json.user);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);

  return {
    cookie: setCookie.split(";", 1)[0],
    setCookie,
    user: json.user,
  };
}

before(async () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "arbeitflow-tests-"));
  const port = await reservePort();
  const env = {
    ...process.env,
    DB_PATH: join(temporaryDirectory, ".data", "arbeitflow.sqlite"),
    CORS_ORIGIN: "https://arbeitflow.example",
    COOKIE_SAME_SITE: "none",
    HOST: "127.0.0.1",
    NODE_ENV: "production",
    ADMIN_EMAIL: "admin@example.test",
    ADMIN_PASSWORD: "test-admin-password",
    USER_EMAIL: "user@example.test",
    USER_PASSWORD: "test-user-password",
    PORT: String(port),
  };

  execFileSync(process.execPath, [join(projectDirectory, "server", "setup-local.js")], {
    cwd: temporaryDirectory,
    env,
    stdio: "ignore",
  });

  adminCredentials = {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  };
  userCredentials = {
    email: env.USER_EMAIL,
    password: env.USER_PASSWORD,
  };
  assert.equal(existsSync(join(temporaryDirectory, "credentials.local.txt")), false);
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, [join(projectDirectory, "server", "index.js")], {
    cwd: temporaryDirectory,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForServer();
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    const exited = new Promise((resolveExit) => {
      serverProcess.once("exit", resolveExit);
    });
    serverProcess.kill("SIGKILL");
    await exited;
  }

  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("public vacancy browsing and protected favorites", async () => {
  const { response: healthResponse, json: health } = await request("/api/health");
  assert.equal(healthResponse.status, 200);
  assert.equal(health.status, "ok");

  const { response: vacanciesResponse, json: vacancies } = await request("/api/vacancies");
  assert.equal(vacanciesResponse.status, 200);
  assert.equal(vacancies.vacancies.length, 6);

  const { response: corsResponse } = await request("/api/vacancies", {
    origin: "https://arbeitflow.example",
  });
  assert.equal(corsResponse.headers.get("access-control-allow-origin"), "https://arbeitflow.example");

  const { response: preflightResponse } = await request("/api/favorites/1", {
    method: "OPTIONS",
    origin: "https://arbeitflow.example",
    headers: { "access-control-request-method": "POST" },
  });
  assert.equal(preflightResponse.status, 204);

  const { json: guestSession } = await request("/api/auth/me");
  assert.equal(guestSession.user, null);

  const { response: unauthorizedFavorites } = await request("/api/favorites");
  assert.equal(unauthorizedFavorites.status, 401);

  const { response: invalidId } = await request("/api/vacancies/0");
  assert.equal(invalidId.status, 400);
});

test("login roles and account-scoped favorite management", async () => {
  const { response: invalidLogin } = await request("/api/auth/login", {
    method: "POST",
    body: { email: userCredentials.email, password: "incorrect-password" },
  });
  assert.equal(invalidLogin.status, 401);

  const user = await login(userCredentials.email, userCredentials.password);
  assert.equal(user.user.role, "user");
  assert.match(user.cookie, /arbeitflow_session=/);
  assert.match(user.setCookie, /Secure/);
  assert.match(user.setCookie, /SameSite=None/);

  const { response: deniedOrigin } = await request("/api/favorites/1", {
    method: "POST",
    cookie: user.cookie,
    origin: "https://attacker.example",
  });
  assert.equal(deniedOrigin.status, 403);

  const { response: deniedCreate } = await request("/api/vacancies", {
    method: "POST",
    cookie: user.cookie,
    body: {},
  });
  assert.equal(deniedCreate.status, 403);

  const { response: deniedUpdate } = await request("/api/vacancies/1", {
    method: "PUT",
    cookie: user.cookie,
    body: {},
  });
  assert.equal(deniedUpdate.status, 403);

  const { response: deniedDelete } = await request("/api/vacancies/1", {
    method: "DELETE",
    cookie: user.cookie,
  });
  assert.equal(deniedDelete.status, 403);

  const { json: emptyFavorites } = await request("/api/favorites", { cookie: user.cookie });
  assert.deepEqual(emptyFavorites.vacancyIds, []);

  const { response: saved } = await request("/api/favorites/1", {
    method: "POST",
    cookie: user.cookie,
  });
  assert.equal(saved.status, 201);

  await request("/api/favorites/1", { method: "POST", cookie: user.cookie });
  const { json: userFavorites } = await request("/api/favorites", { cookie: user.cookie });
  assert.deepEqual(userFavorites.vacancyIds, [1]);

  const admin = await login(adminCredentials.email, adminCredentials.password);
  assert.equal(admin.user.role, "admin");
  const { json: adminFavorites } = await request("/api/favorites", { cookie: admin.cookie });
  assert.deepEqual(adminFavorites.vacancyIds, []);

  const { response: removed } = await request("/api/favorites/1", {
    method: "DELETE",
    cookie: user.cookie,
  });
  assert.equal(removed.status, 200);
  const { json: clearedFavorites } = await request("/api/favorites", { cookie: user.cookie });
  assert.deepEqual(clearedFavorites.vacancyIds, []);

  await request("/api/auth/logout", { method: "POST", cookie: user.cookie });
  const { response: loggedOutFavorites } = await request("/api/favorites", { cookie: user.cookie });
  assert.equal(loggedOutFavorites.status, 401);
});

test("administrator can validate, create, filter, update, and delete vacancies", async () => {
  const admin = await login(adminCredentials.email, adminCredentials.password);
  const vacancyInput = {
    title: "Junior QA Engineer",
    company: "Northwind Labs",
    initials: "",
    location: "Київ",
    schedule: "Віддалено",
    salary: "20 000–30 000 ₴",
    stack: ["Manual QA", "API", "API"],
    description: "Перевіряй якість продукту разом із командою.",
    requirements: ["Уважність до деталей"],
  };

  const { response: invalidCreate } = await request("/api/vacancies", {
    method: "POST",
    cookie: admin.cookie,
    body: { ...vacancyInput, stack: [] },
  });
  assert.equal(invalidCreate.status, 400);

  const { response: createdResponse, json: created } = await request("/api/vacancies", {
    method: "POST",
    cookie: admin.cookie,
    body: vacancyInput,
  });
  assert.equal(createdResponse.status, 201);
  assert.equal(created.vacancy.initials, "NL");
  assert.deepEqual(created.vacancy.stack, ["Manual QA", "API"]);

  const { json: searchResults } = await request("/api/vacancies?search=Junior%20QA");
  assert.ok(searchResults.vacancies.some((vacancy) => vacancy.id === created.vacancy.id));

  const { json: remoteResults } = await request("/api/vacancies?location=remote");
  assert.ok(remoteResults.vacancies.some((vacancy) => vacancy.id === created.vacancy.id));

  const updatedInput = { ...vacancyInput, title: "Junior QA Analyst" };
  const { response: updatedResponse, json: updated } = await request(
    `/api/vacancies/${created.vacancy.id}`,
    {
      method: "PUT",
      cookie: admin.cookie,
      body: updatedInput,
    },
  );
  assert.equal(updatedResponse.status, 200);
  assert.equal(updated.vacancy.title, "Junior QA Analyst");

  const { response: deletedResponse } = await request(
    `/api/vacancies/${created.vacancy.id}`,
    { method: "DELETE", cookie: admin.cookie },
  );
  assert.equal(deletedResponse.status, 200);

  const { response: missingVacancy } = await request(`/api/vacancies/${created.vacancy.id}`);
  assert.equal(missingVacancy.status, 404);
});
