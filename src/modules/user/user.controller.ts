import { Request, Response } from "express";
import Controller from "@/shared/core/Controller";
import { Controller as Route, Post, Middleware } from "@/shared/core/decorators";
import { ApiBody, ApiResponse, ApiSummary, ApiTags } from "@/shared/core/decorators/index";
import UserService from "@/modules/user/user.service";
import {
  createUserSchema,
  createUserResponseSchema,
  validationErrorResponseSchema,
} from "@/modules/user/schema/user.schema";
import jwtMiddleware from "@/shared/middlewares/jwt.middleware";
import adminMiddleware from "@/shared/middlewares/admin.middleware";

@Route("/user")
@ApiTags("Usuários")
class UserController extends Controller {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  @Post("/")
  @Middleware(
    jwtMiddleware.validJWTNeeded.bind(jwtMiddleware),
    adminMiddleware.adminOnly.bind(adminMiddleware)
  )
  @ApiSummary("Criar usuário", "Cria um novo usuário no sistema. Requer autenticação JWT e permissão de administrador.")
  @ApiBody(createUserSchema, "Dados do novo usuário")
  @ApiResponse(201, "Usuário criado com sucesso", createUserResponseSchema)
  @ApiResponse(400, "Dados inválidos", validationErrorResponseSchema)
  async create(req: Request, res: Response) {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Dados inválidos",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      const data = parsed.data;
      const created = await this.userService.createUser({
        username: data.username,
        email: data.email ?? null,
        password: data.password,
        is_active: data.is_active,
        is_admin: data.is_admin,
      });

      return res.status(201).json({
        data: created,
      });
    } catch (err: any) {
      const status = Number(err?.status) || 400;
      return res.status(status).json({
        message: err?.message || "Erro ao criar usuário",
      });
    }
  }
}

export default UserController;
