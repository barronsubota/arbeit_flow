const favoritesStorageKey = "arbeitflow.savedVacancyIds";

export function getSavedVacancyIds(): number[] {
  const stored = window.localStorage.getItem(favoritesStorageKey);

  if (!stored) {
    return [];
  }

  let value: unknown;

  try {
    value = JSON.parse(stored);
  } catch {
    throw new Error("Не вдалося прочитати обране з цього браузера.");
  }

  if (
    !Array.isArray(value) ||
    value.some((id) => !Number.isSafeInteger(id) || id <= 0)
  ) {
    throw new Error("Дані обраного мають некоректний формат.");
  }

  return [...new Set(value)];
}

export function setSavedVacancyIds(ids: number[]): void {
  window.localStorage.setItem(favoritesStorageKey, JSON.stringify(ids));
}
