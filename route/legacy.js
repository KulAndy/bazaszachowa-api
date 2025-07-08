module.exports = function redirectLegacyUrls(req, res, next) {
  const matchers = [
    { from: /^\/cr_data\/([^/]+)$/, to: (p) => `/player/cr/${p}` },
    { from: /^\/fide_data\/([^/]+)$/, to: (p) => `/player/fide/${p}` },
    {
      from: /^\/graph\/([^/]+)\/([^/]+)$/,
      to: (format, player) => `/player/plot/${format}/${player}`,
    },
    { from: /^\/min_max_year_elo\/([^/]+)$/, to: (p) => `/player/limit/${p}` },
    {
      from: /^\/player_opening_stats\/([^/]+)$/,
      to: (p) => `/player/openings/${p}`,
    },
    { from: /^\/search_player\/([^/]+)$/, to: (p) => `/players/${p}` },
    {
      from: /^\/search_player_opening_game\/([^/]+)\/(white|black)(?:\/([^/]+))?$/,
      to: (player, color, opening) =>
        opening
          ? `/games/opening/${player}/${color}/${opening}`
          : `/games/opening/${player}/${color}`,
    },
    { from: /^\/send-email\/?$/, to: () => `/mail/send` },
    { from: /^\/base-dumps\/?$/, to: () => `/base/dumps` },
    {
      from: /^\/search_game\/?$/,
      to: () =>
        `/games${req.url.includes("?") ? req.url.slice(req.path.length) : ""}`,
    },
  ];

  for (const rule of matchers) {
    const match = req.path.match(rule.from);
    if (match) {
      const newPath = rule.to(...match.slice(1));
      const query = req.url.slice(req.path.length);
      req.url = newPath + query;
      req.path = newPath;
      break;
    }
  }

  next();
};
