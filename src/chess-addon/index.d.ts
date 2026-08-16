export function fen2bitboards(fen: string): [bigint, bigint, bigint];
export function fen2zobrist(fen: string): bigint;

declare const addon: {
  fen2bitboards: typeof fen2bitboards;
  fen2zobrist: typeof fen2zobrist;
};

export default addon;
