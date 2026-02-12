import express, { Application } from "express";
import { env } from "@/config";
import loaders from "@/shared/loaders";
import { registerControllers } from "@/shared/core/registerControllers";
import { setupSwagger } from "@/shared/core/swagger/swagger.setup";
import AuthController from "@/modules/auth/auth.controller";
import UserController from "@/modules/user/user.controller";

const controllers = [
	AuthController,
	UserController,
];

async function startServer() {
	const app: Application = express();

	// Registra os controllers decorados automaticamente
	registerControllers(app, "/api", controllers);

	// Configura o Swagger UI com documentação gerada automaticamente
	setupSwagger(app, "/api", controllers, {
		title: "Back Node API",
		description: "Documentação",
		version: "1.0.0",
		servers: [
			{
				url: `http://localhost:${env.PORT}`,
				description: "Servidor de desenvolvimento",
			},
		],
	});

	await loaders(app);
	app.listen(env.PORT, () => {
		console.log(`
			##############################
			Server listening on port: ${env.PORT}
			##############################`);
	}).on("error", (err: any) => {
		console.log(err);
		process.exit(1);
	});

}

startServer();