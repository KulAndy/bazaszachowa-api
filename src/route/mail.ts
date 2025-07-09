import express, { Request } from "express";
import multer, { StorageEngine } from "multer";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import Settings from "../app/settings";

const router = express.Router();
const uploadDir: string = path.resolve(__dirname, "../../uploads/");

const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 200 },
}).single("attachment");

router.post("/send", (req, res) => {
  upload(req, res, (err: any) => {
    if (err) {
      console.error(err);
      return res.status(400).send("Error uploading file");
    }

    const { email, subject, content } = req.body;

    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send("Invalid email");
    }

    const transporter = nodemailer.createTransport({
      host: Settings.mailServer,
      port: Settings.mailPort.smtp[Settings.mailPort.smtp.length - 1],
      secure: false,
      auth: {
        user: Settings.mailUser,
        pass: Settings.mailPassword,
      },
      replyTo: email,
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: Settings.mailUser,
      to: Settings.adminContact,
      subject,
      text: `${content}\n\n kontakt ${email}`,
      attachments: [],
    };

    if (req.file) {
      mailOptions.attachments!.push({
        filename: req.file.originalname,
        path: req.file.path,
      });
    }

    transporter.sendMail(
      mailOptions,
      (error: Error | null, info: nodemailer.SentMessageInfo) => {
        if (error) {
          console.error(error);
          return res.status(500).send(error.toString());
        }

        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        res.send("Email sent: " + info.response);
      }
    );
  });
});

export = router;
