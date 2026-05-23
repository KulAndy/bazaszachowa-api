/* eslint-disable regexp/no-unused-capturing-group */

const lichessValidate = (url: string) => {
  const studyRegex = /^https:\/\/lichess\.org\/study\/[\dA-Za-z]+$/;
  const broadcastRegex =
    /^https:\/\/lichess\.org\/broadcast\/[\w-]+\/[\dA-Za-z]+$/;
  const broadcastRoundsRegex =
    /^https:\/\/lichess\.org\/broadcast(\/[\w-]+){2}(\/[\dA-Za-z]+){1,2}$/;
  return (
    studyRegex.test(url) ||
    broadcastRegex.test(url) ||
    broadcastRoundsRegex.test(url)
  );
};

const livechessValidate = (url: string) => {
  const livechessRegex = /^https:\/\/view\.livechesscloud\.com\/#[\da-f-]+$/;

  return livechessRegex.test(url);
};

const remotePgnValidate = (url: string) => {
  const remotePgnRegex = /^https?:\/\/[^\s#?]+\.pgn(?:\?[^\s#]*)?(?:#\S*)?$/i;

  return remotePgnRegex.test(url);
};

export const validateSource = (
  url: string,
  source: "lichess" | "livechess" | "remote_pgn",
) => {
  switch (source) {
    case "lichess": {
      return lichessValidate(url);
    }
    case "livechess": {
      return livechessValidate(url);
    }
    case "remote_pgn": {
      return remotePgnValidate(url);
    }
    default: {
      return false;
    }
  }
};
