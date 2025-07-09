import express from "express";
const router = express.Router();
import BASE from "../app/base";
import CHESS from "../app/chess";

router.all("/", async (req, res) => {
  const params = req.method === "GET" ? req.query : req.body;
  if (!params.white && !params.black) {return res.status(400).send([]);}

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
  if (!["white", "black"].includes(color) || typeof color !== "string") {
    return res.status(400).send([]);
  }

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

export default router;
