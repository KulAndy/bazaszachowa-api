import { Game } from "..";
import SETTINGS from "../../../settings";
import execSearch from "../execSearch";

const getGame = async (id: number | string, base: string) => {
  const playersTable =
    base == "poland" ? SETTINGS.mysql.polandPlayers : SETTINGS.mysql.allPlayers;

  const table =
    base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
  const query = `SELECT
    ${table}.id, moves_blob as moves, ${
    SETTINGS.mysql.eventsTable
  }.name as Event, ${
    SETTINGS.mysql.sitesTable
  }.site as Site, ${table}.Year, ${table}.Month, ${table}.Day,  Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo,${
    SETTINGS.mysql.ecoTable
  }.ECO as  ECO
    FROM ${table}
    inner join ${playersTable} as t1 on WhiteID = t1.id
    inner join ${playersTable} as t2 on BlackID = t2.id
    LEFT join ${SETTINGS.mysql.eventsTable} on ${table}.EventID = ${
    SETTINGS.mysql.eventsTable
  }.id
    LEFT join ${SETTINGS.mysql.sitesTable} on ${table}.siteID = ${
    SETTINGS.mysql.sitesTable
  }.id
    LEFT join ${SETTINGS.mysql.ecoTable} on ${table}.ecoID = ${
    SETTINGS.mysql.ecoTable
  }.id
    WHERE ${table}.id = ${Number(id)}
    `;
  return await execSearch<Game>(query);
};

export default getGame;
