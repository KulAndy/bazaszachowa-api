const express = require("express");
const router = express.Router();
const BASE = require("../app/base");

router.all("/:player", async (req, res) => {
  try {
    const result = await BASE.searchPlayer(req.params.player, "all");
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(503).json([]);
  }
});

module.exports = router;
