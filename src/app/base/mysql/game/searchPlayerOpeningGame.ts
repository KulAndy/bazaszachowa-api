import { Game } from "..";
import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const searchPlayerOpeningGame = async (
  player: string,
  color: null | string = null,
  opening: null | string = null,
) => {
  let query = `
    SELECT
        ${SETTINGS.mysql.allTable}.id, moves_blob as moves, ${SETTINGS.mysql.eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, 
        ${SETTINGS.mysql.allTable}.Year, ${SETTINGS.mysql.allTable}.Month, ${SETTINGS.mysql.allTable}.Day,  Round, t1.fullname as White, t2.fullname as Black,  
        Result, WhiteElo, BlackElo, ${SETTINGS.mysql.ecoTable}.ECO
        FROM ${SETTINGS.mysql.allTable}
        inner join ${SETTINGS.mysql.allPlayers} as t1 on WhiteID = t1.id
        inner join ${SETTINGS.mysql.allPlayers} as t2 on BlackID = t2.id
        LEFT join ${SETTINGS.mysql.eventsTable} on ${SETTINGS.mysql.allTable}.EventID = ${SETTINGS.mysql.eventsTable}.id
        LEFT join ${SETTINGS.mysql.sitesTable} on ${SETTINGS.mysql.allTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        LEFT JOIN ${SETTINGS.mysql.ecoTable} on ${SETTINGS.mysql.allTable}.ecoID = ${SETTINGS.mysql.ecoTable}.ID
`;
  let fulltextPlayer = player;
  if (fulltextPlayer.split(" ").length > 1) {
    fulltextPlayer = fulltextName(fulltextPlayer);
  }
  const parameters = [player];
  if (fulltextPlayer) {
    parameters.push(fulltextPlayer);
  }
  if (color == "white") {
    query += `
        WHERE t1.fullname like ?
`;
    if (fulltextPlayer) {
      query += " AND match(t1.fullname) against(? in boolean mode) ";
    }
    if (opening) {
      query += " AND opening like ?";
      parameters.push(opening);
    }
    query +=
      "\norder by Year DESC, Month DESC, Day DESC,Event, Round desc, White, Black LIMIT 10000";
  } else if (color == "black") {
    query += `
        WHERE t2.fullname like ?
`;
    if (fulltextPlayer) {
      query += " AND match(t2.fullname) against(? in boolean mode) ";
    }
    if (opening) {
      query += "AND opening like ?";
      parameters.push(opening);
    }
    query +=
      "\norder by Year DESC, Month DESC, Day DESC,Event, Round desc, White, Black LIMIT 10000";
  }
  return await execSearch<Game>(query, parameters);
};

export default searchPlayerOpeningGame;
