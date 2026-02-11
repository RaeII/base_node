import { Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import Controller from "@/shared/core/Controller";
import { Controller as Route, Post, Middleware } from "@/shared/core/decorators";
import { ApiBody, ApiResponse, ApiSummary, ApiTags } from "@/shared/core/decorators/index";
import { env } from "@/config";
import UserService from "@/modules/user/user.service";
import { loginSchema } from "@/modules/auth/schemas/login.schema";
import jwtMiddleware from "@/shared/middlewares/jwt.middleware";
import adminMiddleware from "@/shared/middlewares/admin.middleware";

@Route("/auth")
@ApiTags("Autenticação")
class AuthController extends Controller {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  @Post("/create-jwt")
  @Middleware(
    jwtMiddleware.validJWTNeeded.bind(jwtMiddleware),
    adminMiddleware.adminOnly.bind(adminMiddleware)
  )
  @ApiSummary("Gerar token JWT", "Gera um token JWT para um nome específico. Requer autenticação e permissão de administrador.")
  @ApiBody(z.object({
    name: z.string(),
  }), "Dados para geração do token")
  @ApiResponse(200, "Token gerado com sucesso", z.object({
    accessToken: z.string(),
    expiresIn: z.number(),
  }))
  @ApiResponse(400, "Erro ao gerar token", z.object({
    message: z.string(),
  }))
  async createJWT(req: Request, res: Response) {
    try {
      const { name }: { name: string } = req.body;

      const jwtSecret = process.env.JWT_SECRET || "default_secret_key";
      const expiresIn = 60 * 60 * 24 * 30; // 30 dias

      const payload = {
        name,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn });

      return this.sendSuccessResponse(res, {
        accessToken: token,
        expiresIn: expiresIn,
      });
    } catch (err) {
      return this.sendErrorMessage(
        res,
        err,
        "Erro ao gerar token de autenticação"
      );
    }
  }

  @Post("/login")
  @ApiSummary("Login", "Autentica um usuário com login/email/username e senha. Retorna um cookie JWT.")
  @ApiBody(loginSchema, "Credenciais de acesso")
  @ApiResponse(200, "Login realizado com sucesso", z.object({
    data: z.object({
      id: z.number(),
      username: z.string(),
      email: z.string().nullable(),
      is_active: z.boolean(),
      is_admin: z.boolean(),
    }),
    expiresIn: z.number(),
  }))
  @ApiResponse(400, "Credenciais inválidas", z.object({
    message: z.string(),
    issues: z.array(z.object({
      path: z.string(),
      message: z.string(),
    })).optional(),
  }))
  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          status: "ERROR",
          message: "Dados inválidos",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      const { login, email, username, password } = parsed.data;
      const identifier = (login || email || username || "").trim();

      const user = await this.userService.authenticate({
        identifier,
        password,
      });

      const jwtSecret = env.JWT_SECRET || "default_secret_key";
      const expiresIn = 60 * 60 * 24 * 30; // 30 dias

      const payload = {
        sub: String(user.id),
        userId: user.id,
        username: user.username,
        email: user.email,
        admin: user.is_admin,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn });

      res.cookie("token_access", token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        maxAge: expiresIn,
        path: "/",
        domain: env.isProduction ? ".example.com" : "localhost",
      });

      return res.status(200).json({
        data: user,
        expiresIn,
      });
    } catch (err: any) {
      const status = Number(err?.status) || 400;
      return res.status(status).json({
        message: err?.message || "Erro ao autenticar",
      });
    }
  }
}

export default AuthController;