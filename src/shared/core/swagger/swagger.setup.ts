import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSpec, SwaggerConfig } from "./swagger.generator";

type ControllerClass = new (...args: any[]) => any;

/**
 * Configura e monta o Swagger UI no Express.
 *
 * @param app          Instância do Express
 * @param prefix       Prefixo global das rotas (ex: "/api")
 * @param controllers  Array de classes controller decoradas
 * @param config       Configuração do Swagger
 * @param docsPath     Caminho onde o Swagger UI será montado (default: "/api-docs")
 */
export function setupSwagger(
  app: Application,
  prefix: string,
  controllers: ControllerClass[],
  config: SwaggerConfig,
  docsPath: string = "/api-docs"
): void {
  const spec = generateSwaggerSpec(prefix, controllers, config);

  // Endpoint para acessar o JSON da spec (registrado ANTES do Swagger UI)
  app.get(`${docsPath}-json`, (_req, res) => {
    res.json(spec);
  });

  // Swagger UI
  app.use(
    docsPath,
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2rem; }
      `,
      customSiteTitle: config.title,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  console.log(`  📖 Swagger UI disponível em: ${docsPath}`);
  console.log(`  📄 Swagger JSON disponível em: ${docsPath}-json`);
}

