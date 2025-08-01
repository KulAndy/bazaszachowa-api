import mysql from "mysql";

import SETTINGS from "../app/settings";
import type { EloData } from "./drawer";

const db = mysql.createPool({
  host: SETTINGS.host,
  user: SETTINGS.user,
  password: SETTINGS.password,
  database: SETTINGS.base,
});

interface Player {
  fullname: string;
}

interface Game {
  id: Number | null;
  moves: ArrayBuffer | null;
  Event: String | null;
  Year: Number | null;
  Month: Number | null;
  Day: Number | null;
  Round: string | null;
  White: String | null;
  Black: string | null;
  Result: String | null;
  WhiteElo: Number | null;
  BlackElo: Number | null;
  ECO: string | null;
}

interface SearchGameParameters {
  searching: string;
  table: string;
  white: string;
  black: string;
  ignore: string;
  event: string;
  minYear: string;
  maxYear: string;
  minEco: string;
  maxEco: string;
}

interface Limits {
  maxElo: number | null;
  minYear: number | null;
  maxYear: number | null;
}

const BASE = {
  async execSearch<T>(
    query: string,
    params: (string | number)[] = []
  ): Promise<T[]> {
    return new Promise((data) => {
      db.query(query, params, (error, result) => {
        if (error) {
          data([]);
          console.error(query);
          console.error(params);
          throw error;
        }
        try {
          data(result);
        } catch (error) {
          data([]);
          console.error(query);
          console.error(params);

          throw error;
        }
      });
    });
  },

  fulltextName(name: string) {
    let nameFul = name.replace(/[`'-]/g, " ");
    if (nameFul[0] == "'" || nameFul[0] == "`") {
      nameFul = nameFul.substring(1);
    }
    nameFul = nameFul.replace(/[^a-zA-Z0-9\s]/g, "");
    nameFul = nameFul.replace(/\b\w{1,2}\b/g, "");
    nameFul = nameFul.replace(/\s+/g, " ");
    nameFul = nameFul.trim();
    nameFul = nameFul
      .split(" ")
      .filter(Boolean)
      .map((word) => "+" + word)
      .join(" ");
    return nameFul;
  },

  async fideData(name: string) {
    const params = [name];
    const nameFul = this.fulltextName(name);
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
      params.push(nameFul);
      query += ` AND MATCH(NAME) AGAINST(
          ? IN BOOLEAN MODE
      )`;
    }
    const result = await this.execSearch(query, params);
    return result;
  },

  async searchPlayer(player: string, table: string, forFulltext = false) {
    player += "%";

    let query = `
    SELECT
    fullname
    FROM ${
      table == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers
    } WHERE fullname like ? `;

    let result = await this.execSearch<Player>(query, [player]);
    if (result.length == 0) {
      query = `
    SELECT
    fullname
    FROM ${SETTINGS.wholePlayers} WHERE fullname like ? `;

      result = await this.execSearch<Player>(query, [player]);
    }
    if (forFulltext) {
      for (let i = 0; i < result.length; i++) {
        result[i].fullname = this.fulltextName(result[i].fullname.trim());
      }
    }
    result = [...new Set(result)];

    return result.map((a) => a.fullname);
  },

  async getGame(id: number | string, base: string) {
    const playersTable =
      base == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers;

    const table = base == "poland" ? SETTINGS.polandTable : SETTINGS.allTable;
    const query = `SELECT
    ${table}.id, moves_blob as moves, ${SETTINGS.eventsTable}.name as Event, ${
      SETTINGS.sitesTable
    }.site as Site, ${table}.Year, ${table}.Month, ${table}.Day,  Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo,${
      SETTINGS.ecoTable
    }.ECO as  ECO
    FROM ${table}
    inner join ${playersTable} as t1 on WhiteID = t1.id
    inner join ${playersTable} as t2 on BlackID = t2.id
    LEFT join ${SETTINGS.eventsTable} on ${table}.EventID = ${
      SETTINGS.eventsTable
    }.id
    LEFT join ${SETTINGS.sitesTable} on ${table}.siteID = ${
      SETTINGS.sitesTable
    }.id
    LEFT join ${SETTINGS.ecoTable} on ${table}.ecoID = ${SETTINGS.ecoTable}.id
    WHERE ${table}.id = ${Number(id)}
    `;
    return await this.execSearch<Game>(query);
  },

  async playerOpeningStatsColor(player: string, color: string) {
    let fulltextPlayer = JSON.parse(JSON.stringify(player));
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
    }
    const params = [player];
    let query = `SELECT opening,
        COUNT(*) as count,
        Round(SUM(substring_index(REPLACE(Result, '1/2','0.5'),'-',1))/COUNT(*) *100,2) as percent
        FROM ${SETTINGS.allTable}
        inner join ${SETTINGS.allPlayers} as t1 on ${
      color == "white" ? "whiteID" : "BlackID"
    } = t1.id
        INNER JOIN ${SETTINGS.ecoTable}
        on ${SETTINGS.allTable}.ecoID = ${SETTINGS.ecoTable}.id
        WHERE  t1.fullname like ?
        `;

    if (fulltextPlayer) {
      params.push(fulltextPlayer);
      query += " AND MATCH(t1.fullname) against(? in boolean mode)";
    }

    query += ` GROUP BY opening
        ORDER by COUNT(*) DESC, opening`;

    return await this.execSearch(query, params);
  },

  async playerOpeningStats(player: string) {
    const whites = await this.playerOpeningStatsColor(player, "white");
    const blacks = await this.playerOpeningStatsColor(player, "black");
    const stats = {
      whites: whites,
      blacks: blacks,
    };
    return stats;
  },

  async searchPlayerOpeningGame(
    player: string,
    color: string | null = null,
    opening: string | null = null
  ) {
    let query = `
    SELECT
        ${SETTINGS.allTable}.id, moves_blob as moves, ${SETTINGS.eventsTable}.name as Event, ${SETTINGS.sitesTable}.site as Site, ${SETTINGS.allTable}.Year, ${SETTINGS.allTable}.Month, ${SETTINGS.allTable}.Day,  Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${SETTINGS.ecoTable}.ECO
        FROM ${SETTINGS.allTable}
        inner join ${SETTINGS.allPlayers} as t1 on WhiteID = t1.id
        inner join ${SETTINGS.allPlayers} as t2 on BlackID = t2.id
        LEFT join ${SETTINGS.eventsTable} on ${SETTINGS.allTable}.EventID = ${SETTINGS.eventsTable}.id
        LEFT join ${SETTINGS.sitesTable} on ${SETTINGS.allTable}.siteID = ${SETTINGS.sitesTable}.id
        LEFT JOIN ${SETTINGS.ecoTable} on ${SETTINGS.allTable}.ecoID = ${SETTINGS.ecoTable}.ID
`;
    let fulltextPlayer = JSON.parse(JSON.stringify(player));
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
    }
    const params = [player];
    if (fulltextPlayer) {
      params.push(fulltextPlayer);
    }
    if (color == "white") {
      query += `
        WHERE t1.fullname like ?
`;
      if (fulltextPlayer) {
        query += " AND match(t1.fullname) against(? in boolean mode) ";
      }
      if (opening) {
        query += " AND opening like ?";
        params.push(opening);
      }
      query +=
        "\norder by Year DESC, Month DESC, Day DESC,Event, Round desc, White, Black LIMIT 10000";
    } else if (color == "black") {
      query += `
        WHERE t2.fullname like ?
`;
      if (fulltextPlayer) {
        query += " AND match(t2.fullname) against(? in boolean mode) ";
      }
      if (opening) {
        query += "AND opening like ?";
        params.push(opening);
      }
      query +=
        "\norder by Year DESC, Month DESC, Day DESC,Event, Round desc, White, Black LIMIT 10000";
    }
    return await this.execSearch<Game>(query, params);
  },

  async minMaxYearEco(player: string, base: string = "all") {
    let fulltextPlayer = JSON.parse(JSON.stringify(player));
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
    }
    const params = [];
    params.push(player);
    let query = `
SELECT max(WhiteElo) as maxElo, min(Year) as minYear, max(Year) as maxYear
FROM ${base == "poland" ? SETTINGS.polandTable : SETTINGS.allTable}
inner join ${
      base == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers
    } as t1 on WhiteID = t1.id
WHERE t1.fullname like ?`;
    if (fulltextPlayer) {
      params.push(fulltextPlayer);
      query += " AND MATCH(t1.fullname) against(? in boolean mode) ";
    }
    params.push(player);
    query += `
UNION
SELECT max(BlackElo) as maxElo, min(Year) as minYear, max(Year) as maxYear
FROM ${base == "poland" ? SETTINGS.polandTable : SETTINGS.allTable}
inner join ${
      base == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers
    } as t1 on BlackID = t1.id
WHERE t1.fullname like ?     `;
    if (fulltextPlayer) {
      params.push(fulltextPlayer);
      query += " AND MATCH(t1.fullname) against(? in boolean mode) ";
    }
    return await this.execSearch<Limits>(query, params);
  },
  async eloHistory(player: string, base = "all") {
    let fulltextPlayer = JSON.parse(JSON.stringify(player));
    if (fulltextPlayer.split(" ").length === 0) {
      return [];
    }

    fulltextPlayer = this.fulltextName(fulltextPlayer);

    const gamesTable =
      base == "poland" ? SETTINGS.polandTable : SETTINGS.allTable;
    const playersTable =
      base == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers;

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
                         FROM ${SETTINGS.fidePlayers}
                         WHERE MATCH(name) AGAINST(? in boolean mode)
               ) as pom
               group by Year, Month
                       ORDER by Year, Month
    `;

    return await this.execSearch<EloData>(query, [
      fulltextPlayer,
      player,
      fulltextPlayer,
      player,
      fulltextPlayer,
    ]);
  },

  async searchGames(obj: SearchGameParameters) {
    const searching = obj.searching || "classic";
    let table;
    let white = "";
    let black = "";
    const ignore = obj.ignore && obj.ignore.toLowerCase() === "true";
    let event;
    const minYear = Number(obj.minYear) || 1475;
    const maxYear = Number(obj.maxYear) || new Date().getFullYear();
    const minEco = Number(obj.minEco) || 1;
    const maxEco = Number(obj.maxEco) || 500;
    let whiteLike;
    let blackLike;

    if (obj.table) {
      table = obj.table || "all";
    }
    if (obj.white) {
      white = obj.white;
      whiteLike = white + "%";
    }
    if (obj.black) {
      black = obj.black;
      blackLike = black + "%";
    }
    if (obj.event) {
      event = obj.event + "%";
    }

    const eventsTable = SETTINGS.eventsTable;
    const playersTable =
      table == "poland" ? SETTINGS.polandPlayers : SETTINGS.allPlayers;
    const gamesTable =
      table == "poland" ? SETTINGS.polandTable : SETTINGS.allTable;
    const ecoTable = SETTINGS.ecoTable;

    let query;
    const params = [];
    if (searching == "classic") {
      if (whiteLike || blackLike) {
        query = `SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
        if (whiteLike) {
          query += `whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          params.push(whiteLike);
        }
        if (blackLike) {
          if (whiteLike) {
            query += " AND ";
          }
          query += `blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          params.push(blackLike);
        }
        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          params.push(minYear);
          params.push(maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          params.push(event);
        }

        if (!(minEco == 1 && maxEco == 500)) {
          query += `and ${ecoTable}.id BETWEEN ? AND ? `;
          params.push(minEco);
          params.push(maxEco);
        }

        if (ignore) {
          query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
          if (whiteLike) {
            query += ` blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
            params.push(whiteLike);
          }
          if (blackLike) {
            if (whiteLike) {
              query += " AND ";
            }
            query += ` whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
            params.push(blackLike);
          }
          if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
            query += " and Year BETWEEN ? and ? ";
            params.push(minYear);
            params.push(maxYear);
          }

          if (event) {
            query += `and ${eventsTable}.name like ? `;
            params.push(event);
          }

          if (!(minEco == 1 && maxEco == 500)) {
            query += `and ${ecoTable}.id BETWEEN ? AND ? `;
            params.push(minEco);
            params.push(maxEco);
          }
        }
      } else {
        query =
          "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
      }
    } else if (searching == "fulltext") {
      if (white || black) {
        query = `SELECT
        ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
        Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
        FROM ${gamesTable}
        inner join ${playersTable} as t1 on WhiteID = t1.id
        inner join ${playersTable} as t2 on BlackID = t2.id
        left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
        LEFT join ${SETTINGS.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.sitesTable}.id
      left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
        WHERE `;
        if (whiteLike) {
          query += ` whiteid = (SELECT id FROM ${playersTable} WHERE `;
          white = this.fulltextName(obj.white);
          if (white) {
            query += " match(fullname) against(? in boolean mode) AND ";
            params.push(white);
          }
          query += " fullname like ? ) ";
          params.push(obj.white);
        }

        if (blackLike) {
          if (whiteLike) {
            query += " and ";
          }
          query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
          black = this.fulltextName(obj.black);
          if (black) {
            query += "  match(fullname) against(? in boolean mode) AND  ";
            params.push(black);
          }
          query += "  fullname like ? ) ";
          params.push(obj.black);
        }

        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          params.push(minYear);
          params.push(maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          params.push(event);
        }

        if (!(minEco == 1 && maxEco == 500)) {
          query += `and ${ecoTable}.id BETWEEN ? AND ? `;
          params.push(minEco);
          params.push(maxEco);
        }

        if (ignore) {
          query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;

          if (whiteLike) {
            query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
            if (white) {
              query += " match(fullname) against(? in boolean mode) AND  ";
              params.push(white);
            }
            query += " fullname like ? ) ";
            params.push(obj.white);
          }

          if (blackLike) {
            if (whiteLike) {
              query += " and ";
            }
            if (["'", "`"].includes(black[1])) {
              black = black.slice(2);
            }
            query += ` whiteid = (SELECT id FROM ${playersTable} WHERE `;
            if (black) {
              query += " match(fullname) against(? in boolean mode) AND ";
              params.push(black);
            }
            query += " fullname like ? ) ";
            params.push(obj.black);
          }

          if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
            query += " and Year BETWEEN ? and ? ";
            params.push(minYear);
            params.push(maxYear);
          }

          if (event) {
            query += `and ${eventsTable}.name like ? `;
            params.push(event);
          }

          if (!(minEco == 1 && maxEco == 500)) {
            query += `and ${ecoTable}.id BETWEEN ? AND ? `;
            params.push(minEco);
            params.push(maxEco);
          }
        }
      } else {
        query =
          "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
      }
    } else {
      query =
        "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
    }

    query +=
      " order BY year DESC,month DESC,day DESC,Event,Round desc, White, Black limit 10000";
    return this.execSearch<Game>(query, params);
  },
};

export default BASE;
