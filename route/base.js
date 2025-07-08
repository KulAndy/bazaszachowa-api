const express = require("express");
const axios = require("axios");
const SETTINGS = require("../app/settings");

const router = express.Router();

const getFileMetaData = (fileId) => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,modifiedTime,webViewLink,size&key=${SETTINGS.key}`;
  return axios.get(url);
};

router.get("/dumps", async (req, res) => {
  try {
    const responses = await Promise.all([
      getFileMetaData("1g7LmtRscJUIURSG3_6-rbX9n5TyrtgTb"),
      getFileMetaData("1D8BNRql7XHrhlhUXp-fSnIFZvT0jVF-y"),
    ]);
    res.json(responses.map((r) => r.data));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
