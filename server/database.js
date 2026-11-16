import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const demoVacancies = [
  {
    title: "Junior Frontend Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Київ",
    schedule: "Віддалено",
    salary: "25 000–40 000 ₴",
    stack: ["React", "TypeScript", "JavaScript"],
    description:
      "Долучайся до команди вебпродукту: працюй поруч із досвідченими розробниками та поступово бери на себе нові задачі.",
    requirements: ["Базові знання React і TypeScript", "Розуміння HTML та CSS", "Готовність навчатися в команді"],
  },
  {
    title: "Junior Node.js Developer",
    company: "CyberLogic Systems",
    initials: "CL",
    location: "Львів",
    schedule: "Гібридно",
    salary: "28 000–42 000 ₴",
    stack: ["Node.js", "JavaScript", "TypeScript"],
    description:
      "Допомагай розвивати API та внутрішні інструменти. На старті передбачені менторство й регулярний перегляд прогресу.",
    requirements: ["Основи JavaScript і Node.js", "Знайомство з REST API", "Базові знання Git"],
  },
  {
    title: "Junior QA Engineer",
    company: "TerraX Labs",
    initials: "TX",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "22 000–35 000 ₴",
    stack: ["Manual QA", "API", "SQL"],
    description:
      "Перевіряй якість вебзастосунків, описуй сценарії та співпрацюй із розробниками над покращенням продукту.",
    requirements: ["Розуміння циклу тестування", "Уважність до деталей", "Базове знайомство з API"],
  },
  {
    title: "Trainee Python Developer",
    company: "DataNest",
    initials: "DN",
    location: "Київ",
    schedule: "Гібридно",
    salary: "20 000–32 000 ₴",
    stack: ["Python", "Django", "SQL"],
    description:
      "Почни кар'єру з невеликих backend-задач і розвивай навички Python у команді з відкритим код-рев'ю.",
    requirements: ["Основи Python", "Базовий SQL", "Бажання розвиватися в backend"],
  },
  {
    title: "Junior Java Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Дніпро",
    schedule: "Віддалено",
    salary: "27 000–41 000 ₴",
    stack: ["Java", "Spring", "SQL"],
    description:
      "Працюй над сервісами для фінансової платформи та вивчай практики побудови надійних backend-систем.",
    requirements: ["Основи Java", "Знайомство з ООП", "Базове розуміння реляційних баз даних"],
  },
  {
    title: "Junior UI Developer",
    company: "BrightPath",
    initials: "BP",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "24 000–38 000 ₴",
    stack: ["JavaScript", "React", "CSS"],
    description:
      "Допомагай створювати доступні інтерфейси й перетворювати дизайн-макети на зрозумілі вебсторінки.",
    requirements: ["Основи JavaScript і CSS", "Увага до деталей інтерфейсу", "Інтерес до доступності"],
  },
];

export function initializeDatabase() {
  const databasePath = resolve(process.env.DB_PATH || ".data/arbeitflow.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS vacancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      initials TEXT NOT NULL,
      location TEXT NOT NULL,
      schedule TEXT NOT NULL,
      salary TEXT NOT NULL,
      stack_json TEXT NOT NULL CHECK (json_valid(stack_json)),
      description TEXT NOT NULL,
      requirements_json TEXT NOT NULL CHECK (json_valid(requirements_json)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      PRIMARY KEY (user_id, vacancy_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
  `);

  const vacancyCount = db.prepare("SELECT COUNT(*) AS count FROM vacancies").get().count;

  if (vacancyCount === 0) {
    const insertVacancy = db.prepare(`
      INSERT INTO vacancies (
        title, company, initials, location, schedule, salary,
        stack_json, description, requirements_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vacancy of demoVacancies) {
      insertVacancy.run(
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
    }
  }

  return db;
}

export function mapVacancy(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    initials: row.initials,
    location: row.location,
    schedule: row.schedule,
    salary: row.salary,
    stack: JSON.parse(row.stack_json),
    description: row.description,
    requirements: JSON.parse(row.requirements_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
