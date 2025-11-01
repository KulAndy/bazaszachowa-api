import express from "express";
import axios from "axios";

import SETTINGS from "../app/settings";

const router = express.Router();

type FileMetaData = {
  name: string;
  modifiedTime: string;
  webViewLink: string;
  size: string;
  description?: string;
};

const getFilesInFolder = async (folderId: string): Promise<FileMetaData[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,modifiedTime,webViewLink,size,description)&key=${SETTINGS.key}`;
  const response = await axios.get<{ files: FileMetaData[] }>(url);
  return response.data.files;
};

router.get("/dumps", async (_req, res) => {
  try {
    const folderId = "1fEbetzoz0CgZGDcEj7HVkXAdtWB5ci_U";
    const files = await getFilesInFolder(folderId);

    res.json(files);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
