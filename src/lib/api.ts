export type AccountRole = "admin" | "user";

export type AuthUser = {
  id: number;
  email: string;
  role: AccountRole;
};

export type Vacancy = {
  id: number;
  title: string;
  company: string;
  initials: string;
  location: string;
  schedule: string;
  salary: string;
  stack: string[];
  description: string;
  requirements: string[];
  createdAt: string;
  updatedAt: string;
};

export type VacancyInput = Omit<Vacancy, "id" | "createdAt" | "updatedAt">;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    credentials: apiBaseUrl ? "include" : "same-origin",
    headers,
  });

  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Сервер повернув неочікувану відповідь. Перевірте налаштування API.");
  }

  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "Запит не вдалося виконати.";
    throw new Error(message);
  }

  return result as T;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const result = await request<{ user: AuthUser | null }>("/auth/me");
  return result.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const result = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return result.user;
}

export async function logout(): Promise<void> {
  await request<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function getVacancies(): Promise<Vacancy[]> {
  const result = await request<{ vacancies: Vacancy[] }>("/vacancies");
  return result.vacancies;
}

export async function createVacancy(input: VacancyInput): Promise<Vacancy> {
  const result = await request<{ vacancy: Vacancy }>("/vacancies", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.vacancy;
}

export async function updateVacancy(id: number, input: VacancyInput): Promise<Vacancy> {
  const result = await request<{ vacancy: Vacancy }>(`/vacancies/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return result.vacancy;
}

export async function deleteVacancy(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/vacancies/${id}`, { method: "DELETE" });
}

export async function getFavoriteVacancyIds(): Promise<number[]> {
  const result = await request<{ vacancyIds: number[] }>("/favorites");
  return result.vacancyIds;
}

export async function saveFavoriteVacancy(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/favorites/${id}`, { method: "POST" });
}

export async function removeFavoriteVacancy(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/favorites/${id}`, { method: "DELETE" });
}
