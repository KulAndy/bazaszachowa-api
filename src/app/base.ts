import mongoose from "mongoose";
import mysql from "mysql";

import SETTINGS from "../app/settings";
import PolishTournament from "../model/PolishTournament";

import type { EloData } from "./drawer";

const database = mysql.createPool({
  database: SETTINGS.mysql.base,
  host: SETTINGS.mysql.host,
  password: SETTINGS.mysql.password,
  user: SETTINGS.mysql.user,
});

const MONGODB_URI = `mongodb://${encodeURIComponent(
  SETTINGS.mongo.user,
)}:${encodeURIComponent(SETTINGS.mongo.password)}@${
  SETTINGS.mongo.host
}:27017/${SETTINGS.mongo.database}`;

void mongoose.connect(MONGODB_URI);

interface Game {
  Black: null | string;
  BlackElo: null | number;
  Day: null | number;
  ECO: null | string;
  Event: null | string;
  id: null | number;
  Month: null | number;
  moves: ArrayBuffer | null;
  Result: null | string;
  Round: null | string;
  White: null | string;
  WhiteElo: null | number;
  Year: null | number;
}

interface Limits {
  maxElo: null | number;
  maxYear: null | number;
  minYear: null | number;
}

interface Player {
  fullname: string;
}

interface SearchGameParameters {
  black?: string;
  event?: string;
  ignore?: string;
  maxEco?: string;
  maxYear?: string;
  minEco?: string;
  minYear?: string;
  searching?: string;
  table?: string;
  white?: string;
}

const BASE = {
  async eloHistory(player: string, base = "all") {
    let fulltextPlayer = player;
    if (fulltextPlayer.split(" ").length === 0) {
      return [];
    }

    fulltextPlayer = this.fulltextName(fulltextPlayer);

    const gamesTable =
      base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
    const playersTable =
      base == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers;

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

  async execSearch<T>(
    query: string,
    parameters: (number | string | undefined)[] = [],
  ): Promise<T[]> {
    return new Promise((resolve) => {
      database.query(query, parameters, (error, result: T[]) => {
        if (error) {
          resolve([]);
          console.error(query);
          console.error(parameters);
          throw error;
        }
        try {
          resolve(result);
        } catch (error) {
          resolve([]);
          console.error(query);
          console.error(parameters);

          throw error;
        }
      });
    });
  },

  async fideData(name: string) {
    const parameters = [name];
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
      parameters.push(nameFul);
      query += ` AND MATCH(NAME) AGAINST(
          ? IN BOOLEAN MODE
      )`;
    }
    const result = await this.execSearch(query, parameters);
    return result;
  },

  fulltextName(name: string) {
    let nameFul = name.replaceAll(/['`-]/g, " ");
    if (nameFul[0] == "'" || nameFul[0] == "`") {
      nameFul = nameFul.slice(1);
    }
    nameFul = nameFul.replaceAll(/[^\d\sa-z]/gi, "");
    nameFul = nameFul.replaceAll(/\b\w{1,2}\b/g, "");
    nameFul = nameFul.replaceAll(/\s+/g, " ");
    nameFul = nameFul.trim();
    nameFul = nameFul
      .split(" ")
      .filter(Boolean)
      .map((word) => "+" + word)
      .join(" ");
    return nameFul;
  },

  async getGame(id: number | string, base: string) {
    const playersTable =
      base == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers;

    const table =
      base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
    const query = `SELECT
    ${table}.id, moves_blob as moves, ${
      SETTINGS.mysql.eventsTable
    }.name as Event, ${
      SETTINGS.mysql.sitesTable
    }.site as Site, ${table}.Year, ${table}.Month, ${table}.Day,  Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo,${
      SETTINGS.mysql.ecoTable
    }.ECO as  ECO
    FROM ${table}
    inner join ${playersTable} as t1 on WhiteID = t1.id
    inner join ${playersTable} as t2 on BlackID = t2.id
    LEFT join ${SETTINGS.mysql.eventsTable} on ${table}.EventID = ${
      SETTINGS.mysql.eventsTable
    }.id
    LEFT join ${SETTINGS.mysql.sitesTable} on ${table}.siteID = ${
      SETTINGS.mysql.sitesTable
    }.id
    LEFT join ${SETTINGS.mysql.ecoTable} on ${table}.ecoID = ${
      SETTINGS.mysql.ecoTable
    }.id
    WHERE ${table}.id = ${Number(id)}
    `;
    return await this.execSearch<Game>(query);
  },

  async minMaxYearEco(player: string, base: string = "all") {
    let fulltextPlayer = player;
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
    }
    const parameters = [player];
    let query = `
SELECT max(WhiteElo) as maxElo, min(Year) as minYear, max(Year) as maxYear
FROM ${base == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable}
inner join ${
      base == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers
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
      base == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers
    } as t1 on BlackID = t1.id
WHERE t1.fullname like ?     `;
    if (fulltextPlayer) {
      parameters.push(fulltextPlayer);
      query += " AND MATCH(t1.fullname) against(? in boolean mode) ";
    }
    return await this.execSearch<Limits>(query, parameters);
  },

  async playerOpeningStats(player: string) {
    const whites = await this.playerOpeningStatsColor(player, "white");
    const blacks = await this.playerOpeningStatsColor(player, "black");
    const stats = {
      blacks: blacks,
      whites: whites,
    };
    return stats;
  },

  async playerOpeningStatsColor(player: string, color: string) {
    let fulltextPlayer = player;
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
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

    return await this.execSearch(query, parameters);
  },

  async polandTournaments(name: string) {
    const parameters = [name];
    const nameFul = this.fulltextName(name);
    let query = "SELECT id FROM players WHERE fullname LIKE ?";
    if (nameFul) {
      parameters.push(nameFul);
      query += " AND MATCH(fullname) AGAINST(? IN BOOLEAN MODE)";
    }
    const players = await this.execSearch<{ id: number }>(query, parameters);
    const playerIds = players.map((item) => item.id);

    if (!mongoose.connection.readyState) {
      await mongoose.connect(MONGODB_URI);
    }

    const result = await PolishTournament.find(
      {
        $or: playerIds.map((id) => ({ players: id })),
      },
      {
        _id: 1,
        end: 1,
        name: 1,
        players: 1,
        start: 1,
        url: 1,
      },
    )
      // eslint-disable-next-line perfectionist/sort-objects, unicorn/no-array-sort
      .sort({ start: -1, end: -1 })
      .lean()
      .exec();

    const formattedResult = result.map((document) => ({
      end: document.end,
      id: document._id,
      name: document.name,
      players: document.players,
      start: document.start,
      url: document.url,
    }));

    return formattedResult;
  },
  async searchGames(object: SearchGameParameters) {
    const searching = object.searching || "classic";
    let table;
    let white = "";
    let black = "";
    const ignore = object.ignore && object.ignore.toLowerCase() === "true";
    let event;
    const minYear = Number(object.minYear) || 1475;
    const maxYear = Number(object.maxYear) || new Date().getFullYear();
    const minEco = object.minEco || "A00";
    const maxEco = object.maxEco || "E99";
    let whiteLike;
    let blackLike;

    if (object.table) {
      table = object.table || "all";
    }
    if (object.white) {
      white = object.white;
      whiteLike = white + "%";
    }
    if (object.black) {
      black = object.black;
      blackLike = black + "%";
    }
    if (object.event) {
      event = object.event + "%";
    }

    const eventsTable = SETTINGS.mysql.eventsTable;
    const playersTable =
      table == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers;
    const gamesTable =
      table == "poland" ? SETTINGS.mysql.polandTable : SETTINGS.mysql.allTable;
    const ecoTable = SETTINGS.mysql.ecoTable;

    let query;
    const parameters = [];
    if (searching == "classic") {
      if (whiteLike || blackLike) {
        query = `SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
        if (whiteLike) {
          query += `whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          parameters.push(whiteLike);
        }
        if (blackLike) {
          if (whiteLike) {
            query += " AND ";
          }
          query += `blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
          parameters.push(blackLike);
        }
        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          parameters.push(minYear, maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          parameters.push(event);
        }

        if (minEco != "A00" || maxEco != "E99") {
          query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
          parameters.push(minEco, maxEco);
        }

        if (ignore) {
          query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;
          if (whiteLike) {
            query += ` blackid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
            parameters.push(whiteLike);
          }
          if (blackLike) {
            if (whiteLike) {
              query += " AND ";
            }
            query += ` whiteid in (SELECT id FROM ${playersTable} WHERE fullname LIKE ?) `;
            parameters.push(blackLike);
          }
          if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
            query += " and Year BETWEEN ? and ? ";
            parameters.push(minYear, maxYear);
          }

          if (event) {
            query += `and ${eventsTable}.name like ? `;
            parameters.push(event);
          }

          if (minEco != "A00" || maxEco != "E99") {
            query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
            parameters.push(minEco, maxEco);
          }
        }
      } else {
        query =
          "SELECT null as id, null as moves, null as Event, null as Year, null as Month, null as Day, null as Round, null as White, null as Black, null as Result, null as WhiteElo, null as BlackElo, null as ECO";
      }
    } else if (searching == "fulltext") {
      if (white || black) {
        query = `SELECT
        ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
        Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
        FROM ${gamesTable}
        inner join ${playersTable} as t1 on WhiteID = t1.id
        inner join ${playersTable} as t2 on BlackID = t2.id
        left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
        LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
      left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
        WHERE `;
        if (whiteLike) {
          query += ` whiteid = (SELECT id FROM ${playersTable} WHERE `;
          white = this.fulltextName(object.white!);
          if (white) {
            query += " match(fullname) against(? in boolean mode) AND ";
            parameters.push(white);
          }
          query += " fullname like ? ) ";
          parameters.push(object.white);
        }

        if (blackLike) {
          if (whiteLike) {
            query += " and ";
          }
          query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
          black = this.fulltextName(object.black!);
          if (black) {
            query += "  match(fullname) against(? in boolean mode) AND  ";
            parameters.push(black);
          }
          query += "  fullname like ? ) ";
          parameters.push(object.black);
        }

        if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
          query += " and Year BETWEEN ? and ? ";
          parameters.push(minYear, maxYear);
        }

        if (event) {
          query += `and ${eventsTable}.name like ? `;
          parameters.push(event);
        }

        if (minEco != "A00" || maxEco != "E99") {
          query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
          parameters.push(minEco, maxEco);
        }

        if (ignore) {
          query += `UNION
          SELECT
          ${gamesTable}.id, moves_blob as moves, ${eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, ${gamesTable}.Year, ${gamesTable}.Month, ${gamesTable}.Day,
          Round, t1.fullname as White, t2.fullname as Black,  Result, WhiteElo, BlackElo, ${ecoTable}.ECO as ECO
          FROM ${gamesTable}
          inner join ${playersTable} as t1 on WhiteID = t1.id
          inner join ${playersTable} as t2 on BlackID = t2.id
          left join ${eventsTable} on ${gamesTable}.EventID = ${eventsTable}.id
          LEFT join ${SETTINGS.mysql.sitesTable} on ${gamesTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        left join ${ecoTable} on ${gamesTable}.ecoID = ${ecoTable}.id
          WHERE `;

          if (whiteLike) {
            query += ` blackid = (SELECT id FROM ${playersTable} WHERE `;
            if (white) {
              query += " match(fullname) against(? in boolean mode) AND  ";
              parameters.push(white);
            }
            query += " fullname like ? ) ";
            parameters.push(object.white);
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
              parameters.push(black);
            }
            query += " fullname like ? ) ";
            parameters.push(object.black);
          }

          if (!(minYear == 1475 && maxYear == new Date().getFullYear())) {
            query += " and Year BETWEEN ? and ? ";
            parameters.push(minYear, maxYear);
          }

          if (event) {
            query += `and ${eventsTable}.name like ? `;
            parameters.push(event);
          }

          if (minEco != "A00" || maxEco != "E99") {
            query += `and ${ecoTable}.ECO BETWEEN ? AND ? `;
            parameters.push(minEco, maxEco);
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

    return this.execSearch<Game>(query, parameters);
  },
  async searchPlayer(player: string, table: string, forFulltext = false) {
    player += "%";

    let query = `
    SELECT
    fullname
    FROM ${
      table == "poland"
        ? SETTINGS.mysql.polandPlayers
        : SETTINGS.mysql.allPlayers
    } WHERE fullname like ? `;

    let result = await this.execSearch<Player>(query, [player]);
    if (result.length === 0) {
      query = `
    SELECT
    fullname
    FROM ${SETTINGS.mysql.wholePlayers} WHERE fullname like ? `;

      result = await this.execSearch<Player>(query, [player]);
    }
    if (forFulltext) {
      for (const element of result) {
        element.fullname = this.fulltextName(element.fullname.trim());
      }
    }
    result = [...new Set(result)];

    return result.map((a) => a.fullname);
  },

  async searchPlayerOpeningGame(
    player: string,
    color: null | string = null,
    opening: null | string = null,
  ) {
    let query = `
    SELECT
        ${SETTINGS.mysql.allTable}.id, moves_blob as moves, ${SETTINGS.mysql.eventsTable}.name as Event, ${SETTINGS.mysql.sitesTable}.site as Site, 
        ${SETTINGS.mysql.allTable}.Year, ${SETTINGS.mysql.allTable}.Month, ${SETTINGS.mysql.allTable}.Day,  Round, t1.fullname as White, t2.fullname as Black,  
        Result, WhiteElo, BlackElo, ${SETTINGS.mysql.ecoTable}.ECO
        FROM ${SETTINGS.mysql.allTable}
        inner join ${SETTINGS.mysql.allPlayers} as t1 on WhiteID = t1.id
        inner join ${SETTINGS.mysql.allPlayers} as t2 on BlackID = t2.id
        LEFT join ${SETTINGS.mysql.eventsTable} on ${SETTINGS.mysql.allTable}.EventID = ${SETTINGS.mysql.eventsTable}.id
        LEFT join ${SETTINGS.mysql.sitesTable} on ${SETTINGS.mysql.allTable}.siteID = ${SETTINGS.mysql.sitesTable}.id
        LEFT JOIN ${SETTINGS.mysql.ecoTable} on ${SETTINGS.mysql.allTable}.ecoID = ${SETTINGS.mysql.ecoTable}.ID
`;
    let fulltextPlayer = player;
    if (fulltextPlayer.split(" ").length > 1) {
      fulltextPlayer = this.fulltextName(fulltextPlayer);
    }
    const parameters = [player];
    if (fulltextPlayer) {
      parameters.push(fulltextPlayer);
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
        parameters.push(opening);
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
        parameters.push(opening);
      }
      query +=
        "\norder by Year DESC, Month DESC, Day DESC,Event, Round desc, White, Black LIMIT 10000";
    }
    return await this.execSearch<Game>(query, parameters);
  },
};

export default BASE;
