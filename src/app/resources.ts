import axios from "axios";
import * as iconv from "iconv-lite";

interface PlayerDetails {
  id: string;
  kat: string;
  fide_id: string;
  name: string;
}

interface Resources {
  crData: (name: string) => Promise<PlayerDetails[]>;
}

const RESOURCES: Resources = {
  async crData(name: string): Promise<PlayerDetails[]> {
    try {
      const response = await axios.post(
        "http://www.cr-pzszach.pl/ew/viewpage.php?page_id=3",
        new URLSearchParams({
          typ_szukania: "szukaj_czlonka",
          wyszukiwany_ciag: name,
          szukaj: "szukaj",
        }),
        {
          responseType: "arraybuffer",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const body = iconv.decode(response.data, "iso-8859-2").toString();
      const pattern =
        /<tr>(<td.*>.*<\/td>)+(.*pers_id.*).*(<td.*>.*<\/td>)+<\/tr>/gim;
      const matches = body.match(pattern);

      if (matches) {
        const dirt = /<\/?t[rd]>|<a [a-z=".?_0-9&]+>|<sup>.*<\/sup>|<\/a>/gim;
        const spliRegex = /<td [a-z=".?_0-9&-:; ]+>/gi;

        const playersDetails: PlayerDetails[] = matches
          .filter((match) => match)
          .map((match) => {
            const cleanedMatch = match.replace(dirt, "");
            const playerData = cleanedMatch.split(spliRegex).slice(1);
            return {
              id: playerData[1],
              kat: playerData[2],
              fide_id: playerData[3],
              name: playerData[5],
            };
          });

        return playersDetails;
      } else {
        return [];
      }
    } catch (err) {
      console.error(err);
      return [];
    }
  },
};

export default RESOURCES;
