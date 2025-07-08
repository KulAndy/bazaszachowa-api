const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const SETTINGS = require("../app/settings");

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../../uploads/");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 200 },
}).single("attachment");

router.post("/send", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error(err);
      return res.status(400).send("Error uploading file");
    }

    const { email, subject, content } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send("Invalid email");
    }

    const transporter = nodemailer.createTransport({
      host: SETTINGS.mailServer,
      port: SETTINGS.mailPort.smtp[SETTINGS.mailPort.smtp.length - 1],
      secure: false,
      auth: {
        user: SETTINGS.mailUser,
        pass: SETTINGS.mailPassword,
      },
      replyTo: email,
    });

    const mailOptions = {
      from: SETTINGS.mailUser,
      to: SETTINGS.adminContact,
      subject,
      text: content + "\n\n kontakt " + email,
      attachments: [],
    };

    if (req.file) {
      mailOptions.attachments.push({
        filename: req.file.originalname,
        path: req.file.path,
      });
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send(error.toString());
      }
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.send("Email sent: " + info.response);
    });
  });
});

module.exports = router;
