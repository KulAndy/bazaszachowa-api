/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const addon = require("./build/Release/chess.node");

export const fen2zobrist = addon.fen2zobrist;
export const fen2bitboards = addon.fen2bitboards;

export default {
  fen2bitboards,
  fen2zobrist,
};
