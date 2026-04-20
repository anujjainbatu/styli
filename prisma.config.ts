import { expand } from "dotenv-expand"
import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Load .env.local first (takes priority), then .env
expand(config({ path: ".env.local", override: false }))
expand(config({ path: ".env", override: false }))

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
})
