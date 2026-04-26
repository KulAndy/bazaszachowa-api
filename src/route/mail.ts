import fs from "node:fs";
import path from "node:path";

import multipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";
import nodemailer from "nodemailer";

import Settings from "../app/settings";

const uploadDirectory = path.resolve(process.cwd(), "uploads");
const emailRegex: RegExp = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

const router: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 200,
    },
  });

  app.post("/send", async (request, reply) => {
    try {
      const parts: Record<string, string> = {};

      let fileBuffer: Buffer | null = null;
      let filename: null | string = null;

      for await (const part of request.parts()) {
        if (part.type === "field") {
          parts[part.fieldname] = part.value as string;
        }

        if (part.type === "file") {
          filename = part.filename;
          fileBuffer = await part.toBuffer();
        }
      }

      const content = parts.content;
      const email = parts.email;
      const subject = parts.subject;

      if (!content || !email || !subject) {
        return reply.code(400).send("Missing fields");
      }

      if (!emailRegex.test(email)) {
        return reply.code(400).send("Invalid email format");
      }

      let savedFilePath: null | string = null;

      if (fileBuffer && filename) {
        await fs.promises.mkdir(uploadDirectory, { recursive: true });

        savedFilePath = path.join(uploadDirectory, `${filename}-${Date.now()}`);

        await fs.promises.writeFile(savedFilePath, fileBuffer);
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
          ? [{ filename: filename ?? "file", path: savedFilePath }]
          : [],
        from: Settings.mail.user,
        replyTo: email,
        subject,
        text: `${content}\n\n kontakt ${email}`,
        to: Settings.admin.contact,
      });

      if (savedFilePath) {
        await fs.promises.unlink(savedFilePath).catch(() => {});
      }

      return reply.send(`Email sent: ${info.response}`);
    } catch (error) {
      app.log.error(error, "Email send failed");
      return reply.code(500).send("Internal Server Error");
    }
  });
};

export default router;

