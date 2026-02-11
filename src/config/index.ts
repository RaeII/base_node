import dotenv from "dotenv"
import * as path from "path";
export interface TopicConfig {
    topic: string;
    database_name: string;
    group_id: string;
}

const getEnvs = () => {
    const dotenvResult = dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  
    if(dotenvResult.error) {
      const processEnv = process.env;
  
      if(processEnv && !processEnv.error) return processEnv;
    }
  
    return dotenvResult;
}

// const envFound = dotenv.config({ path: `.env` });
const envFound:any = getEnvs();
if (envFound.error) {
    // This error should crash whole process
    throw new Error(`Couldn't find .env file. ${envFound.error}`);
}

export const env = {
    PORT: process.env.PORT,
    DB_HOSTNAME: process.env.DB_HOSTNAME,
    DB_PORT: process.env.DB_PORT,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    isProduction: process.env.NODE_ENV === "production",

    AUTHORIZATION: process.env.AUTHORIZATION,
    JWT_SECRET: process.env.JWT_SECRET,

    URL_WEBHOOK_KAFKA_ALERT: process.env.URL_WEBHOOK_KAFKA_ALERT,
    URL_WEBHOOK_ERROR_SEND_DISCORD_I: process.env.URL_WEBHOOK_ERROR_SEND_DISCORD_I
}
