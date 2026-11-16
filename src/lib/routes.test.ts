import { describe, expect, it } from "vitest";
import { getCurrentRoute, getRouteHref } from "./routes";

describe("base-path routing", () => {
  it("normalizes routes when hosted under a repository path", () => {
    expect(getCurrentRoute("/arbeitflow/vacancies", "/arbeitflow/")).toBe("/vacancies");
    expect(getCurrentRoute("/arbeitflow/", "/arbeitflow/")).toBe("/");
    expect(getRouteHref("/vacancies", "/arbeitflow/")).toBe("/arbeitflow/vacancies");
    expect(getRouteHref("/", "/arbeitflow/")).toBe("/arbeitflow/");
  });

  it("keeps root-hosted routes unchanged", () => {
    expect(getCurrentRoute("/contacts", "/")).toBe("/contacts");
    expect(getRouteHref("/contacts", "/")).toBe("/contacts");
  });
});
