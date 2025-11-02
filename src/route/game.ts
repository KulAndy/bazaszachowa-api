import express from "express";

const router = express.Router();
import BASE from "../app/base";
import CHESS from "../app/chess";

router.all("/:base/:id", async (request, response) => {
  const { base, id } = request.params;
  if (!base || !id) {
    return response.status(400);
  }

  try {
    const result = await BASE.getGame(id, base);
    const parsed = result.map((item) => ({
      ...item,
      moves: CHESS.movesBin2obj(item.moves),
    }));
    response.json(parsed);
  } catch (error) {
    console.error(error);
    response.status(400).send([
      {
        Black: "N, N",
        BlackElo: null,
        Day: null,
        ECO: null,
        Event: null,
        id: 12_347_922,
        Month: null,
        moves: [],
        Result: "0-1",
        Round: null,
        Site: null,
        White: "N, N",
        WhiteElo: null,
        Year: null,
      },
    ]);
  }
});

export default router;
