import express from "express";

const router = express.Router();
import BASE from "../app/base";
import RESOURCES from "../app/resources";
import DRAWER from "../app/drawer";

router.all("/cr/:player", async (req, res) => {
  const player = req.params.player;
  if (!player) {return res.status(400);}

  try {
    const result = await RESOURCES.crData(player);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

router.all("/fide/:player", async (req, res) => {
  const player = req.params.player;
  if (!player) {return res.status(400);}

  try {
    const result = await BASE.fideData(player);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

router.all("/plot/:format/:player", async (req, res) => {
  const { format, player } = req.params;
  if (!format || !player) {
    return res.status(400).json(null);
  }

  const elo_history = await BASE.eloHistory(player);

  try {
    if (format === "jpeg") {
      const result = await DRAWER.eloJPEG(elo_history, player);
      res.setHeader("Content-Type", "image/jpeg").send(result);
    } else if (format === "svg") {
      const result = await DRAWER.eloSVG(elo_history, player);
      res.setHeader("Content-Type", "image/svg+xml").send(result);
    } else {
      res.status(400).json(null);
    }
  } catch {
    res.status(404).json(null);
  }
});

router.all("/limit/:player", async (req, res) => {
  try {
    const result = await BASE.minMaxYearEco(req.params.player);
    res.send(result);
  } catch {
    res.status(400).send([{ maxElo: null, minYear: null, maxYear: null }]);
  }
});

router.all("/openings/:player", async (req, res) => {
  try {
    const result = await BASE.playerOpeningStats(req.params.player);
    res.send(result);
  } catch {
    res.status(400).send([{ maxElo: null, minYear: null, maxYear: null }]);
  }
});

export default router;
