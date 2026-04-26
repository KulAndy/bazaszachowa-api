import axios from "axios";
import type { FastifyPluginCallback } from "fastify";

import SETTINGS from "../app/settings";

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

const router: FastifyPluginCallback = (app) => {
  app.all("/dumps", async (_request, response) => {
    try {
      const files = await getFilesInFolder(
        SETTINGS.google.token,
        SETTINGS.google.baseFolderId,
      );

      return response.send(files);
    } catch (error) {
      console.error("Google Drive fetch failed", error);

      return response.code(500).send({
        message: "Internal Server Error",
      });
    }
  });
};

export default router;
