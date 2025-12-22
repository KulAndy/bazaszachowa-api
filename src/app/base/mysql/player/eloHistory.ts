import { EloData } from "../../../drawer";
import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const eloHistory = async (player: string, base = "all") => {
  let fulltextPlayer = player;
  if (fulltextPlayer.split(" ").length === 0) {
    return [];
  }

  fulltextPlayer = fulltextName(fulltextPlayer);

  const gamesTable =
    base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
  const playersTable =
    base == "poland" ? SETTINGS.mysql.polandPlayers : SETTINGS.mysql.allPlayers;

  const query = `
               SELECT MAX(Elo) as Elo, Year, Month FROM(
                   SELECT WhiteElo as Elo, Year, Month FROM ${gamesTable}
                       INNER JOIN ${playersTable}
                       on WhiteID = ${playersTable}.id
                       WHERE MATCH(${playersTable}.fullname) against(? in boolean mode)
                       AND Month is not null
                       AND WhiteElo > 0
                       AND ${playersTable}.fullname like ?
                       AND
                                (
                                  Year < Year(CURRENT_DATE) OR
                                  (
                                    Year = Year(CURRENT_DATE)
                                    AND Month <= Month(CURRENT_DATE)
                                    )
                                )

                      UNION

                       SELECT BlackElo as Elo, Year, Month FROM ${gamesTable}
                       INNER JOIN ${playersTable}
                       on BlackID = ${playersTable}.id
                       WHERE MATCH(${playersTable}.fullname) against(? in boolean mode)
                       AND Month is not null
                       AND BlackElo > 0
                       AND ${playersTable}.fullname like ?
                       AND
                                (
                                  Year < Year(CURRENT_DATE) OR
                                  (
                                    Year = Year(CURRENT_DATE)
                                    AND Month <= Month(CURRENT_DATE)
                                    )
                                )

                       UNION

                         SELECT MAX(rating) as Elo,
                         Year(CURRENT_DATE()) as Year,
                         Month(CURRENT_DATE()) as Month
                         FROM ${SETTINGS.mysql.fidePlayers}
                         WHERE name LIKE ?
               ) as pom
               group by Year, Month
                       ORDER by Year, Month
    `;

  return await execSearch<EloData>(query, [
    fulltextPlayer,
    player,
    fulltextPlayer,
    player,
    player,
  ]);
};

export default eloHistory;
