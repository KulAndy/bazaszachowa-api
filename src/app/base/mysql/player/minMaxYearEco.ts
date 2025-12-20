import { Limits } from "..";
import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const minMaxYearEco = async (player: string, base: string = "all") => {
  let fulltextPlayer = player;
  if (fulltextPlayer.split(" ").length > 1) {
    fulltextPlayer = fulltextName(fulltextPlayer);
  }
  const parameters = [player];
  let query = `
SELECT max(WhiteElo) as maxElo, min(Year) as minYear, max(Year) as maxYear
FROM ${base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable}
inner join ${
    base == "poland" ? SETTINGS.mysql.polandPlayers : SETTINGS.mysql.allPlayers
  } as t1 on WhiteID = t1.id
WHERE t1.fullname like ?`;
  if (fulltextPlayer) {
    parameters.push(fulltextPlayer);
    query += " AND MATCH(t1.fullname) against(? in boolean mode) ";
  }
  parameters.push(player);
  query += `
UNION
SELECT max(BlackElo) as maxElo, min(Year) as minYear, max(Year) as maxYear
FROM ${base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable}
inner join ${
    base == "poland" ? SETTINGS.mysql.polandPlayers : SETTINGS.mysql.allPlayers
  } as t1 on BlackID = t1.id
WHERE t1.fullname like ?     `;
  if (fulltextPlayer) {
    parameters.push(fulltextPlayer);
    query += " AND MATCH(t1.fullname) against(? in boolean mode) ";
  }
  return await execSearch<Limits>(query, parameters);
};

export default minMaxYearEco;
