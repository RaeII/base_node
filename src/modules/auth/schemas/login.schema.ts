import { z } from "zod";

const optionalTrimmedString = () =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined));

/**
 * Schema de validação da rota de login.
 * Aceita exatamente UM identificador: login (genérico), email OU username.
 */
export const loginSchema = z
  .object({
    login: optionalTrimmedString().pipe(
      z
        .string()
        .min(3, "login deve ter no mínimo 3 caracteres")
        .max(255, "login deve ter no máximo 255 caracteres")
        .optional()
    ),
    email: optionalTrimmedString().pipe(
      z
        .string()
        .max(45, "email deve ter no máximo 45 caracteres")
        .email("email inválido")
        .optional()
    ),
    username: optionalTrimmedString().pipe(
      z
        .string()
        .min(3, "username deve ter no mínimo 3 caracteres")
        .max(45, "username deve ter no máximo 45 caracteres")
        .optional()
    ),
    password: z
      .string({ error: "password é obrigatório" })
      .min(6, "password deve ter no mínimo 6 caracteres")
      .max(255, "password deve ter no máximo 255 caracteres"),
  })
  .strict()
  .superRefine((val, ctx) => {
    const provided = [val.login, val.email, val.username].filter(
      (v) => typeof v === "string" && v.length > 0
    );

    if (provided.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["login"],
        message: "Informe exatamente um identificador: login, email ou username",
      });
    }
  });

export type LoginSchema = z.infer<typeof loginSchema>;

