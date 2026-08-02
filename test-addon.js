const assert = require("node:assert").strict;
const addon = require("./src/chess-addon");

console.log("Running tests for chess-addon...");

const startPos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
assert.strictEqual(addon.fen2zobrist(startPos), 5060803636482931868n);
assert.deepStrictEqual(addon.fen2bitboards(startPos), [0n, 0n, 0n]);

const after_Nh3 = "rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R b KQkq - 1 1";
const h3_index = 8n * 2n + 7n;

assert.strictEqual(addon.fen2zobrist(after_Nh3), 3311637314013528902n);
assert.deepStrictEqual(addon.fen2bitboards(after_Nh3), [
  0n,
  0n,
  1n << h3_index,
]);

const after_e4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const e4_index = 8n * 3n + 4n;

assert.strictEqual(addon.fen2zobrist(after_e4), 9384546495678726550n);
assert.deepStrictEqual(addon.fen2bitboards(after_e4), [
  ((1n << e4_index) << 8n) | e4_index,
  0n,
  0n,
]);

console.log("All tests passed for chess-addon.");
