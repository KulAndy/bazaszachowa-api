import SETTINGS from "../../../../app/settings";
import execSearch from "../execSearch";

const fideData = async (name: string) => {
  const parameters = [name];
  const query = `SELECT
      fideid,
      name,
      title,
      rating,
      rapid_rating,
      blitz_rating,
      birthday
      FROM ${SETTINGS.mysql.fidePlayers}
      WHERE NAME LIKE ?`;
  const result = await execSearch<{
    birthday: string;
    blitz_rating: number;
    fideid: number;
    name: string;
    rapid_rating: number;
    rating: number;
    title: string;
  }>(query, parameters);
  return result;
};

export default fideData;
