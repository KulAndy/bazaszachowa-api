#include <array>
#include <bit>
#include <cstdint>
#include <napi.h>
#include <string>

#include "chess-library/include/chess.hpp"

using namespace chess;

Napi::Value fent2zobrist(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string fen = info[0].As<Napi::String>().Utf8Value();

  uint64_t hash = Board::fromFen(fen).zobrist();

  return Napi::BigInt::New(env, hash);
}

std::array<uint64_t, 3> compute(const std::string &input);

Napi::Value fen2bitboards(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string fen = info[0].As<Napi::String>().Utf8Value();
  Board board = Board::fromFen(fen);

  Bitboard pawn_bitmap = board.pieces(PieceType::PAWN);
  for (Square sq = Square::underlying::SQ_A2; sq <= Square::underlying::SQ_H2;
       sq++) {
    pawn_bitmap.clear(sq.index());
  }
  for (Square sq = Square::underlying::SQ_A7; sq <= Square::underlying::SQ_H7;
       sq++) {
    pawn_bitmap.clear(sq.index());
  }
  Bitboard knight_bitmap = board.pieces(PieceType::KNIGHT);
  knight_bitmap.clear(Square(Square::underlying::SQ_B1).index());
  knight_bitmap.clear(Square(Square::underlying::SQ_G1).index());
  knight_bitmap.clear(Square(Square::underlying::SQ_B8).index());
  knight_bitmap.clear(Square(Square::underlying::SQ_G8).index());

  Bitboard bishop_bitmap = board.pieces(PieceType::BISHOP);
  bishop_bitmap.clear(Square(Square::underlying::SQ_C1).index());
  bishop_bitmap.clear(Square(Square::underlying::SQ_F1).index());
  bishop_bitmap.clear(Square(Square::underlying::SQ_C8).index());
  bishop_bitmap.clear(Square(Square::underlying::SQ_F8).index());

  Bitboard rook_bitmap = board.pieces(PieceType::ROOK);
  rook_bitmap.clear(Square(Square::underlying::SQ_A1).index());
  rook_bitmap.clear(Square(Square::underlying::SQ_H1).index());
  rook_bitmap.clear(Square(Square::underlying::SQ_A8).index());
  rook_bitmap.clear(Square(Square::underlying::SQ_H8).index());

  Bitboard queen_bitmap = board.pieces(PieceType::QUEEN);
  queen_bitmap.clear(Square(Square::underlying::SQ_D1).index());
  queen_bitmap.clear(Square(Square::underlying::SQ_D8).index());

  Bitboard king_bitmap = board.pieces(PieceType::KING);
  king_bitmap.clear(Square(Square::underlying::SQ_E1).index());
  king_bitmap.clear(Square(Square::underlying::SQ_E8).index());

  uint64_t pawn_moves = 0;
  uint64_t pawn_bits = pawn_bitmap.getBits();

  while (pawn_bits) {
    int idx = std::countr_zero(pawn_bits);
    pawn_moves |= idx;
    pawn_bits &= (pawn_bits - 1);
  }

  Bitboard bitmap1 =
      Bitboard((pawn_bitmap.getBits() << 8) | (pawn_moves & 0xFF));
  Bitboard bitmap2 = bishop_bitmap | rook_bitmap;
  Bitboard bitmap3 = knight_bitmap | king_bitmap | queen_bitmap;

  Napi::Array result = Napi::Array::New(env, 3);

  result.Set(static_cast<uint32_t>(0),
             Napi::BigInt::New(env, bitmap1.getBits()));

  result.Set(static_cast<uint32_t>(1),
             Napi::BigInt::New(env, bitmap2.getBits()));

  result.Set(static_cast<uint32_t>(2),
             Napi::BigInt::New(env, bitmap3.getBits()));

  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("fen2zobrist", Napi::Function::New(env, fent2zobrist));

  exports.Set("fen2bitboards", Napi::Function::New(env, fen2bitboards));

  return exports;
}

NODE_API_MODULE(chess, Init)
