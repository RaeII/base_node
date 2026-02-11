import { z } from "zod";

// ─── Schemas de Validação (entrada) ─────────────────────────────

/**
 * Schema de validação da rota de criação de usuário.
 * Mantido separado do controller para manter o controller "magro".
 */
export const createUserSchema = z
  .object({
    username: z
      .string({ error: "username é obrigatório" })
      .trim()
      .min(3, "username deve ter no mínimo 3 caracteres")
      .max(45, "username deve ter no máximo 45 caracteres"),
    email: z
      .string()
      .trim()
      .max(45, "email deve ter no máximo 45 caracteres")
      .pipe(z.email({ error: "email inválido" }))
      .optional()
      .or(z.literal("").transform(() => undefined)),
    password: z
      .string({ error: "password é obrigatório" })
      .min(6, "password deve ter no mínimo 6 caracteres")
      .max(255, "password deve ter no máximo 255 caracteres"),
    is_active: z.boolean().optional().default(true),
    is_admin: z.boolean().optional().default(false),
  })
  .strict();

export type CreateUserSchema = z.infer<typeof createUserSchema>;

// ─── Schemas de Resposta (documentação Swagger) ─────────────────

/** Schema de resposta de sucesso ao criar usuário (201) */
export const createUserResponseSchema = z.object({
  data: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().nullable(),
    is_active: z.boolean(),
    is_admin: z.boolean(),
  }),
});

/** Schema de resposta de erro de validação (400) */
export const validationErrorResponseSchema = z.object({
  message: z.string(),
  issues: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});
