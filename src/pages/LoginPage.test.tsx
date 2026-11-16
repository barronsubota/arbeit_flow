import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, type AuthUser } from "../lib/api";
import LoginPage from "./LoginPage";

vi.mock("../lib/api", () => ({
  login: vi.fn(),
}));

const admin: AuthUser = {
  id: 1,
  email: "admin@example.com",
  role: "admin",
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the authenticated account to the application", async () => {
    const onLogin = vi.fn();
    vi.mocked(login).mockResolvedValue(admin);
    render(<LoginPage onLogin={onLogin} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), admin.email);
    await user.type(screen.getByLabelText("Пароль"), "valid-password");
    await user.click(screen.getByRole("button", { name: /Увійти/ }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(admin));
    expect(login).toHaveBeenCalledWith(admin.email, "valid-password");
  });

  it("shows the API error when authentication fails", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Неправильна електронна адреса або пароль."));
    render(<LoginPage onLogin={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Пароль"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /Увійти/ }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Неправильна електронна адреса або пароль.");
    expect((screen.getByRole("button", { name: /Увійти/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});
