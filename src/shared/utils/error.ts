import type { Response } from "express";
import type { ZodSchema } from "zod";
import sendDiscord from "@/shared/utils/sendDiscord";

// ─── AppError ────────────────────────────────────────────────────

interface AppErrorIssue {
  path: string;
  message: string;
}

/**
 * Erro centralizado da aplicação.
 *
 * - `isUserError = true`  → mensagem destinada ao usuário final (validação, regra de negócio).
 *   Não gera log nem notificação no Discord.
 * - `isUserError = false` → erro interno (bug, infra). Gera log + Discord.
 *   Usuário recebe mensagem genérica.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isUserError: boolean;
  readonly issues?: AppErrorIssue[];

  constructor(
    message: string,
    statusCode: number,
    isUserError: boolean,
    issues?: AppErrorIssue[]
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isUserError = isUserError;
    this.issues = issues;
  }
}

// ─── Funções de lançamento ───────────────────────────────────────

/**
 * Lança um erro destinado ao **usuário** (validação, regra de negócio).
 * A mensagem será exibida diretamente ao usuário.
 * **Não** gera log nem envia para o Discord.
 */
export function throwUser(
  message: string,
  statusCode = 400,
  issues?: AppErrorIssue[]
): never {
  throw new AppError(message, statusCode, true, issues);
}

/**
 * Lança um erro **interno** (bug, falha de infra).
 * Gera log no console e envia notificação ao Discord.
 * Usuário recebe uma mensagem genérica.
 */
export function throwInternal(message: string, statusCode = 500): never {
  throw new AppError(message, statusCode, false);
}

// ─── Parse de Schema Zod ─────────────────────────────────────────

/**
 * Valida `data` contra um `ZodSchema`.
 * Se inválido, lança `AppError` com `isUserError = true` e issues formatados.
 * Retorna os dados tipados em caso de sucesso.
 */
export function parseSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues: AppErrorIssue[] = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new AppError("Dados inválidos", 400, true, issues);
  }

  return result.data;
}

// ─── Handler centralizado ────────────────────────────────────────

const GENERIC_MESSAGE = "Ocorreu um erro interno";

/**
 * Trata qualquer erro e envia a resposta HTTP adequada.
 *
 * - **AppError (isUserError)**: responde com a mensagem real + issues (se houver).
 * - **AppError (interno)** ou **Error genérico**: loga, envia pro Discord,
 *   responde com mensagem genérica.
 */
export function handleError(error: unknown, res: Response): Response {
  // ── AppError conhecido ──
  if (error instanceof AppError) {
    if (error.isUserError) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.issues && { issues: error.issues }),
      });
    }

    // Erro interno — loga + Discord
    logAndNotify(error.message, error);

    return res.status(error.statusCode).json({
      message: GENERIC_MESSAGE,
    });
  }

  // ── Erro inesperado (não é AppError) ──
  logAndNotify(
    error instanceof Error ? error.message : String(error),
    error
  );

  return res.status(500).json({
    message: GENERIC_MESSAGE,
  });
}

// ─── Helpers internos ────────────────────────────────────────────

function logAndNotify(message: string, error: unknown): void {
  console.error(`[AppError] ${message}`);
  if (error instanceof Error && error.stack) console.error(error.stack);

  // Fire-and-forget — não bloqueia a resposta
  sendDiscord
    .sendErrorAlert(message, error)
    .catch((discordErr) => {
      console.error("[AppError] Falha ao notificar Discord:", discordErr);
    });
}

