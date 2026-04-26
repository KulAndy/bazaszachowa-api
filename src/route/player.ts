import type { FastifyPluginCallback } from "fastify";

import BASE from "../app/base";
import DRAWER from "../app/drawer";
import RESOURCES from "../app/resources";

type PlayerParameters = {
  player: string;
};

type PlotParameters = {
  format: "jpeg" | "svg";
  player: string;
};

const router: FastifyPluginCallback = (app) => {
  app.all<{ Params: PlayerParameters }>(
    "/cr/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      const { player } = request.params;

      try {
        return await RESOURCES.crData(player);
      } catch (error) {
        console.error("crData failed", error);
        return response.code(503).send([]);
      }
    },
  );

  app.all<{ Params: PlayerParameters }>(
    "/fide/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      const { player } = request.params;

      try {
        return await BASE.fideData(player);
      } catch (error) {
        console.error("fideData failed", error);
        return response.code(503).send([]);
      }
    },
  );

  app.all<{ Params: PlotParameters }>(
    "/plot/:format/:player",
    {
      schema: {
        params: {
          properties: {
            format: { enum: ["jpeg", "svg"] },
            player: { minLength: 1, type: "string" },
          },
          required: ["format", "player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      const { format, player } = request.params;

      try {
        const elo_history = await BASE.eloHistory(player);

        if (format === "jpeg") {
          const result = await DRAWER.eloJPEG(elo_history, player);

          return response.type("image/jpeg").send(result);
        }

        if (format === "svg") {
          const result = DRAWER.eloSVG(elo_history, player);

          return response.type("image/svg+xml").send(result);
        }

        return response.code(400).send(null);
      } catch (error) {
        console.error("plot failed", error);
        return response.code(404).send(null);
      }
    },
  );

  app.all<{ Params: PlayerParameters }>(
    "/limit/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      try {
        return await BASE.minMaxYearElo(request.params.player);
      } catch {
        return response
          .code(400)
          .send([{ maxElo: null, maxYear: null, minYear: null }]);
      }
    },
  );

  app.all<{ Params: PlayerParameters }>(
    "/openings/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      try {
        return await BASE.playerOpeningStats(request.params.player);
      } catch {
        return response
          .code(400)
          .send([{ maxElo: null, maxYear: null, minYear: null }]);
      }
    },
  );

  app.all<{ Params: PlayerParameters }>(
    "/tournaments/poland/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      try {
        return await BASE.polandTournaments(request.params.player);
      } catch {
        return response.code(400).send([]);
      }
    },
  );

  app.all<{ Params: PlayerParameters }>(
    "/tournaments/fide/:player",
    {
      schema: {
        params: {
          properties: {
            player: { minLength: 1, type: "string" },
          },
          required: ["player"],
          type: "object",
        },
      },
    },
    async (request, response) => {
      try {
        return await BASE.fideTournaments(request.params.player);
      } catch {
        return response.code(400).send([]);
      }
    },
  );
};

export default router;
