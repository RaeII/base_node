import {
  json,
  Application,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import { connectionMiddleware } from "@/shared/utils/async_local_storage";

export default (app: Application) => {
  app.use(json({ limit: '10mb' }));

  const options: cors.CorsOptions = {
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: "http://localhost:3000",
    preflightContinue: false,
    optionsSuccessStatus: 200
  }

  app.use(cors(options));

  // Inicializa o contexto do AsyncLocalStorage por request (necessário para o MySQLService.getConnection)
  app.use(connectionMiddleware());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const err: any = new Error("Not Found");
    err["status"] = 404;
    next(err);
  });

  // error handlers
  app.use(((err: any, req: Request, res: Response, next: NextFunction) => {
    /**
     * Handle 401 thrown by express-jwt library
     */
    if (err.name === "UnauthorizedError") {
      return res.status(err.status).send({ message: err.message }).end();
    }
    return next(err);
  }) as ErrorRequestHandler);

  app.use(((err: any, req: Request, res: Response) => {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
      },
    });
  }) as ErrorRequestHandler);
};
