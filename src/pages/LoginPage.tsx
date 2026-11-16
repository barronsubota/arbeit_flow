import { useState, type FormEvent } from "react";
import { login, type AuthUser } from "../lib/api";

type LoginPageProps = {
  onLogin: (user: AuthUser) => void;
};

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося увійти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section aria-labelledby="login-title" className="auth-panel">
        <p className="eyebrow">Твій простір ArbeitFlow</p>
        <h1 id="login-title">Вхід до акаунта</h1>
        <p className="auth-intro">
          Увійди, щоб зберігати вакансії або керувати їх публікацією.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input
              autoComplete="username"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="form-field">
            <span>Пароль</span>
            <input
              autoComplete="current-password"
              maxLength={200}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error && <p className="api-error" role="alert">{error}</p>}

          <button className="button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Входимо..." : "Увійти"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-footnote">
          Демо-акаунти створюються локально. <a href="/contacts">Потрібна допомога?</a>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
