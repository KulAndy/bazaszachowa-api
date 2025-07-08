const express = require("express");
const router = express.Router();
const BASE = require("../app/base");
const CHESS = require("../app/chess");

router.all("/", async (req, res) => {
  const params = req.method === "GET" ? req.query : req.body;
  if (!params.white && !params.black) return res.status(400).send([]);

  try {
    const result = await BASE.searchGames(params);
    const parsed = result.map((item) => ({
      ...item,
      moves: CHESS.movesBin2obj(item.moves),
    }));
    res.json({ table: params.table || "all", rows: parsed });
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

router.all("/opening/:player/:color/:opening?", async (req, res) => {
  const { player, color, opening = null } = req.params;
  if (!["white", "black"].includes(color)) return res.status(400).send([]);

  try {
    const result = await BASE.searchPlayerOpeningGame(player, color, opening);
    const parsed = result.map((item) => ({
      ...item,
      moves: CHESS.movesBin2obj(item.moves),
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

module.exports = router;
