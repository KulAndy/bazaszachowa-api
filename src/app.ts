import fs from "node:fs";
import path from "node:path";

import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import cron from "node-cron";

import baseRouter from "./route/base";
import gameRouter from "./route/game";
import gamesRouter from "./route/games";
import mailRouter from "./route/mail";
import playerRouter from "./route/player";
import playersRouter from "./route/players";

const app = express();
const port = 3000;

app.use(helmet());
app.use(hpp());
app.use(compression());

const limiter = rateLimit({
  max: 500,
  message: "Too many requests from this IP, try again later.",
  windowMs: 60 * 1000,
});
app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// eslint-disable-next-line sonarjs/cors
app.use(cors());
app.options("/", cors());

app.use("/uploads", express.static("uploads"));
app.use("/player", playerRouter);
app.use("/players", playersRouter);
app.use("/game", gameRouter);
app.use("/games", gamesRouter);
app.use("/mail", mailRouter);
app.use("/base", baseRouter);

app.get("/", (_request, response) => {
  response.send("API");
});

cron.schedule("0 0 * * *", () => {
  fs.promises
    .readdir("uploads")
    .then((files) => {
      // eslint-disable-next-line promise/always-return
      for (const file of files) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename, promise/no-nesting
        fs.promises.unlink(path.join("uploads", file)).catch((unlinkError) => {
          console.error("Error deleting file:", unlinkError);
        });
      }
    })
    .catch((error) => {
      console.error("====================================");
      console.error("Error reading directory:", error);
      console.error("====================================");
    });
});

app.listen(port, () => {
  console.info(`Server is listening on port ${port}`);
});
