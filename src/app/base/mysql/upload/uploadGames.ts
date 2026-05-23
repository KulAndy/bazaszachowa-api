import Settings from "../../../settings";
import execQuery from "../execQuery";

import { validateSource } from "./validator";

type MySqlError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
};

export const uploadRemoteGame = async (
  url: string,
  source: "lichess" | "livechess",
) => {
  if (!validateSource(url, source)) {
    return 400;
  }
  try {
    const query = `INSERT INTO ${Settings.mysql.uploadTable}(source, url)
      VALUES(?, ?) `;
    await execQuery(query, [source, url]);
    return 200;
  } catch (error_) {
    const error = error_ as MySqlError;

    if (error.code === "ER_DUP_ENTRY") {
      return 208;
    }

    return 503;
  }
};
export const uploadRemotePgn = async (
  email: string,
  code: string,
  url: string,
): Promise<number> => {
  if (!validateSource(url, "remote_pgn")) {
    return 400;
  }
  try {
    const query = `
      UPDATE ${Settings.mysql.uploadTable}
      SET url = ?, source = 'remote_pgn', code = NULL
      WHERE email = ? AND code = ?
    `;

    await execQuery(query, [url, email, code]);
    return 200;
  } catch (error_) {
    const error = error_ as MySqlError;

    if (error.code === "ER_DUP_ENTRY") {
      return 208;
    }

    return 503;
  }
};

export const uploadLocalPgn = async (
  email: string,
  code: string,
  pgn: string,
): Promise<number> => {
  try {
    const query = `
      UPDATE ${Settings.mysql.uploadTable}
      SET pgn = ?, source = 'pgn_file', code = NULL
      WHERE email = ? AND code = ?
    `;

    await execQuery(query, [pgn, email, code]);
    return 200;
  } catch {
    return 503;
  }
};
