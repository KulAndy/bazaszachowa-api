import chessAddon from "../../../../chess-addon";
import SETTINGS from "../../../settings";
import execQuery from "../execQuery";

export interface BasicHeaders {
  id: number;
}

const searchFen = async (fen: string) => {
  const zobrist = chessAddon.fen2zobrist(fen);
  const bitmaps = chessAddon.fen2bitboards(fen);

  const [truncated, color] = fen.split(" ");

  const counts = {
    b: 0,
    B: 0,
    n: 0,
    N: 0,
    p: 0,

    P: 0,
    q: 0,
    Q: 0,
    r: 0,
    R: 0,
  };
  for (const piece of Object.keys(counts)) {
    counts[piece as keyof typeof counts] =
      truncated.length - truncated.replaceAll(piece, "").length;
  }

  const includedElo = color === "w" ? "WhiteElo" : "BlackElo";

  const order = ` ORDER By ${includedElo} DESC`;

  const query1 = `SELECT g.id, g.${includedElo}
    FROM ${SETTINGS.mysql.ecoPositionsTable} ep
    JOIN ${SETTINGS.mysql.allTable} g
        USING(ecoID)
    WHERE ep.zobrist = ?
    AND g.${includedElo} BETWEEN 2200 AND 3000
    AND 0
    ${order}
    LIMIT 25
`;
  let result = await execQuery<BasicHeaders>(query1, [zobrist]);

  if (result.length === 0) {
    let query2 = `
    SELECT g.id, g.${includedElo}
    FROM ${SETTINGS.mysql.bitboardTable} bb
    STRAIGHT_JOIN ${SETTINGS.mysql.allTable} g
        ON bb.id = g.bitboardsID
    JOIN ${SETTINGS.mysql.ecoTable} e
      ON g.ecoID = e.id

    WHERE NOT EXISTS (
        SELECT 1
        FROM ${SETTINGS.mysql.ecoPositionsTable} ep
        WHERE ep.ecoID = g.ecoID
            AND ep.zobrist = ?
            AND g.${includedElo} BETWEEN 2200 AND 3000
    )

    AND g.${includedElo} BETWEEN 2200 AND 3000
    AND e.white_material >= ?
    AND e.white_pawns >= ?
    AND e.white_pawn_knights >= ?
    AND e.white_pawn_bishops >= ?
    AND e.white_pawn_rooks >= ?
    AND e.white_pawn_queens >= ?

    AND e.black_material >= ?
    AND e.black_pawns >= ?
    AND e.black_pawn_knights >= ?
    AND e.black_pawn_bishops >= ?
    AND e.black_pawn_rooks >= ?
    AND e.black_pawn_queens >= ?
    `;

    const parameters = [
      zobrist,
      counts.P + counts.N + counts.B + counts.R + counts.Q,
      counts.P,
      counts.P + counts.N,
      counts.P + counts.B,
      counts.P + counts.R,
      counts.P + counts.Q,

      counts.p + counts.n + counts.b + counts.r + counts.q,
      counts.p,
      counts.p + counts.n,
      counts.p + counts.b,
      counts.p + counts.r,
      counts.p + counts.q,
    ];

    for (const [index, bitmap] of bitmaps.entries()) {
      if (bitmap > 0n) {
        for (let index_ = 0n; index_ < 8; index_++) {
          const chunk = (bitmap >> (index_ * 8n)) & 255n;
          if (chunk > 0n) {
            const bitmapName = `bitmap${index + 1}`;
            const rankName = `${bitmapName}_r${index_ + 1n}`;
            query2 += ` AND bb.${rankName} & ? = ?`;
            parameters.push(Number(chunk), Number(chunk));
          }
        }
      }
    }

    query2 += ` ${order} LIMIT 25`;
    result = await execQuery(query2, parameters);
  }

  return result;
};

export default searchFen;
