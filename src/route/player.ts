import express from "express";

const router = express.Router();
import BASE from "../app/base";
import DRAWER from "../app/drawer";
import RESOURCES from "../app/resources";

router.all("/cr/:player", async (request, response) => {
  const player = request.params.player;
  if (!player) {
    return response.status(400);
  }

  try {
    const result = await RESOURCES.crData(player);
    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(503).json([]);
  }
});

router.all("/fide/:player", async (request, response) => {
  const player = request.params.player;
  if (!player) {
    return response.status(400);
  }

  try {
    const result = await BASE.fideData(player);
    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(503).json([]);
  }
});

router.all("/plot/:format/:player", async (request, response) => {
  const { format, player } = request.params;
  if (!format || !player) {
    return response.status(400).json(null);
  }

  const elo_history = await BASE.eloHistory(player);

  try {
    if (format === "jpeg") {
      const result = await DRAWER.eloJPEG(elo_history, player);
      response.setHeader("Content-Type", "image/jpeg").send(result);
    } else if (format === "svg") {
      const result = DRAWER.eloSVG(elo_history, player);
      response.setHeader("Content-Type", "image/svg+xml").send(result);
    } else {
      response.status(400).json(null);
    }
  } catch {
    response.status(404).json(null);
  }
});

router.all("/limit/:player", async (request, response) => {
  try {
    const result = await BASE.minMaxYearEco(request.params.player);
    response.send(result);
  } catch {
    response.status(400).send([{ maxElo: null, maxYear: null, minYear: null }]);
  }
});

router.all("/openings/:player", async (request, response) => {
  try {
    const result = await BASE.playerOpeningStats(request.params.player);
    response.send(result);
  } catch {
    response.status(400).send([{ maxElo: null, maxYear: null, minYear: null }]);
  }
});

router.all("/tournaments/poland/:player", async (request, response) => {
  try {
    const result = await BASE.polandTournaments(request.params.player);
    response.send(result);
  } catch {
    response.status(400).send([]);
  }
});

export default router;
