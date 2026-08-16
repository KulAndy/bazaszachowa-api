import mysql, { QueryError } from "mysql2";

import SETTINGS from "../../settings";

const database = mysql.createPool({
  database: SETTINGS.mysql.base,
  host: SETTINGS.mysql.host,
  password: SETTINGS.mysql.password,
  user: SETTINGS.mysql.user,
});

type SqlParameter = bigint | number | string | undefined;

const normalizeParameter = (value: SqlParameter): SqlParameter => {
  let result = value;
  if (typeof value === "bigint") {
    result = value.toString();
  }

  return result;
};

const execQuery = async <T extends object>(
  query: string,
  parameters: SqlParameter[] = [],
): Promise<T[]> => {
  const sqlParameters = parameters.map((x) => normalizeParameter(x));

  return new Promise((resolve, reject) => {
    database.query(
      query,
      sqlParameters,
      (error: null | QueryError, result: object) => {
        if (error) {
          console.error("MYSQL ERROR");
          console.error(query);
          console.error(sqlParameters);
          reject(error);
        }

        try {
          resolve(result as T[]);
        } catch (error) {
          console.error(query);
          console.error(sqlParameters);
          // eslint-disable-next-line  @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        }
      },
    );
  });
};

export default execQuery;
