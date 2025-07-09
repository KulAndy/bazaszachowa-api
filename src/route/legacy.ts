import { Request, Response } from "express";

interface RedirectRule {
  from: RegExp;
  to: (...args: string[]) => string;
}

export default function redirectLegacyUrls(
  req: Request,
  _res: Response,
  next: Function
) {
  const matchers: RedirectRule[] = [
    {
      from: /^\/cr_data\/([^/]+)$/,
      to: (p: string) => `/player/cr/${p}`,
    },
    {
      from: /^\/fide_data\/([^/]+)$/,
      to: (p: string) => `/player/fide/${p}`,
    },
    {
      from: /^\/graph\/([^/]+)\/([^/]+)$/,
      to: (format: string, player: string) =>
        `/player/plot/${format}/${player}`,
    },
    {
      from: /^\/min_max_year_elo\/([^/]+)$/,
      to: (p: string) => `/player/limit/${p}`,
    },
    {
      from: /^\/player_opening_stats\/([^/]+)$/,
      to: (p: string) => `/player/openings/${p}`,
    },
    {
      from: /^\/search_player\/([^/]+)$/,
      to: (p: string) => `/players/${p}`,
    },
    {
      from: /^\/search_player_opening_game\/([^/]+)\/(white|black)(?:\/([^/]+))?$/,
      to: (player: string, color: string, opening?: string) =>
        opening
          ? `/games/opening/${player}/${color}/${opening}`
          : `/games/opening/${player}/${color}`,
    },
    {
      from: /^\/send-email\/?$/,
      to: () => "/mail/send",
    },
    {
      from: /^\/base-dumps\/?$/,
      to: () => "/base/dumps",
    },
    {
      from: /^\/search_game\/?$/,
      to: () =>
        `/games${req.url.includes("?") ? req.url.slice(req.path.length) : ""}`,
    },
  ];

  for (const rule of matchers) {
    const match = req.path.match(rule.from);
    if (match) {
      const newPath = rule.to(
        ...match.slice(1).filter((m): m is string => !!m)
      );
      const query = req.url.slice(req.path.length);
      (req as any).url = newPath + query;
      next();
      return;
    }
  }
  next();
}
