import fs from "node:fs";
import path from "node:path";

import express from "express";
import multer, { StorageEngine } from "multer";
import nodemailer from "nodemailer";

import Settings from "../app/settings";

const router = express.Router();
// eslint-disable-next-line unicorn/prefer-module
const uploadDirectory: string = path.resolve(__dirname, "../../uploads/");

const storage: StorageEngine = multer.diskStorage({
  destination: (
    _request,
    _file,
    callback: (error: Error | null, destination: string) => void,
  ) => {
    void fs.promises
      .mkdir(uploadDirectory, { recursive: true })
      .catch(() => {})
      .finally(() => {
        callback(null, uploadDirectory);
      });
  },
  filename: (
    _request,
    file,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  limits: { fileSize: 1024 * 1024 * 200 },
  storage: storage,
}).single("attachment");

router.post("/send", (request, response) => {
  upload(request, response, (error) => {
    if (error) {
      console.error(error);
      return response.status(400).send("Error uploading file");
    }

    const { content, email, subject } = request.body as {
      content: string;
      email: string;
      subject: string;
    };

    const emailRegex: RegExp = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return response.status(400).send("Invalid email");
    }

    const transporter = nodemailer.createTransport({
      auth: {
        pass: Settings.mail.password,
        user: Settings.mail.user,
      },
      host: Settings.mail.server,
      port: Settings.mail.port.smtp.at(-1),
      replyTo: email,
      secure: false,
    });

    const mailOptions: nodemailer.SendMailOptions = {
      attachments: [],
      from: Settings.mail.user,
      replyTo: email,
      subject,
      text: `${content}\n\n kontakt ${email}`,
      to: Settings.admin.contact,
    };

    if (request.file) {
      mailOptions.attachments?.push({
        filename: request.file.originalname,
        path: request.file.path,
      });
    }

    transporter.sendMail(
      mailOptions,
      (error: Error | null, info: nodemailer.SentMessageInfo) => {
        if (error) {
          console.error(error);
          return response.status(500).send(error.toString());
        }

        if (request.file) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          void fs.promises.unlink(request.file.path);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.send("Email sent: " + info.response);
      },
    );
  });
});

export default router;
