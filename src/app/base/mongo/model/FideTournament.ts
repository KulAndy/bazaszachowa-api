import mongoose, { Document, Schema } from "mongoose";

import settings from "../../../../app/settings";

interface FideTournament extends Omit<Document, "_id"> {
  _id: number;
  country: string;
  name: string;
  players: number[];
  start: Date;
}

const FideTournamentSchema: Schema = new Schema({
  country: {
    required: true,
    trim: true,
    type: String,
  },
  name: { required: true, trim: true, type: String },
  players: { default: [], type: [Number] },
  start: { required: true, type: Date },
});

FideTournamentSchema.index({ start: 1 });
FideTournamentSchema.index({ end: 1 });
FideTournamentSchema.index({ players: 1 });

const FideTournament = mongoose.model<FideTournament>(
  "FideTournament",
  FideTournamentSchema,
  settings.mongo.fideCollection,
);

export default FideTournament;
