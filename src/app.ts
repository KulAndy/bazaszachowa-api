import express from "express";
import bodyParser from "body-parser";
import path from "node:path";
import fs from "node:fs";
import cron from "node-cron";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";

import playerRouter from "./route/player";
import playersRouter from "./route/players";
import gameRouter from "./route/game";
import gamesRouter from "./route/games";
import mailRouter from "./route/mail";
import baseRouter from "./route/base";
import redirectLegacyUrls from "./route/legacy";

const app = express();
const port = 3000;

app.use(helmet());
app.use(hpp());
app.use(compression());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, try again later.",
});
app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());

app.use("/uploads", express.static("uploads"));
app.use(redirectLegacyUrls);
app.use("/player", playerRouter);
app.use("/players", playersRouter);
app.use("/game", gameRouter);
app.use("/games", gamesRouter);
app.use("/mail", mailRouter);
app.use("/base", baseRouter);

app.get("/", (_req, res) => {
  res.send("API");
});

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

// ===== Start Server =====
app.listen(port, () => {
  console.info(`Server is listening on port ${port}`);
});
