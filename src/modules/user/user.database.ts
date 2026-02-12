import Database from "@/shared/infra/database/Database";
import type { CreateUserDbInput, DbUserRow } from "./schema/user.schema";

export default class UserDatabase extends Database {
  async findByUsername(username: string): Promise<DbUserRow | null> {
    const [rows] = await this.query("SELECT * FROM user WHERE username = ? LIMIT 1", [username]);
    const row = (rows as DbUserRow[])?.[0];
    return row || null;
  }

  async findByEmail(email: string): Promise<DbUserRow | null> {
    const [rows] = await this.query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);
    const row = (rows as DbUserRow[])?.[0];
    return row || null;
  }

  async findByUsernameOrEmail(identifier: string): Promise<DbUserRow | null> {
    const [rows] = await this.query(
      "SELECT * FROM user WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier]
    );
    const row = (rows as DbUserRow[])?.[0];
    return row || null;
  }

  async createUser(input: CreateUserDbInput): Promise<{ id: number }> {
    const sql = `
      INSERT INTO user
        (username, email, password, is_active, is_admin, last_login_at)
      VALUES
        (?, ?, ?, ?, ?, NULL)
    `.trim();

    const [result] = await this.query(sql, [
      input.username,
      input.email,
      input.passwordHash,
      input.isActive,
      input.isAdmin,
    ]);

    // mysql2: ResultSetHeader
    const insertId = (result as any)?.insertId;
    return { id: Number(insertId) };
  }

  async findById(id: number): Promise<DbUserRow | null> {
    const [rows] = await this.query("SELECT * FROM user WHERE id = ? LIMIT 1", [id]);
    const row = (rows as DbUserRow[])?.[0];
    return row || null;
  }

  async updateLastLoginAt(id: number): Promise<void> {
    await this.query("UPDATE user SET last_login_at = NOW() WHERE id = ? LIMIT 1", [id]);
  }
}

