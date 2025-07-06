const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const axios = require("axios");

const app = express();
const port = 3000;
const cors = require("cors");

const RESOURCES = require("./app/resources.js");
const BASE = require("./app/base.js");
const DRAWER = require("./app/drawer.js");
const SETTINGS = require("./app/settings.js");
const CHESS = require("./app/chess.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.options("*", cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 200 },
}).single("attachment");

app.get("/", (req, res) => {
  res.send("API");
});

app.all("/cr_data/:player", async (req, res) => {
  if (req.params.player) {
    const player = req.params.player;
    RESOURCES.crData(player)
      .then((result) => res.json(result))
      .catch((error) => {
        console.error("====================================");
        console.error(error);
        console.error("====================================");
        res.status(503).json([]);
      });
  } else {
    res.status(400);
  }
});

app.all("/fide_data/:player", (req, res) => {
  if (req.params.player) {
    const player = req.params.player;
    BASE.fideData(player)
      .then((result) => res.json(result))
      .catch((error) => {
        res.status(503).json([]);
        console.error("====================================");
        console.error(error);
        console.error("====================================");
      });
  } else {
    res.status(400);
  }
});

app.all("/game/:base/:id", (req, res) => {
  if (req.params.base || req.params.id) {
    const base = req.params.base;
    const id = req.params.id;
    BASE.getGame(id, base)
      .then((result) =>
        result.map((item) => ({
          ...item,
          moves: CHESS.movesBin2obj(item.moves),
        }))
      )
      .then((result) => res.json(result))
      .catch((error) => {
        res.status(400).send([
          {
            id: 12347922,
            moves: [],
            Event: null,
            Site: null,
            Year: null,
            Month: null,
            Day: null,
            Round: null,
            White: "N, N",
            Black: "N, N",
            Result: "0-1",
            WhiteElo: null,
            BlackElo: null,
            ECO: null,
          },
        ]);
        console.error("====================================");
        console.error(error);
        console.error("====================================");
      });
  } else {
    res.status(400);
  }
});

app.all("/graph/:format/:player", async (req, res) => {
  if (req.params.format || req.params.player) {
    const format = req.params.format;
    const player = req.params.player;
    let elo_history = await BASE.eloHistory(player);
    if (format == "jpeg") {
      DRAWER.eloJPEG(elo_history, player)
        .then((result) => {
          res.setHeader("Content-Type", "image/jpeg");
          res.send(result);
        })
        .catch(() => {
          res.status(404).json(null);
        });
    } else if (format == "svg") {
      DRAWER.eloSVG(elo_history, player)
        .then((result) => {
          res.setHeader("Content-Type", "image/svg+xml");
          res.send(result);
        })
        .catch(() => {
          res.status(404).json(null);
        });
    } else {
      res.status(400).json(null);
    }
  } else {
    res.status(400).json(null);
  }
});

app.all("/min_max_year_elo/:player", (req, res) => {
  if (req.params.player) {
    const player = req.params.player;
    BASE.minMaxYearEco(player)
      .then((result) => res.send(result))
      .catch((error) =>
        res.status(400).send([{ maxElo: null, minYear: null, maxYear: null }])
      );
  } else {
    res.status(400);
  }
});

app.all("/player_opening_stats/:player", (req, res) => {
  if (req.params.player) {
    const player = req.params.player;
    BASE.playerOpeningStats(player)
      .then((result) => res.send(result))
      .catch((error) =>
        res.status(400).send([{ maxElo: null, minYear: null, maxYear: null }])
      );
  } else {
    res.status(400);
  }
});

app.all("/search_game", (req, res) => {
  if (req.query || req.body) {
    let params = {};
    if (req.method == "GET") {
      params = req.query;
    } else {
      params = req.body;
    }
    if (params.white || params.black) {
      BASE.searchGames(params)
        .then((result) =>
          result.map((item) => ({
            ...item,
            moves: CHESS.movesBin2obj(item.moves),
          }))
        )
        .then((result) => {
          res.json({ table: params.table || "all", rows: result });
        })
        .catch((error) => {
          console.error("====================================");
          console.error(error);
          console.error("====================================");
          res.status(503).json([]);
        });
    } else {
      res.status(400).send([]);
    }
  } else {
    res.status(400);
  }
});

app.all("/search_player_opening_game/:player/:color/:opening?", (req, res) => {
  const player = req.params.player;
  const color = req.params.color;
  const opening = req.params.opening || null;
  if (["white", "black"].includes(color)) {
    BASE.searchPlayerOpeningGame(player, color, opening)
      .then((result) =>
        result.map((item) => ({
          ...item,
          moves: CHESS.movesBin2obj(item.moves),
        }))
      )
      .then((result) => res.json(result))
      .catch((error) => {
        res.status(503).json([]);
        console.error("====================================");
        console.error(error);
        console.error("====================================");
      });
  } else {
    res.status(400).send([]);
  }
});

app.all("/search_player/:player", (req, res) => {
  const player = req.params.player;
  BASE.searchPlayer(player, "all")
    .then((result) => res.json(result))
    .catch((error) => {
      res.status(503).json([]);
      console.error("====================================");
      console.error(error);
      console.error("====================================");
    });
});

app.post("/send-email", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("====================================");
      console.error(err);
      console.error("====================================");
      return res.status(400).send("Error uploading file");
    }

    const { email, subject, content } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400);
    }

    const transporter = nodemailer.createTransport({
      host: SETTINGS.mailServer,
      port: SETTINGS.mailPort.smtp[SETTINGS.mailPort.smtp.length - 1],
      secure: false,
      auth: {
        user: SETTINGS.mailUser,
        pass: SETTINGS.mailPassword,
      },
      replyTo: email,
    });

    const mailOptions = {
      from: SETTINGS.mailUser,
      to: SETTINGS.adminContact,
      subject: subject,
      text: content + "\n\n kontakt " + email,
      attachments: [],
    };

    if (req.file) {
      mailOptions.attachments.push({
        filename: req.file.originalname,
        path: req.file.path,
      });
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("====================================");
        console.error(error);
        console.error("====================================");
        return res.status(500).send(error.toString());
      }
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.send("Email sent: " + info.response);
    });
  });
});

const getFileMetaData = (fileId) => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,modifiedTime,webViewLink,size&key=${SETTINGS.key}`;
  return axios.get(url);
};

app.get("/base-dumps", async (req, res) => {
  try {
    const responses = await Promise.all([
      getFileMetaData("1g7LmtRscJUIURSG3_6-rbX9n5TyrtgTb"),
      getFileMetaData("1D8BNRql7XHrhlhUXp-fSnIFZvT0jVF-y"),
    ]);

    const fileMetaData = responses.map((response) => response.data);

    res.json(fileMetaData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
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
