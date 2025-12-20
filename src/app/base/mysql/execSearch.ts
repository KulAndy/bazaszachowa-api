import mysql from "mysql";

import SETTINGS from "../../../app/settings";

const database = mysql.createPool({
  database: SETTINGS.mysql.base,
  host: SETTINGS.mysql.host,
  password: SETTINGS.mysql.password,
  user: SETTINGS.mysql.user,
});

const execSearch = async <T>(
  query: string,
  parameters: (number | string | undefined)[] = [],
): Promise<T[]> => {
  return new Promise((resolve) => {
    database.query(query, parameters, (error, result: T[]) => {
      if (error) {
        console.error(query);
        console.error(parameters);
        resolve([]);
        throw error;
      }

      try {
        resolve(result);
      } catch (error) {
        console.error(query);
        console.error(parameters);
        resolve([]);
        throw error;
      }
    });
  });
};

export default execSearch;
