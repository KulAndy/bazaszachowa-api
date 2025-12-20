import SETTINGS from "../../../settings";
import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

interface Player {
  fullname: string;
}

const searchPlayer = async (
  player: string,
  table: string,
  forFulltext = false,
) => {
  player += "%";

  let query = `
    SELECT
    fullname
    FROM ${
      table == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers
    } WHERE fullname like ? `;

  let result = await execSearch<Player>(query, [player]);
  if (result.length === 0) {
    query = `
    SELECT
    fullname
    FROM ${SETTINGS.mysql.wholePlayers} WHERE fullname like ? `;

    result = await execSearch<Player>(query, [player]);
  }
  if (forFulltext) {
    for (const element of result) {
      element.fullname = fulltextName(element.fullname.trim());
    }
  }
  result = [...new Set(result)];

  return result.map((a) => a.fullname);
};

export default searchPlayer;
