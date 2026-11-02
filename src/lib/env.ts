import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL válida."),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET é obrigatório."),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL deve ser uma URL válida."),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOSTNAME: z.string().default("0.0.0.0"),
  NEXT_TELEMETRY_DISABLED: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success && parsed.data.NODE_ENV === "production" && parsed.data.BETTER_AUTH_SECRET.length < 32) {
    console.warn("BETTER_AUTH_SECRET tem menos de 32 caracteres em produção.");
  }
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }
  return parsed.data;
}

// Valida na importação: falha cedo se algo estiver faltando.
export const env = loadEnv();
