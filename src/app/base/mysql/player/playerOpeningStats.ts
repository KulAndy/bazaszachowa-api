import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const playerOpeningStatsColor = async (player: string, color: string) => {
  let fulltextPlayer = player;
  if (fulltextPlayer.split(" ").length > 1) {
    fulltextPlayer = fulltextName(fulltextPlayer);
  }
  const parameters = [player];
  let query = `SELECT opening,
        COUNT(*) as count,
        Round(SUM(substring_index(REPLACE(Result, '1/2','0.5'),'-',1))/COUNT(*) *100,2) as percent
        FROM ${SETTINGS.mysql.allTable}
        inner join ${SETTINGS.mysql.allPlayers} as t1 on ${
    color == "white" ? "whiteID" : "BlackID"
  } = t1.id
        INNER JOIN ${SETTINGS.mysql.ecoTable}
        on ${SETTINGS.mysql.allTable}.ecoID = ${SETTINGS.mysql.ecoTable}.id
        WHERE  t1.fullname like ?
        `;

  if (fulltextPlayer) {
    parameters.push(fulltextPlayer);
    query += " AND MATCH(t1.fullname) against(? in boolean mode)";
  }

  query += ` GROUP BY opening
        ORDER by COUNT(*) DESC, opening`;

  return await execSearch(query, parameters);
};

const playerOpeningStats = async (player: string) => {
  const whites = await playerOpeningStatsColor(player, "white");
  const blacks = await playerOpeningStatsColor(player, "black");
  const stats = {
    blacks: blacks,
    whites: whites,
  };
  return stats;
};

export default playerOpeningStats;
