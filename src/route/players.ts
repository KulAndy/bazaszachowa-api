import express from "express";
const router = express.Router();
import BASE from "../app/base";

router.all("/:player", async (req, res) => {
  try {
    const result = await BASE.searchPlayer(req.params.player, "all");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

export default router;
