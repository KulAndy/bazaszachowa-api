import mysql, { QueryError } from "mysql2";

import logger from "../../logger";
import SETTINGS from "../../settings";

const database = mysql.createPool({
  database: SETTINGS.mysql.base,
  host: SETTINGS.mysql.host,
  password: SETTINGS.mysql.password,
  user: SETTINGS.mysql.user,
});

const execQuery = async <T extends object>(
  query: string,
  parameters: (number | string | undefined)[] = [],
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    database.query(
      query,
      parameters,
      (error: null | QueryError, result: object) => {
        if (error) {
          logger.error(
            { err: error, parameters, query },
            "Database query failed",
          );
          reject(error);
        }

        try {
          resolve(result as T[]);
        } catch (error) {
          logger.error(
            { err: error, parameters, query },
            "Database query failed",
          );
          // eslint-disable-next-line  @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        }
      },
    );
  });
};

export default execQuery;
