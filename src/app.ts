import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import path from "node:path";
import fs from "node:fs";
import cron from "node-cron";
import cors from "cors";

import playerRouter from "./route/player";
import playersRouter from "./route/players";
import gameRouter from "./route/game";
import gamesRouter from "./route/games";
import mailRouter from "./route/mail";
import baseRouter from "./route/base";
import redirectLegacyUrls from "./route/legacy";

const app: Express = express();
const port: number = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.options("*", cors());

app.use(redirectLegacyUrls);
app.use("/player", playerRouter);
app.use("/players", playersRouter);
app.use("/game", gameRouter);
app.use("/games", gamesRouter);
app.use("/mail", mailRouter);
app.use("/base", baseRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API");
});

// Schedule a task to run every day at midnight
cron.schedule("0 0 * * *", () => {
  fs.readdir("uploads", (err, files) => {
    if (err) {
      console.error("====================================");
      console.error("Error reading directory:", err);
      console.error("====================================");
      return;
    }

    for (const file of files) {
      fs.unlink(path.join("uploads", file), (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
        }
      });
    }
  });
});

app.listen(port, () => {
  console.info(`Server is listening on port ${port}`);
});
