import { type FormEvent, useState } from "react";

const contactTopics = [
  "Пошук вакансій",
  "Профіль кандидата",
  "Співпраця з роботодавцями",
  "Інше питання",
];

function ContactsPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main id="main-content">
      <section aria-labelledby="contacts-title" className="contacts-hero">
        <div aria-hidden="true" className="contacts-glow" />
        <p className="eyebrow">
          <span aria-hidden="true" className="status-dot" />
          Ми на зв'язку
        </p>
        <h1 id="contacts-title">
          Є питання? <span>Давай поговоримо.</span>
        </h1>
        <p>
          Розкажи, чим можемо допомогти — підкажемо щодо пошуку роботи,
          вакансій або співпраці з платформою.
        </p>
      </section>

      <section aria-label="Зв'язок з ArbeitFlow" className="contacts-content">
        <div className="contacts-info">
          <p className="eyebrow">Підтримка спільноти</p>
          <h2>Почнемо з твого запитання</h2>
          <p className="contacts-intro">
            Обери тему й залиш повідомлення. Ми допоможемо зорієнтуватися в
            можливостях ArbeitFlow.
          </p>

          <div className="contact-topics">
            <article className="contact-topic-card">
              <span aria-hidden="true" className="contact-topic-icon">⌕</span>
              <div>
                <h3>Кандидатам</h3>
                <p>Пошук вакансій, обране та перші кроки в IT.</p>
              </div>
            </article>
            <article className="contact-topic-card">
              <span aria-hidden="true" className="contact-topic-icon">↗</span>
              <div>
                <h3>Роботодавцям</h3>
                <p>Питання про команди та розміщення вакансій.</p>
              </div>
            </article>
          </div>

          <a className="contact-jobs-link" href="/vacancies">
            Переглянути відкриті вакансії <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="contact-form-panel">
          <div className="contact-form-heading">
            <span aria-hidden="true" className="form-heading-mark">✳</span>
            <div>
              <h2>Напиши нам</h2>
              <p>Заповни форму — поля з позначкою * обов'язкові.</p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <label className="form-field">
                <span>Ім'я <span aria-hidden="true">*</span></span>
                <input
                  autoComplete="name"
                  maxLength={80}
                  minLength={2}
                  name="name"
                  onChange={() => setSubmitted(false)}
                  placeholder="Як до тебе звертатися?"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email <span aria-hidden="true">*</span></span>
                <input
                  autoComplete="email"
                  name="email"
                  onChange={() => setSubmitted(false)}
                  placeholder="name@example.com"
                  required
                  type="email"
                />
              </label>
            </div>

            <label className="form-field">
              <span>Тема звернення <span aria-hidden="true">*</span></span>
              <select
                defaultValue=""
                name="topic"
                onChange={() => setSubmitted(false)}
                required
              >
                <option disabled value="">
                  Обери тему
                </option>
                {contactTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Повідомлення <span aria-hidden="true">*</span></span>
              <textarea
                maxLength={1200}
                minLength={10}
                name="message"
                onChange={() => setSubmitted(false)}
                placeholder="Опиши своє питання (від 10 символів)"
                required
                rows={5}
              />
            </label>

            <label className="consent-field">
              <input
                name="consent"
                onChange={() => setSubmitted(false)}
                required
                type="checkbox"
              />
              <span>Погоджуюся на обробку наданих даних для відповіді на запит.</span>
            </label>

            <p className="form-demo-note">
              Форма працює в демонстраційному режимі: дані перевіряються у
              браузері, але не надсилаються.
            </p>

            <button className="button contact-submit" type="submit">
              Перевірити форму <span aria-hidden="true">→</span>
            </button>

            {submitted && (
              <p aria-live="polite" className="form-status" role="status">
                Усі поля заповнено коректно. Надсилання повідомлень ще не підключено.
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

export default ContactsPage;
