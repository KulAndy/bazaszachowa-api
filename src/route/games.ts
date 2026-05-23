import type { FastifyPluginCallback } from "fastify";
import nodemailer from "nodemailer";

import BASE from "../app/base";
import {
  uploadLocalPgn,
  uploadRemoteGame,
  uploadRemotePgn,
} from "../app/base/mysql/upload/uploadGames";
import {
  generateVerificationCode,
  verifyEmail,
} from "../app/base/mysql/upload/verificationCode";
import CHESS from "../app/chess";
import Settings from "../app/settings";

type OpeningParameters = {
  color: "black" | "white";
  opening?: string;
  player: string;
};

type SearchParameters = Record<string, string>;

type SendVerificationCode = {
  email: string;
};

type UploadGameParameters = {
  email?: string;
  pgn?: string;
  source: "lichess" | "livechess" | "pgn_file" | "remote_pgn";
  url?: string;
  verificationCode?: string;
};

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

  app.post<{
    Body: SendVerificationCode;
  }>(
    "/upload/get-code",
    {
      schema: {
        body: {
          properties: {
            email: {
              format: "email",
              type: "string",
            },
          },
          required: ["email"],
          type: "object",
        },
      },
    },
    async (request, reply) => {
      try {
        const { email } = request.body;

        const code = await generateVerificationCode(email);

        const transporter = nodemailer.createTransport({
          auth: {
            pass: Settings.mail.password,
            user: Settings.mail.user,
          },
          host: Settings.mail.server,
          port: Settings.mail.port.smtp.at(-1),
          secure: false,
        });

        await transporter.sendMail({
          from: Settings.mail.user,
          subject: "Verification code",
          text: `Code: ${code}`,
          to: email,
        });

        return reply.code(200).send({ ok: true });
      } catch {
        return reply.code(503).send({ error: "Service unavailable" });
      }
    },
  );

  app.post<{ Body: UploadGameParameters }>(
    "/upload",
    {
      schema: {
        body: {
          properties: {
            email: {
              format: "email",
              type: "string",
            },
            pgn: { maxLength: 200 * 1024 * 1024, type: "string" },
            source: {
              enum: ["lichess", "livechess", "pgn_file", "remote_pgn"],
            },
            url: {
              format: "uri",
              type: "string",
            },
            verificationCode: {
              maxLength: 8,
              minLength: 8,
              type: "string",
            },
          },
          required: ["source"],
          type: "object",
        },
      },
    },
    async (request, reply) => {
      const { email, pgn, source, url, verificationCode } = request.body;

      if (
        ["pgn_file", "remote_pgn"].includes(source) &&
        !(
          email &&
          verificationCode &&
          (await verifyEmail(email, verificationCode))
        )
      ) {
        return reply.code(401).send({ error: "Verification failed" });
      }

      let code = 503;
      switch (source) {
        case "lichess":
        case "livechess": {
          if (!url) {
            return reply.code(400).send({ error: "Unsupported parameter set" });
          }
          code = await uploadRemoteGame(url, source);
          break;
        }

        case "pgn_file": {
          if (!email || !verificationCode || !pgn) {
            return reply.code(400).send({ error: "Unsupported parameter set" });
          }
          code = await uploadLocalPgn(email, verificationCode, pgn);
          break;
        }
        case "remote_pgn": {
          if (!email || !verificationCode || !url) {
            return reply.code(400).send({ error: "Unsupported parameter set" });
          }
          code = await uploadRemotePgn(email, verificationCode, url);
          break;
        }
      }
      return reply.code(code).send();
    },
  );
};

export default router;
