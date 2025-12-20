import mongoose, { Document, Schema } from "mongoose";

import settings from "../../../../app/settings";

interface PolishTournament extends Omit<Document, "_id"> {
  _id: number;
  end: Date;
  name: string;
  players: number[];
  start: Date;
  url: string;
}

const PolishTournamentSchema: Schema = new Schema({
  end: { required: true, type: Date },
  name: { required: true, trim: true, type: String },
  players: { default: [], type: [Number] },
  start: { required: true, type: Date },
  url: {
    required: true,
    trim: true,
    type: String,
  },
});

PolishTournamentSchema.index({ start: 1 });
PolishTournamentSchema.index({ end: 1 });
PolishTournamentSchema.index({ players: 1 });

const PolishTournament = mongoose.model<PolishTournament>(
  "PolishTournament",
  PolishTournamentSchema,
  settings.mongo.polandCollection,
);

export default PolishTournament;
