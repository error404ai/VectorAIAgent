import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "src/electron/migrations",
  schema: "./src/electron/db/schema",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./data/local.db",
  },
});
