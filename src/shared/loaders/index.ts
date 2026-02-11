import { Application } from "express";
import { env } from "@/config";

import expressLoader from "./express";
import MysqlService from "@/shared/infra/database/MySQLService";

export default async (app: Application) => {
  console.log("Initializing loaders...");

  if(!env.JWT_SECRET) throw new Error("JWT_SECRET não está definido");

  MysqlService.initialize();
  expressLoader(app);
  console.log("Express loaded.");
};
