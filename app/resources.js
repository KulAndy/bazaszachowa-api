const { spawn } = require("child_process");
const iconv = require("iconv-lite");

const RESOURCES = {
  async crData(name) {
    return new Promise((resolve, reject) => {
      try {
        const curl = spawn("curl", [
          "-X",
          "POST",
          "-H",
          "Content-Type: application/x-www-form-urlencoded",
          "--data-urlencode",
          "typ_szukania=szukaj_czlonka",
          "--data-urlencode",
          `wyszukiwany_ciag=${name}`,
          "--data-urlencode",
          "szukaj=szukaj",
          "http://www.cr-pzszach.pl/ew/viewpage.php?page_id=3",
        ]);

        let body = "";

        curl.stdout.on("data", (data) => {
          body += iconv.decode(data, "iso-8859-2").toString();
        });

        curl.on("close", (code) => {
          let pattern =
            /<tr>(<td.*>.*<\/td>)+(.*pers_id.*).*(<td.*>.*<\/td>)+<\/tr>/gim;
          if (body.match(pattern)) {
            let players = body.match(pattern).filter((n) => n);
            let dirt = /<\/?t[rd]>|<a [a-z=".?_0-9&]+>|<sup>.*<\/sup>|<\/a>/gim;
            let spliRegex = /<td [a-z=".?_0-9&-:; ]+>/gi;
            let playersDetails = [];
            for (let i = 0; i < players.length; i++) {
              players[i] = players[i].replace(dirt, "");
              let playerData = players[i].split(spliRegex).slice(1);
              playersDetails.push({
                id: playerData[1],
                kat: playerData[2],
                fide_id: playerData[3],
                name: playerData[5],
              });
            }

            resolve(playersDetails);
          } else {
            resolve([]);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  },
};

module.exports = RESOURCES;
