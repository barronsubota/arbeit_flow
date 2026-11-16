import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createVacancy,
  deleteVacancy,
  getVacancies,
  updateVacancy,
  type AuthUser,
  type Vacancy,
} from "../lib/api";
import AdminPage from "./AdminPage";

vi.mock("../lib/api", () => ({
  createVacancy: vi.fn(),
  deleteVacancy: vi.fn(),
  getVacancies: vi.fn(),
  updateVacancy: vi.fn(),
}));

const admin: AuthUser = {
  id: 1,
  email: "admin@example.com",
  role: "admin",
};

const candidate: AuthUser = {
  id: 2,
  email: "candidate@example.com",
  role: "user",
};

const vacancy: Vacancy = {
  id: 5,
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
};

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getVacancies).mockResolvedValue([]);
    vi.mocked(createVacancy).mockResolvedValue(vacancy);
    vi.mocked(updateVacancy).mockResolvedValue(vacancy);
    vi.mocked(deleteVacancy).mockResolvedValue(undefined);
  });

  it("denies vacancy management to a candidate", () => {
    render(<AdminPage authLoading={false} user={candidate} />);

    expect(screen.getByRole("heading", { name: "Немає доступу" })).toBeDefined();
    expect(getVacancies).not.toHaveBeenCalled();
  });

  it("creates a vacancy from the administrator form", async () => {
    const user = userEvent.setup();
    render(<AdminPage authLoading={false} user={admin} />);
    await screen.findByRole("heading", { name: "Створити вакансію" });

    await user.type(screen.getByLabelText(/Назва вакансії/), "Junior QA Engineer");
    await user.type(screen.getByLabelText("Компанія *"), "Northwind");
    await user.type(screen.getByLabelText("Місто або формат *"), "Київ");
    await user.type(screen.getByLabelText("Графік роботи *"), "Віддалено");
    await user.type(screen.getByLabelText("Зарплатний діапазон *"), "20 000–30 000 ₴");
    await user.type(screen.getByLabelText("Технології через кому *"), "Manual QA, API");
    await user.type(screen.getByLabelText("Опис вакансії *"), "Перевіряй якість продукту.");
    await user.type(
      screen.getByLabelText("Вимоги, кожна з нового рядка"),
      "Уважність до деталей\nБазові знання API",
    );
    await user.click(screen.getByRole("button", { name: /Створити вакансію/ }));

    await waitFor(() => expect(createVacancy).toHaveBeenCalledWith({
      title: "Junior QA Engineer",
      company: "Northwind",
      initials: "",
      location: "Київ",
      schedule: "Віддалено",
      salary: "20 000–30 000 ₴",
      stack: ["Manual QA", "API"],
      description: "Перевіряй якість продукту.",
      requirements: ["Уважність до деталей", "Базові знання API"],
    }));
    expect(screen.getByRole("status").textContent).toContain("Вакансію створено.");
  });

  it("updates and deletes a published vacancy", async () => {
    const updatedVacancy = { ...vacancy, title: "Junior UI Developer" };
    vi.mocked(getVacancies)
      .mockResolvedValueOnce([vacancy])
      .mockResolvedValueOnce([updatedVacancy])
      .mockResolvedValueOnce([]);
    vi.mocked(updateVacancy).mockResolvedValue(updatedVacancy);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<AdminPage authLoading={false} user={admin} />);

    await screen.findByText("Junior React Developer");
    await user.click(screen.getByRole("button", { name: "Редагувати" }));
    const title = screen.getByLabelText(/Назва вакансії/);
    await user.clear(title);
    await user.type(title, "Junior UI Developer");
    await user.click(screen.getByRole("button", { name: /Зберегти зміни/ }));

    await waitFor(() => expect(updateVacancy).toHaveBeenCalledWith(5, {
      title: "Junior UI Developer",
      company: vacancy.company,
      initials: vacancy.initials,
      location: vacancy.location,
      schedule: vacancy.schedule,
      salary: vacancy.salary,
      stack: vacancy.stack,
      description: vacancy.description,
      requirements: vacancy.requirements,
    }));
    await screen.findByText("Junior UI Developer");
    await user.click(screen.getByRole("button", { name: "Видалити" }));

    await waitFor(() => expect(deleteVacancy).toHaveBeenCalledWith(5));
    expect(await screen.findByRole("status")).toBeDefined();
    expect(window.confirm).toHaveBeenCalled();
  });
});
