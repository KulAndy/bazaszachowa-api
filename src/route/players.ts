import type { FastifyPluginCallback } from "fastify";

import BASE from "../app/base";
import logger from "../app/logger";

type Parameters_ = {
  player: string;
};

const router: FastifyPluginCallback = (app) => {
  app.all<{ Params: Parameters_ }>(
    "/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 3, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      try {
        const result = await BASE.searchPlayer(request.params.player, "all");

        return result;
      } catch (error) {
        logger.error({ error }, "searchPlayer failed");
        return response.code(503).send([]);
      }
    },
  );
};

export default router;
