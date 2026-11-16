import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFavoriteVacancyIds,
  getVacancies,
  removeFavoriteVacancy,
  saveFavoriteVacancy,
  type AuthUser,
  type Vacancy,
} from "../lib/api";
import VacanciesPage from "./VacanciesPage";

vi.mock("../lib/api", () => ({
  getFavoriteVacancyIds: vi.fn(),
  getVacancies: vi.fn(),
  removeFavoriteVacancy: vi.fn(),
  saveFavoriteVacancy: vi.fn(),
}));

const vacancies: Vacancy[] = [
  {
    id: 1,
    title: "Junior React Developer",
    company: "Northwind",
    initials: "NW",
    location: "Київ",
    schedule: "Віддалено",
    salary: "25 000–40 000 ₴",
    stack: ["React", "TypeScript"],
    description: "Розвивай інтерфейси у команді.",
    requirements: ["Знання React"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "Junior Python Developer",
    company: "Contoso",
    initials: "CO",
    location: "Львів",
    schedule: "Гібридно",
    salary: "24 000–38 000 ₴",
    stack: ["Python", "Django"],
    description: "Працюй над backend-сервісами.",
    requirements: ["Основи Python"],
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

const candidate: AuthUser = {
  id: 3,
  email: "candidate@example.com",
  role: "user",
};

describe("VacanciesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getVacancies).mockResolvedValue(vacancies);
    vi.mocked(getFavoriteVacancyIds).mockResolvedValue([]);
    vi.mocked(saveFavoriteVacancy).mockResolvedValue(undefined);
    vi.mocked(removeFavoriteVacancy).mockResolvedValue(undefined);
  });

  it("filters vacancies by search query and location", async () => {
    const user = userEvent.setup();
    render(<VacanciesPage user={null} />);

    await screen.findByText("Junior React Developer");
    const search = screen.getByRole("searchbox", {
      name: "Посада, компанія або технологія",
    });
    await user.type(search, "React");

    expect(screen.getByText("Junior React Developer")).toBeDefined();
    expect(screen.queryByText("Junior Python Developer")).toBeNull();

    await user.clear(search);
    await user.type(
      screen.getByRole("searchbox", { name: "Місто або формат роботи" }),
      "Львів",
    );

    expect(screen.getByText("Junior Python Developer")).toBeDefined();
    expect(screen.queryByText("Junior React Developer")).toBeNull();
  });

  it("saves and removes favorites and filters the saved list", async () => {
    const user = userEvent.setup();
    render(<VacanciesPage user={candidate} />);
    await screen.findByText("Junior React Developer");

    await user.click(screen.getByRole("button", { name: "Зберегти Junior React Developer" }));
    await waitFor(() => expect(saveFavoriteVacancy).toHaveBeenCalledWith(1));
    const removeButton = await screen.findByRole("button", {
      name: "Видалити Junior React Developer з обраного",
    });
    expect(removeButton.getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: /Збережені/ }));
    expect(screen.getByText("Junior React Developer")).toBeDefined();
    expect(screen.queryByText("Junior Python Developer")).toBeNull();

    await user.click(removeButton);
    await waitFor(() => expect(removeFavoriteVacancy).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Збережених вакансій поки немає")).toBeDefined();
  });

  it("requires sign-in before saving a vacancy", async () => {
    const user = userEvent.setup();
    render(<VacanciesPage user={null} />);
    await screen.findByText("Junior React Developer");

    await user.click(screen.getByRole("button", { name: "Зберегти Junior React Developer" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Увійдіть до акаунта, щоб зберігати вакансії.",
    );
    expect(saveFavoriteVacancy).not.toHaveBeenCalled();
  });
});
