import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ContactsPage from "./ContactsPage";

describe("ContactsPage", () => {
  it("shows a confirmation for valid input and clears it after an edit", async () => {
    const user = userEvent.setup();
    render(<ContactsPage />);

    await user.type(screen.getByLabelText(/Ім'я/), "Олена");
    await user.type(screen.getByLabelText(/Email/), "olena@example.com");
    await user.selectOptions(screen.getByLabelText(/Тема звернення/), "Пошук вакансій");
    const message = screen.getByLabelText(/Повідомлення/);
    await user.type(message, "Допоможіть знайти вакансію для початківця.");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Перевірити форму/ }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("Надсилання повідомлень ще не підключено.");

    await user.type(message, " Дякую.");

    expect(screen.queryByRole("status")).toBeNull();
  });
});
