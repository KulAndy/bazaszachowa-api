import { Game, SearchGameParameters } from "..";
import SETTINGS from "../../../settings";
import execQuery from "../execQuery";
import fulltextName from "../tools/fulltextName";

const eventsTable = SETTINGS.mysql.eventsTable;
const ecoTable = SETTINGS.mysql.ecoTable;
const sitesTable = SETTINGS.mysql.sitesTable;

const buildBaseQuery = (gamesTable: string, playersTable: string) => {
  return `SELECT
    ${gamesTable}.id,
    moves_blob as moves,
    ${eventsTable}.name as Event,
    ${sitesTable}.site as Site,
    ${gamesTable}.Year,
    ${gamesTable}.Month,
    ${gamesTable}.Day,
    Round,
    t1.fullname as White,
    t2.fullname as Black,
    Result,
    WhiteElo,
    BlackElo,
    ${ecoTable}.ECO as ECO
  FROM ${gamesTable}
  INNER JOIN ${playersTable} as t1 ON WhiteID = t1.id
  INNER JOIN ${playersTable} as t2 ON BlackID = t2.id
  LEFT JOIN ${eventsTable} ON ${gamesTable}.EventID = ${eventsTable}.id
  LEFT JOIN ${sitesTable} ON ${gamesTable}.siteID = ${sitesTable}.id
  LEFT JOIN ${ecoTable} ON ${gamesTable}.ecoID = ${ecoTable}.id`;
};

const buildCommonConditions = (
  parameters: (number | string)[],
  minYear: number,
  maxYear: number,
  event: string | undefined,
  minEco: string,
  maxEco: string,
) => {
  const conditions: string[] = [];

  if (minYear !== 1475 || maxYear !== new Date().getFullYear()) {
    conditions.push("Year BETWEEN ? AND ?");
    parameters.push(minYear, maxYear);
  }

  if (event) {
    conditions.push(`${eventsTable}.name LIKE ?`);
    parameters.push(event);
  }

  if (minEco !== "A00" || maxEco !== "E99") {
    conditions.push(`${ecoTable}.ECO BETWEEN ? AND ?`);
    parameters.push(minEco, maxEco);
  }

  return conditions;
};

const buildWhereClause = (
  parameters: (number | string)[],
  white: string | undefined,
  black: string | undefined,
  minYear: number,
  maxYear: number,
  event: string | undefined,
  minEco: string,
  maxEco: string,
  playersTable: string,
  isIgnoreMode: boolean = false,
) => {
  const conditions = buildCommonConditions(
    parameters,
    minYear,
    maxYear,
    event,
    minEco,
    maxEco,
  );

  const whiteLike = white ? `${white}%` : undefined;
  const blackLike = black ? `${black}%` : undefined;

  if (whiteLike) {
    const field = isIgnoreMode ? "blackid" : "whiteid";
    conditions.push(
      `${field} IN (SELECT id FROM ${playersTable} WHERE fullname LIKE ?)`,
    );
    parameters.push(whiteLike);
  }

  if (blackLike) {
    const field = isIgnoreMode ? "whiteid" : "blackid";
    conditions.push(
      `${field} IN (SELECT id FROM ${playersTable} WHERE fullname LIKE ?)`,
    );
    parameters.push(blackLike);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
};

const buildFulltextWhereClause = (
  parameters: (number | string)[],
  white: string | undefined,
  black: string | undefined,
  minYear: number,
  maxYear: number,
  event: string | undefined,
  minEco: string,
  maxEco: string,
  playersTable: string,
  isIgnoreMode: boolean = false,
) => {
  const conditions = buildCommonConditions(
    parameters,
    minYear,
    maxYear,
    event,
    minEco,
    maxEco,
  );

  if (white) {
    const field = isIgnoreMode ? "blackid" : "whiteid";
    const fulltext = fulltextName(white);
    let subQuery = `${field} = (SELECT id FROM ${playersTable} WHERE `;
    if (fulltext) {
      subQuery += "MATCH(fullname) AGAINST(? IN BOOLEAN MODE) AND ";
      parameters.push(fulltext);
    }
    subQuery += "fullname LIKE ?)";
    parameters.push(white);
    conditions.push(subQuery);
  }

  if (black) {
    const field = isIgnoreMode ? "whiteid" : "blackid";
    const fulltext = fulltextName(black);
    let subQuery = `${field} = (SELECT id FROM ${playersTable} WHERE `;
    if (fulltext) {
      subQuery += "MATCH(fullname) AGAINST(? IN BOOLEAN MODE) AND ";
      parameters.push(fulltext);
    }
    subQuery += "fullname LIKE ?)";
    parameters.push(black);
    conditions.push(subQuery);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
};

const searchGames = async (object: SearchGameParameters) => {
  const searching = object.searching || "classic";
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  const ignore = object.ignore && object.ignore.toLowerCase() === "true";
  const minYear = Number(object.minYear) || 1475;
  const maxYear = Number(object.maxYear) || new Date().getFullYear();
  const minEco = object.minEco || "A00";
  const maxEco = object.maxEco || "E99";

  const table = object.table || "all";
  const white = object.white;
  const black = object.black;
  const event = object.event ? `${object.event}%` : undefined;

  const playersTable =
    table === "poland"
      ? SETTINGS.mysql.polandPlayers
      : SETTINGS.mysql.allPlayers;
  const gamesTable =
    table === "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;

  const baseQuery = buildBaseQuery(gamesTable, playersTable);
  const parameters: (number | string)[] = [];

  let query =
    "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";

  let buildFunction:
    | null
    | typeof buildFulltextWhereClause
    | typeof buildWhereClause = null;
  if (searching === "classic") {
    buildFunction = buildWhereClause;
  } else if (searching === "fulltext") {
    buildFunction = buildFulltextWhereClause;
  }

  if (buildFunction && (white || black)) {
    const whereClause = buildFunction(
      parameters,
      white,
      black,
      minYear,
      maxYear,
      event,
      minEco,
      maxEco,
      playersTable,
    );
    query = `${baseQuery}${whereClause}`;

    if (ignore) {
      const ignoreWhereClause = buildFunction(
        parameters,
        white,
        black,
        minYear,
        maxYear,
        event,
        minEco,
        maxEco,
        playersTable,
        true,
      );
      query += ` UNION ${baseQuery}${ignoreWhereClause}`;
    }
  }

  query +=
    " ORDER BY year DESC, month DESC, day DESC, Event, Round DESC, White, Black LIMIT 10000";

  return execQuery<Game>(query, parameters);
};

export default searchGames;
