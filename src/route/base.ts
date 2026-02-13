import axios from "axios";
import express from "express";

import SETTINGS from "../app/settings";

const router = express.Router();

type FileMetaData = {
  description?: string;
  modifiedTime: string;
  name: string;
  size: string;
  webViewLink: string;
};

const getFilesInFolder = async (
  token: string,
  folderId: string,
): Promise<FileMetaData[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,modifiedTime,webViewLink,size,description)&key=${token}`;
  const response = await axios.get<{ files: FileMetaData[] }>(url);
  return response.data.files;
};

router.get("/dumps", async (_request, response) => {
  try {
    const files = await getFilesInFolder(
      SETTINGS.google.token,
      SETTINGS.google.baseFolderId,
    );

    response.json(files);
  } catch (error) {
    console.error("Error:", error);
    response.status(500).send("Internal Server Error");
  }
});

export default router;
