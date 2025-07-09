import express from "express";
import axios, { AxiosResponse } from "axios";

import SETTINGS from "../app/settings";

const router = express.Router();

type FileMetaData = {
  name: string;
  modifiedTime: string;
  webViewLink: string;
  size: string;
  description?: string;
};

const getFileMetaData = (
  fileId: string
): Promise<AxiosResponse<FileMetaData>> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,modifiedTime,webViewLink,size,description&key=${SETTINGS.key}`;
  return axios.get<FileMetaData>(url);
};

router.get("/dumps", async (_req, res) => {
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

export default router;
