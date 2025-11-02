interface Move {
  from: string;
  promotion?: string;
  to: string;
}

const CHESS = {
  movesBin2obj: (blob: ArrayBuffer | null) => {
    if (blob === null) {
      return [];
    }
    const bytes = new Uint8Array(blob);
    const result: Move[] = [];

    for (let index = 0; index < bytes.length; index += 2) {
      const packed = (bytes[index] << 8) | bytes[index + 1];

      const b1 = (packed >> 10) & 0x3f;
      const b2 = (packed >> 4) & 0x3f;
      const b3 = packed & 0x07;

      try {
        const move: Move = {
          from: CHESS.SQUARES[b1] ?? "",
          to: CHESS.SQUARES[b2] ?? "",
        };

        if (CHESS.PIECES[b3]) {
          move.promotion = CHESS.PIECES[b3];
        }

        result.push(move);
      } catch (error) {
        console.error(error);
        break;
      }
    }

    return result;
  },

  PIECES: ["p", "n", "b", "r", "q", "k", null],

  SQUARES: [
    "a1",
    "b1",
    "c1",
    "d1",
    "e1",
    "f1",
    "g1",
    "h1",
    "a2",
    "b2",
    "c2",
    "d2",
    "e2",
    "f2",
    "g2",
    "h2",
    "a3",
    "b3",
    "c3",
    "d3",
    "e3",
    "f3",
    "g3",
    "h3",
    "a4",
    "b4",
    "c4",
    "d4",
    "e4",
    "f4",
    "g4",
    "h4",
    "a5",
    "b5",
    "c5",
    "d5",
    "e5",
    "f5",
    "g5",
    "h5",
    "a6",
    "b6",
    "c6",
    "d6",
    "e6",
    "f6",
    "g6",
    "h6",
    "a7",
    "b7",
    "c7",
    "d7",
    "e7",
    "f7",
    "g7",
    "h7",
    "a8",
    "b8",
    "c8",
    "d8",
    "e8",
    "f8",
    "g8",
    "h8",
    null,
  ],
};

export default CHESS;
