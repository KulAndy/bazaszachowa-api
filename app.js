const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

const app = express();
const port = 3000;
const cors = require("cors");

const playerRouter = require("./route/player");
const playersRouter = require("./route/players");
const gameRouter = require("./route/game");
const gamesRouter = require("./route/games");
const mailRouter = require("./route/mail");
const baseRouter = require("./route/base");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.options("*", cors());

const redirectLegacyUrls = require("./route/legacy");
app.use(redirectLegacyUrls);
app.use("/player", playerRouter);
app.use("/players", playersRouter);
app.use("/game", gameRouter);
app.use("/games", gamesRouter);
app.use("/mail", mailRouter);
app.use("/base", baseRouter);

app.get("/", (req, res) => {
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
      fs.unlink(path.join("uploads", file), (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return;
        }
      });
    }
  });
});

app.listen(port, () => {
  console.info(`Server is listening on port ${port}`);
});
