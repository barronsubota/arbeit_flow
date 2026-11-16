import { useEffect, useState, type FormEvent } from "react";
import {
  createVacancy,
  deleteVacancy,
  getVacancies,
  updateVacancy,
  type AuthUser,
  type Vacancy,
  type VacancyInput,
} from "../lib/api";
import { getRouteHref } from "../lib/routes";

type AdminPageProps = {
  user: AuthUser | null;
  authLoading: boolean;
};

const emptyVacancy: VacancyInput = {
  title: "",
  company: "",
  initials: "",
  location: "",
  schedule: "",
  salary: "",
  stack: [],
  description: "",
  requirements: [],
};

function AdminPage({ user, authLoading }: AdminPageProps) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [form, setForm] = useState<VacancyInput>(emptyVacancy);
  const [stackText, setStackText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function refreshVacancies() {
    setIsLoading(true);
    setError("");

    try {
      setVacancies(await getVacancies());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося завантажити вакансії.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      void refreshVacancies();
    }
  }, [user?.role]);

  function resetForm() {
    setForm(emptyVacancy);
    setStackText("");
    setRequirementsText("");
    setEditingId(null);
  }

  function editVacancy(vacancy: Vacancy) {
    setForm({
      title: vacancy.title,
      company: vacancy.company,
      initials: vacancy.initials,
      location: vacancy.location,
      schedule: vacancy.schedule,
      salary: vacancy.salary,
      stack: vacancy.stack,
      description: vacancy.description,
      requirements: vacancy.requirements,
    });
    setStackText(vacancy.stack.join(", "));
    setRequirementsText(vacancy.requirements.join("\n"));
    setEditingId(vacancy.id);
    setNotice("");
    setError("");
    document.getElementById("vacancy-editor")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const input = {
      ...form,
      stack: stackText.split(",").map((item) => item.trim()).filter(Boolean),
      requirements: requirementsText.split("\n").map((item) => item.trim()).filter(Boolean),
    };

    try {
      if (editingId === null) {
        await createVacancy(input);
        setNotice("Вакансію створено.");
      } else {
        await updateVacancy(editingId, input);
        setNotice("Зміни вакансії збережено.");
      }

      resetForm();
      await refreshVacancies();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося зберегти вакансію.");
    }
  }

  async function removeVacancy(vacancy: Vacancy) {
    if (!window.confirm(`Видалити вакансію «${vacancy.title}»?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deleteVacancy(vacancy.id);
      setNotice("Вакансію видалено.");
      if (editingId === vacancy.id) {
        resetForm();
      }
      await refreshVacancies();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося видалити вакансію.");
    }
  }

  if (authLoading) {
    return <main className="auth-page" id="main-content"><p>Перевіряємо доступ...</p></main>;
  }

  if (!user) {
    return (
      <main className="auth-page" id="main-content">
        <section className="auth-panel">
          <p className="eyebrow">Панель керування</p>
          <h1>Потрібен вхід</h1>
          <p className="auth-intro">Увійди до акаунта адміністратора, щоб керувати вакансіями.</p>
          <a className="button" href={getRouteHref("/login")}>Перейти до входу <span aria-hidden="true">→</span></a>
        </section>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="auth-page" id="main-content">
        <section className="auth-panel">
          <p className="eyebrow">Панель керування</p>
          <h1>Немає доступу</h1>
          <p className="auth-intro">Створювати й редагувати вакансії може лише адміністратор.</p>
          <a className="button" href={getRouteHref("/vacancies")}>До вакансій <span aria-hidden="true">→</span></a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" id="main-content">
      <section aria-labelledby="admin-title" className="admin-heading">
        <p className="eyebrow">Панель адміністратора</p>
        <h1 id="admin-title">Керування вакансіями</h1>
        <p>Створюй, оновлюй або знімай з публікації пропозиції роботи.</p>
      </section>

      <section aria-labelledby="editor-title" className="admin-editor" id="vacancy-editor">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">{editingId === null ? "Нова публікація" : `Редагування #${editingId}`}</p>
            <h2 id="editor-title">{editingId === null ? "Створити вакансію" : "Редагувати вакансію"}</h2>
          </div>
          {editingId !== null && (
            <button className="secondary-button" onClick={resetForm} type="button">Скасувати</button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="contact-form-row">
            <label className="form-field">
              <span>Назва вакансії *</span>
              <input
                maxLength={120}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                value={form.title}
              />
            </label>
            <label className="form-field">
              <span>Компанія *</span>
              <input
                maxLength={120}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                required
                value={form.company}
              />
            </label>
          </div>
          <div className="contact-form-row">
            <label className="form-field">
              <span>Місто або формат *</span>
              <input
                maxLength={120}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                required
                value={form.location}
              />
            </label>
            <label className="form-field">
              <span>Графік роботи *</span>
              <input
                maxLength={80}
                onChange={(event) => setForm({ ...form, schedule: event.target.value })}
                placeholder="Віддалено / Гібридно / Офіс"
                required
                value={form.schedule}
              />
            </label>
          </div>
          <div className="contact-form-row">
            <label className="form-field">
              <span>Зарплатний діапазон *</span>
              <input
                maxLength={80}
                onChange={(event) => setForm({ ...form, salary: event.target.value })}
                placeholder="25 000–40 000 ₴"
                required
                value={form.salary}
              />
            </label>
            <label className="form-field">
              <span>Технології через кому *</span>
              <input
                onChange={(event) => setStackText(event.target.value)}
                placeholder="React, TypeScript"
                required
                value={stackText}
              />
            </label>
          </div>
          <label className="form-field">
            <span>Опис вакансії *</span>
            <textarea
              maxLength={2000}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
              rows={4}
              value={form.description}
            />
          </label>
          <label className="form-field">
            <span>Вимоги, кожна з нового рядка</span>
            <textarea
              onChange={(event) => setRequirementsText(event.target.value)}
              rows={3}
              value={requirementsText}
            />
          </label>

          {error && <p className="api-error" role="alert">{error}</p>}
          {notice && <p className="form-status" role="status">{notice}</p>}

          <button className="button admin-submit" type="submit">
            {editingId === null ? "Створити вакансію" : "Зберегти зміни"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>

      <section aria-labelledby="admin-list-title" className="admin-list">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Опубліковані пропозиції</p>
            <h2 id="admin-list-title">Вакансії <span className="admin-count">{vacancies.length}</span></h2>
          </div>
        </div>

        {isLoading ? (
          <p className="admin-empty">Завантажуємо вакансії...</p>
        ) : vacancies.length === 0 ? (
          <p className="admin-empty">Вакансій поки немає. Створи першу за допомогою форми.</p>
        ) : (
          <div className="admin-vacancy-list">
            {vacancies.map((vacancy) => (
              <article className="admin-vacancy-row" key={vacancy.id}>
                <span aria-hidden="true" className="vacancy-company-mark">{vacancy.initials}</span>
                <div className="admin-vacancy-info">
                  <strong>{vacancy.title}</strong>
                  <span>{vacancy.company} · {vacancy.location}</span>
                </div>
                <div className="admin-row-actions">
                  <button className="secondary-button" onClick={() => editVacancy(vacancy)} type="button">
                    Редагувати
                  </button>
                  <button className="danger-button" onClick={() => void removeVacancy(vacancy)} type="button">
                    Видалити
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminPage;
