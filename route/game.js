const express = require("express");
const router = express.Router();
const BASE = require("../app/base");
const CHESS = require("../app/chess");

router.all("/:base/:id", async (req, res) => {
  const { base, id } = req.params;
  if (!base || !id) return res.status(400);

  try {
    const result = await BASE.getGame(id, base);
    const parsed = result.map((item) => ({
      ...item,
      moves: CHESS.movesBin2obj(item.moves),
    }));
    res.json(parsed);
  } catch (error) {
    console.error(error);
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
  }
});

module.exports = router;
