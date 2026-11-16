import { useEffect, useMemo, useState } from "react";
import {
  getFavoriteVacancyIds,
  getVacancies,
  removeFavoriteVacancy,
  saveFavoriteVacancy,
  type AuthUser,
  type Vacancy,
} from "../lib/api";
import { getRouteHref } from "../lib/routes";

type VacanciesPageProps = {
  user: AuthUser | null;
};

function VacanciesPage({ user }: VacanciesPageProps) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedStack, setSelectedStack] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");

    Promise.all([
      getVacancies(),
      user ? getFavoriteVacancyIds() : Promise.resolve([]),
    ])
      .then(([nextVacancies, nextSavedIds]) => {
        if (active) {
          setVacancies(nextVacancies);
          setSavedIds(nextSavedIds);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Не вдалося завантажити вакансії.");
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const stacks = useMemo(
    () => Array.from(new Set(vacancies.flatMap((vacancy) => vacancy.stack))),
    [vacancies],
  );

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
  }, [location, query, savedIds, selectedStack, showSavedOnly, vacancies]);

  async function toggleSaved(vacancyId: number) {
    if (!user) {
      setError("Увійдіть до акаунта, щоб зберігати вакансії.");
      return;
    }

    const isSaved = savedIds.includes(vacancyId);

    try {
      if (isSaved) {
        await removeFavoriteVacancy(vacancyId);
        setSavedIds((current) => current.filter((id) => id !== vacancyId));
      } else {
        await saveFavoriteVacancy(vacancyId);
        setSavedIds((current) => [...current, vacancyId]);
      }
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося оновити обране.");
    }
  }

  function toggleSavedFilter() {
    if (!user) {
      setError("Увійдіть до акаунта, щоб переглядати збережені вакансії.");
      return;
    }

    setShowSavedOnly((current) => !current);
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
            onClick={toggleSavedFilter}
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

        {error && (
          <p className="api-error" role="alert">
            {error} {!user && <a href={getRouteHref("/login")}>Увійти</a>}
          </p>
        )}

        {isLoading ? (
          <p className="results-count">Завантажуємо вакансії...</p>
        ) : (
          <>
            <p aria-live="polite" className="results-count">
              Знайдено вакансій: <strong>{filteredVacancies.length}</strong>
            </p>

            {filteredVacancies.length ? (
              <div className="vacancy-list">
                {filteredVacancies.map((vacancy) => {
                  const isSaved = savedIds.includes(vacancy.id);
                  const posted = new Date(vacancy.createdAt).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "long",
                  });

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
                          onClick={() => void toggleSaved(vacancy.id)}
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
                      <span className="vacancy-posted">{posted}</span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-results">
                <span aria-hidden="true">⌕</span>
                <h3>{showSavedOnly ? "Збережених вакансій поки немає" : "Вакансій не знайдено"}</h3>
                <p>Спробуй змінити запит або скинути фільтри.</p>
                {showSavedOnly && !user ? (
                  <a className="button" href={getRouteHref("/login")}>Увійти до акаунта</a>
                ) : (
                  <button className="button" onClick={resetFilters} type="button">
                    Скинути фільтри
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default VacanciesPage;
