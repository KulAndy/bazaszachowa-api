import execSearch from "./execSearch";
import getGame from "./game/getGame";
import searchGames from "./game/searchGames";
import searchPlayerOpeningGame from "./game/searchPlayerOpeningGame";
import eloHistory from "./player/eloHistory";
import fideData from "./player/fideData";
import minMaxYearEco from "./player/minMaxYearEco";
import playerOpeningStats from "./player/playerOpeningStats";
import searchPlayer from "./player/searchPlayer";
import fulltextName from "./tools/fulltextName";

export interface Game {
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

export interface Limits {
  maxElo: null | number;
  maxYear: null | number;
  minYear: null | number;
}

export interface SearchGameParameters {
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

const MYSQL_BASE = {
  eloHistory,
  execSearch,
  fideData,
  fulltextName,
  getGame,
  minMaxYearEco,
  playerOpeningStats,
  searchGames,
  searchPlayer,
  searchPlayerOpeningGame,
};

export default MYSQL_BASE;
