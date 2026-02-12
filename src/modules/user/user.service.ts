import * as bcrypt from "bcrypt";
import UserDatabase from "@/modules/user/user.database";
import type { AuthenticateUserInput, CreateUserInput, DbUserRow, PublicUser } from "./schema/user.schema";
import { throwUser, throwInternal } from "@/shared/utils/error";


function toPublicUser(row: DbUserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    is_active: Number(row.is_active) === 1,
    is_admin: Number(row.is_admin) === 1,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default class UserService {
  private userDb: UserDatabase;

  constructor() {
    this.userDb = new UserDatabase();
  }

  /**
   * Autentica um usuário por email ou username + senha.
   * Retorna APENAS dados públicos (nunca retorna hash da senha).
   */
  async authenticate(input: AuthenticateUserInput): Promise<PublicUser> {
    const identifier = input.identifier.trim();
    const password = input.password;

    const row = await this.userDb.findByUsernameOrEmail(identifier);

    if (!row) {
      throwUser("Credenciais inválidas", 401);
    }

    const ok = bcrypt.compare(password, row.password);
    if (!row.password || !ok) {
      throwUser("Credenciais inválidas", 401);
    }

    const isActive = Number(row.is_active) === 1;
    if (!isActive) {
      throwUser("Usuário não encontrado", 403);
    }

    await this.userDb.updateLastLoginAt(row.id);
    const updated = await this.userDb.findById(row.id);
    return toPublicUser(updated || row);
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const existingByUsername = await this.userDb.findByUsername(input.username);
    if (existingByUsername) {
      throwUser("Username já está em uso", 409);
    }

    if (input.email) {
      const existingByEmail = await this.userDb.findByEmail(input.email);
      if (existingByEmail) {
        throwUser("E-mail já está em uso", 409);
      }
    }

    // Custo equilibrado para API (ajuste se necessário)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const created = await this.userDb.createUser({
      username: input.username,
      email: input.email ?? null,
      passwordHash,
      isActive: input.is_active ? true : false,
      isAdmin: input.is_admin ? true : false,
    });

    const row = await this.userDb.findById(created.id);
    if (!row) {
      throwInternal("Falha ao criar usuário");
    }

    return toPublicUser(row);
  }
}
