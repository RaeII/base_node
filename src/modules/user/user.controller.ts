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
import { parseSchema, handleError } from "@/shared/utils/error";
import MysqlService from '@/shared/infra/database/MySQLService';


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
      const data = parseSchema(createUserSchema, req.body);

      await MysqlService.beginTransaction();

      const created = await this.userService.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        is_active: data.is_active,
        is_admin: data.is_admin,
      });

      await MysqlService.commit();

      return res.status(201).json({
        data: created,
      });
    } catch (err) {
      await MysqlService.rollback();
      return handleError(err, res);
    }
  }
}

export default UserController;
