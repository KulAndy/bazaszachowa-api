import type { FastifyPluginCallback } from "fastify";

import BASE from "../app/base";
import CHESS from "../app/chess";

type Parameters_ = {
  base: string;
  id: string;
};

const fallback = [
  {
    Black: "N, N",
    BlackElo: null,
    Day: null,
    ECO: null,
    Event: null,
    id: 0,
    Month: null,
    moves: [],
    Result: "*",
    Round: null,
    Site: null,
    White: "N, N",
    WhiteElo: null,
    Year: null,
  },
];

const router: FastifyPluginCallback = (app) => {
  app.all<{ Params: Parameters_ }>(
    "/:base/:id",
    {
      schema: {
        params: {
          properties: {
            base: { type: "string" },
            id: { type: "string" },
          },
          required: ["base", "id"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      const { base, id } = request.params;

      try {
        const result = await BASE.getGame(id, base);
        const parsed = result.map((item) => ({
          ...item,
          moves: CHESS.movesBin2obj(item.moves),
        }));

        return response.send(parsed);
      } catch (error) {
        console.error("Failed to fetch game", error);

        return response.code(400).send(fallback);
      }
    },
  );
};

export default router;
