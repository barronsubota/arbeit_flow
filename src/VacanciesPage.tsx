import { useEffect, useMemo, useState } from "react";

type Vacancy = {
  id: string;
  title: string;
  company: string;
  initials: string;
  location: string;
  schedule: string;
  salary: string;
  posted: string;
  stack: string[];
  description: string;
  requirements: string[];
};

const vacancies: Vacancy[] = [
  {
    id: "junior-frontend-novascale",
    title: "Junior Frontend Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Київ",
    schedule: "Віддалено",
    salary: "25 000–40 000 ₴",
    posted: "2 дні тому",
    stack: ["React", "TypeScript", "JavaScript"],
    description:
      "Долучайся до команди вебпродукту: працюй поруч із досвідченими розробниками та поступово бери на себе нові задачі.",
    requirements: ["Базові знання React і TypeScript", "Розуміння HTML та CSS", "Готовність навчатися в команді"],
  },
  {
    id: "junior-node-cyberlogic",
    title: "Junior Node.js Developer",
    company: "CyberLogic Systems",
    initials: "CL",
    location: "Львів",
    schedule: "Гібридно",
    salary: "28 000–42 000 ₴",
    posted: "3 дні тому",
    stack: ["Node.js", "JavaScript", "TypeScript"],
    description:
      "Допомагай розвивати API та внутрішні інструменти. На старті передбачені менторство й регулярний перегляд прогресу.",
    requirements: ["Основи JavaScript і Node.js", "Знайомство з REST API", "Базові знання Git"],
  },
  {
    id: "junior-qa-terrax",
    title: "Junior QA Engineer",
    company: "TerraX Labs",
    initials: "TX",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "22 000–35 000 ₴",
    posted: "5 днів тому",
    stack: ["Manual QA", "API", "SQL"],
    description:
      "Перевіряй якість вебзастосунків, описуй сценарії та співпрацюй із розробниками над покращенням продукту.",
    requirements: ["Розуміння циклу тестування", "Уважність до деталей", "Базове знайомство з API"],
  },
  {
    id: "python-intern-datanest",
    title: "Trainee Python Developer",
    company: "DataNest",
    initials: "DN",
    location: "Київ",
    schedule: "Гібридно",
    salary: "20 000–32 000 ₴",
    posted: "1 тиждень тому",
    stack: ["Python", "Django", "SQL"],
    description:
      "Почни кар'єру з невеликих backend-задач і розвивай навички Python у команді з відкритим код-рев'ю.",
    requirements: ["Основи Python", "Базовий SQL", "Бажання розвиватися в backend"],
  },
  {
    id: "junior-java-novascale",
    title: "Junior Java Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Дніпро",
    schedule: "Віддалено",
    salary: "27 000–41 000 ₴",
    posted: "1 тиждень тому",
    stack: ["Java", "Spring", "SQL"],
    description:
      "Працюй над сервісами для фінансової платформи та вивчай практики побудови надійних backend-систем.",
    requirements: ["Основи Java", "Знайомство з ООП", "Базове розуміння реляційних баз даних"],
  },
  {
    id: "junior-frontend-brightpath",
    title: "Junior UI Developer",
    company: "BrightPath",
    initials: "BP",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "24 000–38 000 ₴",
    posted: "2 тижні тому",
    stack: ["JavaScript", "React", "CSS"],
    description:
      "Допомагай створювати доступні інтерфейси й перетворювати дизайн-макети на зрозумілі вебсторінки.",
    requirements: ["Основи JavaScript і CSS", "Увага до деталей інтерфейсу", "Інтерес до доступності"],
  },
];

const stacks = Array.from(new Set(vacancies.flatMap((vacancy) => vacancy.stack)));
const favoritesStorageKey = "arbeitflow:saved-vacancies";

function readSavedVacancies(): string[] {
  const saved = window.localStorage.getItem(favoritesStorageKey);

  if (!saved) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);

  if (!Array.isArray(parsed) || !parsed.every((id): id is string => typeof id === "string")) {
    throw new Error("Saved vacancies data has an invalid format.");
  }

  return parsed;
}

function VacanciesPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedStack, setSelectedStack] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      return readSavedVacancies();
    } catch (error) {
      console.error("Could not load saved vacancies.", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(savedIds));
    } catch (error) {
      console.error("Could not save vacancies.", error);
    }
  }, [savedIds]);

  const filteredVacancies = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");
    const normalizedLocation = location.trim().toLocaleLowerCase("uk");

    return vacancies.filter((vacancy) => {
      const matchesQuery =
        !normalizedQuery ||
        [vacancy.title, vacancy.company, ...vacancy.stack]
          .join(" ")
          .toLocaleLowerCase("uk")
          .includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation ||
        [vacancy.location, vacancy.schedule, vacancy.schedule === "Віддалено" ? "remote" : ""]
          .join(" ")
          .toLocaleLowerCase("uk")
          .includes(normalizedLocation);
      const matchesStack = !selectedStack || vacancy.stack.includes(selectedStack);
      const matchesSaved = !showSavedOnly || savedIds.includes(vacancy.id);

      return matchesQuery && matchesLocation && matchesStack && matchesSaved;
    });
  }, [location, query, savedIds, selectedStack, showSavedOnly]);

  function toggleSaved(id: string) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }

  function resetFilters() {
    setQuery("");
    setLocation("");
    setSelectedStack("");
    setShowSavedOnly(false);
  }

  return (
    <main id="main-content">
      <section aria-labelledby="vacancies-title" className="vacancies-hero">
        <div aria-hidden="true" className="vacancies-glow" />
        <div className="vacancies-hero-content">
          <p className="eyebrow">
            <span aria-hidden="true" className="status-dot" />
            Кар'єрні можливості
          </p>
          <h1 id="vacancies-title">
            Твій наступний <span>крок в IT.</span>
          </h1>
          <p>
            Добірка junior-вакансій із зрозумілими вимогами, технологіями та
            форматом роботи.
          </p>
        </div>
        <div aria-label={`${vacancies.length} вакансій`} className="vacancies-count">
          <span>{vacancies.length}</span>
          <small>відкритих<br />можливостей</small>
        </div>
      </section>

      <section aria-label="Пошук вакансій" className="vacancy-search-section">
        <form
          className="vacancy-search"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="search-field">
            <span aria-hidden="true" className="search-icon">⌕</span>
            <span className="visually-hidden">Посада, компанія або технологія</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Посада, компанія або технологія"
              type="search"
              value={query}
            />
          </label>
          <label className="search-field location-field">
            <span aria-hidden="true" className="search-icon">⌖</span>
            <span className="visually-hidden">Місто або формат роботи</span>
            <input
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Місто або Remote"
              type="search"
              value={location}
            />
          </label>
          <button className="button search-submit" type="submit">
            Знайти вакансії <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>

      <section aria-labelledby="listing-title" className="vacancy-results">
        <div className="filter-heading">
          <div>
            <p className="eyebrow">Підбери свій стек</p>
            <h2 id="listing-title">Вакансії для junior-фахівців</h2>
          </div>
          <button
            aria-pressed={showSavedOnly}
            className={showSavedOnly ? "saved-filter selected" : "saved-filter"}
            onClick={() => setShowSavedOnly((current) => !current)}
            type="button"
          >
            <span aria-hidden="true">{showSavedOnly ? "♥" : "♡"}</span>
            Збережені <span className="saved-count">{savedIds.length}</span>
          </button>
        </div>

        <div aria-label="Фільтр за технологіями" className="stack-filters">
          <button
            aria-pressed={!selectedStack}
            className={!selectedStack ? "stack-chip selected" : "stack-chip"}
            onClick={() => setSelectedStack("")}
            type="button"
          >
            Усі технології
          </button>
          {stacks.map((stack) => (
            <button
              aria-pressed={selectedStack === stack}
              className={selectedStack === stack ? "stack-chip selected" : "stack-chip"}
              key={stack}
              onClick={() => setSelectedStack((current) => (current === stack ? "" : stack))}
              type="button"
            >
              {stack}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="results-count">
          Знайдено вакансій: <strong>{filteredVacancies.length}</strong>
        </p>

        {filteredVacancies.length ? (
          <div className="vacancy-list">
            {filteredVacancies.map((vacancy) => {
              const isSaved = savedIds.includes(vacancy.id);

              return (
                <article className="vacancy-card" key={vacancy.id}>
                  <div className="vacancy-card-main">
                    <span aria-hidden="true" className="vacancy-company-mark">
                      {vacancy.initials}
                    </span>
                    <div className="vacancy-summary">
                      <p className="vacancy-company">{vacancy.company}</p>
                      <h3>{vacancy.title}</h3>
                      <p className="vacancy-description">{vacancy.description}</p>
                      <div aria-label="Технології" className="vacancy-stack">
                        {vacancy.stack.map((stack) => (
                          <span className="vacancy-tag" key={stack}>
                            {stack}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      aria-label={isSaved ? `Видалити ${vacancy.title} з обраного` : `Зберегти ${vacancy.title}`}
                      aria-pressed={isSaved}
                      className={isSaved ? "favorite-button selected" : "favorite-button"}
                      onClick={() => toggleSaved(vacancy.id)}
                      type="button"
                    >
                      <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span>
                    </button>
                  </div>
                  <div className="vacancy-card-footer">
                    <div className="vacancy-meta">
                      <span><span aria-hidden="true">⌖</span> {vacancy.location}</span>
                      <span><span aria-hidden="true">◷</span> {vacancy.schedule}</span>
                      <span><span aria-hidden="true">₴</span> {vacancy.salary}</span>
                    </div>
                    <details className="vacancy-details">
                      <summary>Деталі вакансії <span aria-hidden="true">↓</span></summary>
                      <div className="vacancy-requirements">
                        <h4>Що важливо</h4>
                        <ul>
                          {vacancy.requirements.map((requirement) => (
                            <li key={requirement}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </div>
                  <span className="vacancy-posted">{vacancy.posted}</span>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-results">
            <span aria-hidden="true">⌕</span>
            <h3>Вакансій не знайдено</h3>
            <p>Спробуй змінити запит або скинути фільтри.</p>
            <button className="button" onClick={resetFilters} type="button">
              Скинути фільтри
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default VacanciesPage;
