import type { FastifyPluginCallback } from "fastify";

import BASE from "../app/base";
import CHESS from "../app/chess";

type OpeningParameters = {
  color: "black" | "white";
  opening?: string;
  player: string;
};

type SearchParameters = Record<string, string>;

const router: FastifyPluginCallback = (app) => {
  app.route<{
    Body: SearchParameters;
    Querystring: SearchParameters;
  }>({
    handler: async (request, response) => {
      const parameters =
        request.method === "GET" ? request.query : request.body;

      if (!parameters.white && !parameters.black) {
        return response.code(400).send([]);
      }

      try {
        const result = await BASE.searchGames(parameters);
        const parsed = result.map((item) => ({
          ...item,
          moves: CHESS.movesBin2obj(item.moves),
        }));

        return {
          rows: parsed,
          table: parameters.table || "all",
        };
      } catch (error) {
        console.error("searchGames failed", error);

        return response.code(503).send([]);
      }
    },
    method: ["GET", "POST"],
    url: "/",
  });

  app.all<{
    Params: OpeningParameters;
  }>(
    "/opening/:player/:color/:opening?",
    {
      schema: {
        params: {
          properties: {
            color: { enum: ["black", "white"] },
            opening: { type: "string" },
            player: { type: "string" },
          },
          required: ["player", "color"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      const { color, opening = null, player } = request.params;

      try {
        const result = await BASE.searchPlayerOpeningGame(
          player,
          color,
          opening,
        );
        const parsed = result.map((item) => ({
          ...item,
          moves: CHESS.movesBin2obj(item.moves),
        }));

        return parsed;
      } catch (error) {
        console.error("searchPlayerOpeningGame failed", error);

        return response.code(503).send([]);
      }
    },
  );
};

export default router;
