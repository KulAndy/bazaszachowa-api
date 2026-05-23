import crypto from "node:crypto";

import Settings from "../../../settings";
import execQuery from "../execQuery";

type MySqlError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
};

function generateSecureCode(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return [...crypto.randomBytes(length)]
    .map((x) => chars[x % chars.length])
    .join("");
}

export const generateVerificationCode = async (email: string) => {
  while (true) {
    const code = generateSecureCode(8);

    try {
      const query = `
        INSERT INTO ${Settings.mysql.uploadTable} (email, code)
        VALUES (?, ?)
      `;

      await execQuery(query, [email, code]);
      return code;
    } catch (error_) {
      const error = error_ as MySqlError;

      if (error.code === "ER_DUP_ENTRY") {
        continue;
      }

      throw error_;
    }
  }
};

export const verifyEmail = async (email: string, code: string) => {
  const query = `SELECT id FROM ${Settings.mysql.uploadTable}
  WHERE
  email = ?
  AND code = ?
  AND url IS NULL
  AND pgn IS NULL`;
  const rows = await execQuery<{ id: number }>(query, [email, code]);
  return rows.length > 0;
};
