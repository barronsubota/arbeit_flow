import { useEffect, useState } from "react";
import AdminPage from "./pages/AdminPage";
import ContactsPage from "./pages/ContactsPage";
import LoginPage from "./pages/LoginPage";
import VacanciesPage from "./pages/VacanciesPage";
import { getCurrentUser, logout, type AuthUser } from "./lib/api";

const partners = [
  {
    initials: "NV",
    name: "NovaScale Systems",
    description:
      "FinTech-команда, де junior-розробники працюють із сучасними хмарними сервісами.",
  },
  {
    initials: "CL",
    name: "CyberLogic Systems",
    description:
      "Створюють вебпродукти для міжнародних клієнтів і діляться знаннями в команді.",
  },
  {
    initials: "TX",
    name: "TerraX Labs",
    description:
      "Інженерна команда з менторством і можливістю розвиватися в різних напрямах.",
  },
];

const benefits = [
  {
    icon: "↗",
    title: "Прямий контакт",
    description:
      "Спілкуйтеся з командами напряму та швидше отримуйте відповідь на відгук.",
  },
  {
    icon: "⌘",
    title: "Пошук за стеком",
    description:
      "Знаходьте вакансії за технологіями, які вже знаєте або хочете опанувати.",
  },
  {
    icon: "✓",
    title: "Зрозумілі умови",
    description:
      "Переглядайте вимоги й формат роботи ще до того, як надіслати резюме.",
  },
];

const testimonials = [
  {
    initials: "ОК",
    name: "Олена Ковальчук",
    role: "Junior Frontend Developer",
    quote:
      "Знайшла вакансії саме для свого рівня й нарешті зрозуміла, які навички компанії очікують від кандидата.",
  },
  {
    initials: "МП",
    name: "Максим Петренко",
    role: "Junior Backend Developer",
    quote:
      "Зручно фільтрувати пропозиції за стеком і зберігати ті, до яких хочеться повернутися.",
  },
  {
    initials: "ІС",
    name: "Ірина Савчук",
    role: "Junior QA Engineer",
    quote:
      "Опис вакансій допоміг швидко зрозуміти формат команди та підготуватися до першої розмови.",
  },
];

function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const currentPath = window.location.pathname.replace(/\/+$/, "");
  const isVacanciesPage = currentPath === "/vacancies";
  const isContactsPage = currentPath === "/contacts";
  const isLoginPage = currentPath === "/login";
  const isAdminPage = currentPath === "/admin";
  const isHomePage = !isVacanciesPage && !isContactsPage && !isLoginPage && !isAdminPage;
  const testimonial = testimonials[activeTestimonial];

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((reason: unknown) => {
        setAuthError(reason instanceof Error ? reason.message : "Не вдалося перевірити акаунт.");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    document.title = isVacanciesPage
      ? "Вакансії для junior IT-фахівців — ArbeitFlow"
      : isContactsPage
        ? "Контакти — ArbeitFlow"
        : isLoginPage
          ? "Вхід — ArbeitFlow"
          : isAdminPage
            ? "Керування вакансіями — ArbeitFlow"
        : "ArbeitFlow — робота для junior IT-фахівців";
  }, [isAdminPage, isContactsPage, isLoginPage, isVacanciesPage]);

  function handleLogin(nextUser: AuthUser) {
    setUser(nextUser);
    window.location.assign(nextUser.role === "admin" ? "/admin" : "/vacancies");
  }

  async function handleLogout() {
    setAuthError("");

    try {
      await logout();
      setUser(null);
      window.location.assign("/");
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : "Не вдалося вийти з акаунта.");
    }
  }

  function showTestimonial(direction: number) {
    setActiveTestimonial(
      (current) => (current + direction + testimonials.length) % testimonials.length,
    );
  }

  return (
    <div className="site-shell" data-theme={isDark ? "dark" : "light"}>
      <a className="skip-link" href="#main-content">
        Перейти до основного вмісту
      </a>

      <header className="site-header">
        <div className="header-inner">
          <a aria-label="ArbeitFlow — на головну" className="brand" href="/">
            <span aria-hidden="true" className="brand-mark">
              A
            </span>
            <span>ArbeitFlow</span>
          </a>

          <nav aria-label="Головна навігація" className="main-nav">
            <a aria-current={isHomePage ? "page" : undefined} className={isHomePage ? "active" : undefined} href="/">
              Головна
            </a>
            <a aria-current={isVacanciesPage ? "page" : undefined} className={isVacanciesPage ? "active" : undefined} href="/vacancies">
              Вакансії
            </a>
            <a aria-current={isContactsPage ? "page" : undefined} className={isContactsPage ? "active" : undefined} href="/contacts">
              Контакти
            </a>
          </nav>

          <div className="header-actions">
            <button
              aria-label={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
              className="theme-toggle"
              onClick={() => setIsDark((current) => !current)}
              type="button"
            >
              <span aria-hidden="true">{isDark ? "☼" : "☾"}</span>
            </button>
            {user && (
              <span className="account-role">
                {user.role === "admin" ? "Адміністратор" : "Кандидат"}
              </span>
            )}
            {user?.role === "admin" && (
              <a className="button button-small admin-panel-link" href="/admin">
                Панель
              </a>
            )}
            {user?.role !== "admin" && (
              <a className="button button-small find-vacancy-button" href="/vacancies">
                Знайти вакансію
              </a>
            )}
            {user ? (
              <button
                aria-label="Вийти з акаунта"
                className="logout-button"
                onClick={() => void handleLogout()}
                type="button"
              >
                <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <a className="button button-small login-link" href="/login">
                Увійти
              </a>
            )}
          </div>
        </div>
      </header>

      {authError && <p className="global-api-error" role="alert">{authError}</p>}

      {isVacanciesPage ? (
        <VacanciesPage user={user} />
      ) : isContactsPage ? (
        <ContactsPage />
      ) : isLoginPage ? (
        <LoginPage onLogin={handleLogin} />
      ) : isAdminPage ? (
        <AdminPage authLoading={authLoading} user={user} />
      ) : <main id="main-content">
        <section aria-labelledby="hero-title" className="hero-section" id="home">
          <div aria-hidden="true" className="hero-glow" />
          <div className="hero-content">
            <p className="eyebrow">
              <span aria-hidden="true" className="status-dot" />
              Твій старт в IT починається тут
            </p>
            <h1 id="hero-title">
              Знайди роботу, з якої <span>почнеться твоя історія.</span>
            </h1>
            <p className="hero-copy">
              Вакансії для junior IT-фахівців, чесні вимоги та команди, готові
              допомагати зростати.
            </p>
            <a className="button hero-button" href="/vacancies">
              Переглянути вакансії <span aria-hidden="true">→</span>
            </a>
            <p className="hero-note">Твій досвід — це більше, ніж рядок у резюме.</p>
          </div>
          <div aria-hidden="true" className="hero-orbit">
            <div className="orbit-center">
              <span className="orbit-spark">✳</span>
              <span>Твій наступний крок</span>
              <strong>починається тут</strong>
            </div>
            <span className="orbit-tag orbit-tag-one">React</span>
            <span className="orbit-tag orbit-tag-two">TypeScript</span>
            <span className="orbit-tag orbit-tag-three">Перший офер</span>
          </div>
        </section>

        <section aria-labelledby="partners-title" className="section partners-section" id="partners">
          <div className="section-heading">
            <p className="eyebrow">Кар'єрні можливості</p>
            <h2 id="partners-title">Команди, що готові до твого потенціалу</h2>
            <p>
              Відкрий для себе компанії, де цікавість і бажання вчитися мають
              значення.
            </p>
          </div>
          <div className="partner-grid">
            {partners.map((partner) => (
              <article className="partner-card" key={partner.name}>
                <span aria-hidden="true" className="partner-monogram">
                  {partner.initials}
                </span>
                <h3>{partner.name}</h3>
                <p>{partner.description}</p>
                <a className="text-link" href="/vacancies">
                  Переглянути вакансії <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="benefits-title" className="section benefits-section" id="benefits">
          <div className="section-heading">
            <p className="eyebrow">Твій кар'єрний компас</p>
            <h2 id="benefits-title">Чому саме ArbeitFlow?</h2>
          </div>
          <div className="benefit-grid">
            {benefits.map((benefit, index) => (
              <article className="benefit-card" key={benefit.title}>
                <span aria-hidden="true" className="benefit-icon">
                  {benefit.icon}
                </span>
                <span className="benefit-index">0{index + 1}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="reviews-title" className="section reviews-section" id="reviews">
          <div className="review-heading">
            <div>
              <p className="eyebrow">Історії спільноти</p>
              <h2 id="reviews-title">Перший крок має значення</h2>
            </div>
            <div aria-label="Керування відгуками" className="slider-controls">
              <button
                aria-label="Попередній відгук"
                className="slider-button"
                onClick={() => showTestimonial(-1)}
                type="button"
              >
                ←
              </button>
              <button
                aria-label="Наступний відгук"
                className="slider-button"
                onClick={() => showTestimonial(1)}
                type="button"
              >
                →
              </button>
            </div>
          </div>
          <figure aria-live="polite" className="testimonial-card">
            <span aria-hidden="true" className="quote-mark">
              “
            </span>
            <blockquote>{testimonial.quote}</blockquote>
            <figcaption>
              <span aria-hidden="true" className="avatar">
                {testimonial.initials}
              </span>
              <span>
                <strong>{testimonial.name}</strong>
                <small>{testimonial.role}</small>
              </span>
              <span aria-hidden="true" className="verified-mark">
                ✓
              </span>
            </figcaption>
          </figure>
          <div aria-label="Вибрати відгук" className="slider-dots">
            {testimonials.map((item, index) => (
              <button
                aria-current={index === activeTestimonial ? "true" : undefined}
                aria-label={`Відгук ${index + 1}: ${item.name}`}
                className={index === activeTestimonial ? "slider-dot selected" : "slider-dot"}
                key={item.name}
                onClick={() => setActiveTestimonial(index)}
                type="button"
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="contact-title" className="contact-banner" id="contact">
          <div>
            <p className="eyebrow">Наступний крок за тобою</p>
            <h2 id="contact-title">Готовий знайти свою першу IT-команду?</h2>
          </div>
          <a className="button" href="/vacancies">
            Переглянути команди <span aria-hidden="true">→</span>
          </a>
        </section>
      </main>}

      <footer className="site-footer">
        <a aria-label="ArbeitFlow — на головну" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            A
          </span>
          <span>ArbeitFlow</span>
        </a>
        <p>Платформа пошуку можливостей для нового покоління IT-фахівців.</p>
        <span className="copyright">© 2026 ArbeitFlow</span>
      </footer>
    </div>
  );
}

export default App;
