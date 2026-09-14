import fs from "node:fs";
import path from "node:path";

import compress from "@fastify/compress";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import Fastify, { LogController } from "fastify";
import { schedule } from "node-cron";

import logger, { loggerConfig } from "./app/logger";
import baseRouter from "./route/base";
import gameRouter from "./route/game";
import gamesRouter from "./route/games";
import mailRouter from "./route/mail";
import playerRouter from "./route/player";
import playersRouter from "./route/players";

const app = Fastify({
  logController: new LogController({
    disableRequestLogging: () => true,
  }),
  logger: loggerConfig,
});

const port = 3000;

app.register(helmet);
app.register(compress);
app.register(cors, {
  origin: true,
});

app.register(rateLimit, {
  errorResponseBuilder: () => ({
    message: "Too many requests from this IP, try again later.",
  }),
  max: 500,
  timeWindow: "1 minute",
});

app.register(staticPlugin, {
  prefix: "/uploads/",
  root: path.join(process.cwd(), "uploads"),
});

app.register(playerRouter, { prefix: "/player" });
app.register(playersRouter, { prefix: "/players" });
app.register(gameRouter, { prefix: "/game" });
app.register(gamesRouter, { prefix: "/games" });
app.register(mailRouter, { prefix: "/mail" });
app.register(baseRouter, { prefix: "/base" });

app.all("/", () => {
  return "API";
});

schedule("0 0 * * *", async () => {
  try {
    const files = await fs.promises.readdir("uploads");

    await Promise.all(
      files.map((file) =>
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.promises.unlink(path.join("uploads", file)).catch((error) => {
          logger.error({ err: error, file }, "Error deleting file");
        }),
      ),
    );
  } catch (error) {
    logger.error({ err: error }, "Error reading directory");
  }
});

app.listen({ host: "0.0.0.0", port }, (error, address) => {
  if (error) {
    logger.fatal({ err: error }, "Error starting server");
    throw error;
  }

  logger.info({ address }, "Server is listening");
});
