import mysql, { QueryError } from "mysql2";

import SETTINGS from "../../../app/settings";

const database = mysql.createPool({
  database: SETTINGS.mysql.base,
  host: SETTINGS.mysql.host,
  password: SETTINGS.mysql.password,
  user: SETTINGS.mysql.user,
});

const execSearch = async <T extends object>(
  query: string,
  parameters: (number | string | undefined)[] = [],
): Promise<T[]> => {
  return new Promise((resolve) => {
    database.query(
      query,
      parameters,
      (error: null | QueryError, result: object) => {
        if (error) {
          console.error(query);
          console.error(parameters);
          resolve([]);
          throw error;
        }

        try {
          resolve(result as T[]);
        } catch (error) {
          console.error(query);
          console.error(parameters);
          resolve([]);
          throw error;
        }
      },
    );
  });
};

export default execSearch;
