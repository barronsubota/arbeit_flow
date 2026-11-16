import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const baseSegments = (env.VITE_BASE_PATH || "/").split("/").filter(Boolean);
  const base = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";

  return {
    base,
    plugins: [react()],
  };
});
