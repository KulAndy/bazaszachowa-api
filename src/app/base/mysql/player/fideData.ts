import execSearch from "../execSearch";
import fulltextName from "../tools/fulltextName";

const fideData = async (name: string) => {
  const parameters = [name];
  const nameFul = fulltextName(name);
  let query = `SELECT
      fideid,
      name,
      title,
      rating,
      rapid_rating,
      blitz_rating,
      birthday
      FROM
      fide_players
      WHERE NAME LIKE ?`;
  if (nameFul) {
    parameters.push(nameFul);
    query += ` AND MATCH(NAME) AGAINST(
          ? IN BOOLEAN MODE
      )`;
  }
  const result = await execSearch(query, parameters);
  return result;
};

export default fideData;
