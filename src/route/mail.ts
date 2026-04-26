import fs from "node:fs";
import path from "node:path";

import multipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";
import nodemailer from "nodemailer";

import Settings from "../app/settings";

const uploadDirectory = path.resolve(process.cwd(), "uploads");

const router: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 200,
    },
  });

  app.post(
    "/send",
    {
      schema: {
        body: {
          properties: {
            content: { type: "string" },
            email: { format: "email", type: "string" },
            subject: { type: "string" },
          },
          required: ["content", "email", "subject"],
          type: "object",
        },
      },
    },
    async (request, reply) => {
      try {
        const file = await request.file();

        const { content, email, subject } = request.body as {
          content: string;
          email: string;
          subject: string;
        };

        let savedFilePath: null | string = null;

        if (file) {
          await fs.promises.mkdir(uploadDirectory, { recursive: true });

          const filename = `${file.filename}-${Date.now()}`;
          savedFilePath = path.join(uploadDirectory, filename);

          // eslint-disable-next-line security/detect-non-literal-fs-filename
          await fs.promises.writeFile(savedFilePath, await file.toBuffer());
        }

        const transporter = nodemailer.createTransport({
          auth: {
            pass: Settings.mail.password,
            user: Settings.mail.user,
          },
          host: Settings.mail.server,
          port: Settings.mail.port.smtp.at(-1),
          secure: false,
        });

        const info = await transporter.sendMail({
          attachments: savedFilePath
            ? [
                {
                  filename: file?.filename ?? "file",
                  path: savedFilePath,
                },
              ]
            : [],
          from: Settings.mail.user,
          replyTo: email,
          subject,
          text: `${content}\n\n kontakt ${email}`,
          to: Settings.admin.contact,
        });

        if (savedFilePath) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          await fs.promises.unlink(savedFilePath).catch(() => {});
        }

        return reply.send(`Email sent: ${info.response}`);
      } catch (error) {
        app.log.error(error, "Email send failed");
        return reply.code(500).send("Internal Server Error");
      }
    },
  );
};

export default router;
