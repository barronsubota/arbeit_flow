import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import VacanciesPage from "./VacanciesPage";

describe("VacanciesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("filters static vacancies by search query and location", async () => {
    const user = userEvent.setup();
    render(<VacanciesPage />);

    expect(screen.getByText("Junior Frontend Developer")).toBeDefined();
    const search = screen.getByRole("searchbox", {
      name: "Посада, компанія або технологія",
    });
    await user.type(search, "React");

    expect(screen.getByText("Junior Frontend Developer")).toBeDefined();
    expect(screen.queryByText("Junior Node.js Developer")).toBeNull();

    await user.clear(search);
    await user.type(
      screen.getByRole("searchbox", { name: "Місто або формат роботи" }),
      "Львів",
    );

    expect(screen.getByText("Junior Node.js Developer")).toBeDefined();
    expect(screen.queryByText("Junior Frontend Developer")).toBeNull();
  });

  it("saves favorites in this browser and restores them on a new visit", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<VacanciesPage />);

    await user.click(screen.getByRole("button", { name: "Зберегти Junior Frontend Developer" }));
    expect(window.localStorage.getItem("arbeitflow.savedVacancyIds")).toBe("[1]");

    await user.click(screen.getByRole("button", { name: /Збережені/ }));
    expect(screen.getByText("Junior Frontend Developer")).toBeDefined();
    expect(screen.queryByText("Junior Node.js Developer")).toBeNull();

    unmount();
    render(<VacanciesPage />);

    expect(
      screen.getByRole("button", { name: "Видалити Junior Frontend Developer з обраного" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await user.click(screen.getByRole("button", { name: /Збережені/ }));
    expect(screen.getByText("Junior Frontend Developer")).toBeDefined();
  });

  it("reports invalid saved-vacancy data instead of silently ignoring it", () => {
    window.localStorage.setItem("arbeitflow.savedVacancyIds", "{");

    render(<VacanciesPage />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Не вдалося прочитати обране з цього браузера.",
    );
  });
});
