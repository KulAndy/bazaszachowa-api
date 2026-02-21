import mongoose from "mongoose";

import SETTINGS from "../../../app/settings";
import MYSQL_BASE from "../mysql";

import FideTournament from "./model/FideTournament";
import PolishTournament from "./model/PolishTournament";

const MONGODB_URI = `mongodb://${encodeURIComponent(
  SETTINGS.mongo.user,
)}:${encodeURIComponent(SETTINGS.mongo.password)}@${
  SETTINGS.mongo.host
}:27017/${SETTINGS.mongo.database}`;

void mongoose.connect(MONGODB_URI);

const polandTournaments = async (name: string) => {
  const parameters = [name];
  const nameFul = MYSQL_BASE.fulltextName(name);
  let query = `SELECT id FROM ${SETTINGS.mysql.wholePlayers} WHERE fullname LIKE ?`;
  if (nameFul) {
    parameters.push(nameFul);
    query += " AND MATCH(fullname) AGAINST(? IN BOOLEAN MODE)";
  }
  const players = await MYSQL_BASE.execSearch<{ id: number }>(
    query,
    parameters,
  );
  const playerIds = players.map((item) => item.id);
  if (playerIds.length === 0) {
    return [];
  }

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
    // eslint-disable-next-line perfectionist/sort-objects
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
};

const fideTournaments = async (name: string) => {
  const players = await MYSQL_BASE.fideData(name);
  const playerIds = players.map((item) => item.fideid);
  if (playerIds.length === 0) {
    return [];
  }

  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGODB_URI);
  }

  const result = await FideTournament.find(
    {
      $or: playerIds.map((id) => ({ players: id })),
    },
    {
      _id: 1,
      country: 1,
      name: 1,
      players: 1,
      start: 1,
    },
  )
    .sort({ start: -1 })
    .lean()
    .exec();

  const formattedResult = result.map((document) => ({
    country: document.country,
    id: document._id,
    name: document.name,
    players: document.players,
    start: document.start,
  }));

  return formattedResult;
};

const MONGO_DB = {
  fideTournaments,
  polandTournaments,
};

export default MONGO_DB;
