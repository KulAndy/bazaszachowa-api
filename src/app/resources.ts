import axios from "axios";
import iconv from "iconv-lite";

interface PlayerDetails {
  fide_id: string;
  id: string;
  kat: string;
  name: string;
}

interface Resources {
  crData: (name: string) => Promise<PlayerDetails[]>;
}

const RESOURCES: Resources = {
  async crData(name: string): Promise<PlayerDetails[]> {
    try {
      const response = await axios.post(
        // eslint-disable-next-line sonarjs/no-clear-text-protocols
        "http://www.cr-pzszach.pl/ew/viewpage.php?page_id=3",
        new URLSearchParams({
          szukaj: "szukaj",
          typ_szukania: "szukaj_czlonka",
          wyszukiwany_ciag: name,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          responseType: "arraybuffer",
        },
      );

      const buffer = Buffer.from(response.data);
      const body = iconv.decode(buffer, "iso-8859-2");

      const pattern =
        /<tr><td[^\n\r>\u2028\u2029]*>.*<\/td>.*pers_id.*<td[^\n\r>\u2028\u2029]*>.*<\/td><\/tr>/gi;
      const matches: null | string[] = body.match(pattern);

      if (!matches) {
        return [];
      }

      if (matches) {
        const dirt = /<\/?t[dr]>|<a [\w"&.=?]+>|<sup>.*<\/sup>|<\/a>/gi;
        // eslint-disable-next-line regexp/no-obscure-range, sonarjs/duplicates-in-character-class
        const spliRegex = /<td [\w "&-:;=?]+>/i;

        const playersDetails: PlayerDetails[] = matches
          .filter(Boolean)
          .map((match) => {
            const cleanedMatch = match.replaceAll(dirt, "");
            const playerData = cleanedMatch.split(spliRegex).slice(1);
            return {
              fide_id: playerData[3],
              id: playerData[1],
              kat: playerData[2],
              name: playerData[5],
            };
          });

        return playersDetails;
      } else {
        return [];
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};

export default RESOURCES;
