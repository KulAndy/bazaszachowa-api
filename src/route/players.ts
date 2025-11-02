import express from "express";

const router = express.Router();
import BASE from "../app/base";

router.all("/:player", async (request, response) => {
  try {
    const result = await BASE.searchPlayer(request.params.player, "all");
    response.json(result);
  } catch (error) {
    console.error(error);
    response.status(503).json([]);
  }
});

export default router;
