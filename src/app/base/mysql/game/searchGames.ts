import { Game, SearchGameParameters } from "..";
import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const searchGames = async (object: SearchGameParameters) => {
  const searching = object.searching || "classic";
  let table;
  let white = "";
  let black = "";
  const ignore = object.ignore && object.ignore.toLowerCase() === "true";
  let event;
  const minYear = Number(object.minYear) || 1475;
  const maxYear = Number(object.maxYear) || new Date().getFullYear();
  const minEco = object.minEco || "A00";
  const maxEco = object.maxEco || "E99";
  let whiteLike;
  let blackLike;

  if (object.table) {
    table = object.table || "all";
  }
  if (object.white) {
    white = object.white;
    whiteLike = white + "%";
  }
  if (object.black) {
    black = object.black;
    blackLike = black + "%";
  }
  if (object.event) {
    event = object.event + "%";
  }

  const eventsTable = SETTINGS.mysql.eventsTable;
  const playersTable =
    table == "poland"
      ? SETTINGS.mysql.polandPlayers
      : SETTINGS.mysql.allPlayers;
  const gamesTable =
    table == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
  const ecoTable = SETTINGS.mysql.ecoTable;

  let query;
  const parameters = [];
  if (searching == "classic") {
    if (whiteLike || blackLike) {
      query = `SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
      if (whiteLike) {
        query += `whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
        parameters.push(whiteLike);
      }
      if (blackLike) {
        if (whiteLike) {
          query += " AND ";
        }
        query += `blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
        parameters.push(blackLike);
      }
      if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
        query += " and Year BETWEEN ? and ? ";
        parameters.push(minYear, maxYear);
      }

      if (event) {
        query += `and ${eventsTable}.name like ? `;
        parameters.push(event);
      }

      if (minEco != "A00" || maxEco != "E99") {
        query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
        parameters.push(minEco, maxEco);
      }

      if (ignore) {
        query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
        if (whiteLike) {
          query += ` blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          parameters.push(whiteLike);
        }
        if (blackLike) {
          if (whiteLike) {
            query += " AND ";
          }
          query += ` whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          parameters.push(blackLike);
        }
        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          parameters.push(minYear, maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          parameters.push(event);
        }

        if (minEco != "A00" || maxEco != "E99") {
          query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
          parameters.push(minEco, maxEco);
        }
      }
    } else {
      query =
        "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
    }
  } else if (searching == "fulltext") {
    if (white || black) {
      query = `SELECT
        ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
        Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
        FROM ${gamesTable}
        inner join ${playersTable} as t1 on WhiteID = t1.id
        inner join ${playersTable} as t2 on BlackID = t2.id
        left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
        LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
      left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
        WHERE `;
      if (whiteLike) {
        query += ` whiteid = (SELECT id FROM ${playersTable} WHERE `;
        white = fulltextName(object.white!);
        if (white) {
          query += " match(fullname) against(? in boolean mode) AND ";
          parameters.push(white);
        }
        query += " fullname like ? ) ";
        parameters.push(object.white);
      }

      if (blackLike) {
        if (whiteLike) {
          query += " and ";
        }
        query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
        black = fulltextName(object.black!);
        if (black) {
          query += "  match(fullname) against(? in boolean mode) AND  ";
          parameters.push(black);
        }
        query += "  fullname like ? ) ";
        parameters.push(object.black);
      }

      if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
        query += " and Year BETWEEN ? and ? ";
        parameters.push(minYear, maxYear);
      }

      if (event) {
        query += `and ${eventsTable}.name like ? `;
        parameters.push(event);
      }

      if (minEco != "A00" || maxEco != "E99") {
        query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
        parameters.push(minEco, maxEco);
      }

      if (ignore) {
        query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;

        if (whiteLike) {
          query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
          if (white) {
            query += " match(fullname) against(? in boolean mode) AND  ";
            parameters.push(white);
          }
          query += " fullname like ? ) ";
          parameters.push(object.white);
        }

        if (blackLike) {
          if (whiteLike) {
            query += " and ";
          }
          if (["'", "`"].includes(black[1])) {
            black = black.slice(2);
          }
          query += ` whiteid = (SELECT id FROM ${playersTable} WHERE `;
          if (black) {
            query += " match(fullname) against(? in boolean mode) AND ";
            parameters.push(black);
          }
          query += " fullname like ? ) ";
          parameters.push(object.black);
        }

        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          parameters.push(minYear, maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          parameters.push(event);
        }

        if (minEco != "A00" || maxEco != "E99") {
          query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
          parameters.push(minEco, maxEco);
        }
      }
    } else {
      query =
        "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
    }
  } else {
    query =
      "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
  }

  query +=
    " order BY year DESC,month DESC,day DESC,Event,Round desc, White, Black limit 10000";

  return execSearch<Game>(query, parameters);
};

export default searchGames;
