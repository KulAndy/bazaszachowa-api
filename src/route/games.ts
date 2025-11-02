import express from "express";

const router = express.Router();
import BASE from "../app/base";
import CHESS from "../app/chess";

router.all("/", async (request, response) => {
  const parameters =
    request.method === "GET"
      ? request.query
      : (request.body as Record<string, string>);
  if (!parameters.white && !parameters.black) {
    return response.status(400).send([]);
  }

  try {
    const result = await BASE.searchGames(parameters);
    const parsed = result.map((item) => ({
      ...item,
      moves: CHESS.movesBin2obj(item.moves),
    }));
    response.json({ rows: parsed, table: parameters.table || "all" });
  } catch (error) {
    console.error(error);
    response.status(503).json([]);
  }
});

router.all(
  ["/opening/:player/:color", "/opening/:player/:color/:opening"],
  async (request, response) => {
    const { color, opening = null, player } = request.params;
    if (!["black", "white"].includes(color) || typeof color !== "string") {
      return response.status(400).send([]);
    }

    try {
      const result = await BASE.searchPlayerOpeningGame(player, color, opening);
      const parsed = result.map((item) => ({
        ...item,
        moves: CHESS.movesBin2obj(item.moves),
      }));
      response.json(parsed);
    } catch (error) {
      console.error(error);
      response.status(503).json([]);
    }
  },
);

export default router;
