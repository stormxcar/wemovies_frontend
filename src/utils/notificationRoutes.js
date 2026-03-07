import { fetchMovieByIdentifier } from "../services/api";
import {
  getMovieDetailPath,
  getMovieEpisodePath,
  getMovieWatchPath,
  isUuidLike,
} from "./movieRoutes";

const MOVIE_WATCH_LEGACY_REGEX = /^\/watch\/([^/?#]+)(.*)$/i;
const MOVIE_WATCH_REGEX = /^\/movie\/watch\/([^/?#]+)(.*)$/i;
const MOVIE_EPISODE_REGEX = /^\/movie\/([^/?#]+)\/episode\/([^/?#]+)(.*)$/i;
const MOVIE_DETAIL_REGEX = /^\/movie\/([^/?#]+)(.*)$/i;
const MOVIES_LEGACY_DETAIL_REGEX = /^\/movies\/([^/?#]+)(.*)$/i;

const parseUrlParts = (value) => {
  const match = String(value || "").match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    path: match?.[1] || "",
    query: match?.[2] || "",
    hash: match?.[3] || "",
  };
};

const appendSuffix = (path, suffix = "") => `${path}${suffix || ""}`;

export const normalizeNotificationActionUrl = async (actionUrl) => {
  const url = String(actionUrl || "").trim();
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }

  const { path, query, hash } = parseUrlParts(url);
  const suffix = `${query}${hash}`;

  const legacyWatchMatch = path.match(MOVIE_WATCH_LEGACY_REGEX);
  if (legacyWatchMatch) {
    const identifier = decodeURIComponent(legacyWatchMatch[1] || "");
    try {
      const movie = await fetchMovieByIdentifier(identifier);
      return appendSuffix(getMovieWatchPath(movie, identifier), suffix);
    } catch {
      return appendSuffix(
        `/movie/watch/${encodeURIComponent(identifier)}`,
        suffix,
      );
    }
  }

  const watchMatch = path.match(MOVIE_WATCH_REGEX);
  if (watchMatch) {
    const identifier = decodeURIComponent(watchMatch[1] || "");
    try {
      const movie = await fetchMovieByIdentifier(identifier);
      return appendSuffix(getMovieWatchPath(movie, identifier), suffix);
    } catch {
      return appendSuffix(
        `/movie/watch/${encodeURIComponent(identifier)}`,
        suffix,
      );
    }
  }

  const episodeMatch = path.match(MOVIE_EPISODE_REGEX);
  if (episodeMatch) {
    const identifier = decodeURIComponent(episodeMatch[1] || "");
    const episodeIndex = decodeURIComponent(episodeMatch[2] || "0");
    try {
      const movie = await fetchMovieByIdentifier(identifier);
      return appendSuffix(
        getMovieEpisodePath(movie, episodeIndex, identifier),
        suffix,
      );
    } catch {
      return appendSuffix(
        `/movie/${encodeURIComponent(identifier)}/episode/${encodeURIComponent(episodeIndex)}`,
        suffix,
      );
    }
  }

  const detailMatch = path.match(MOVIE_DETAIL_REGEX);
  if (detailMatch) {
    const identifier = decodeURIComponent(detailMatch[1] || "");
    try {
      const movie = await fetchMovieByIdentifier(identifier);
      return appendSuffix(getMovieDetailPath(movie, identifier), suffix);
    } catch {
      return appendSuffix(`/movie/${encodeURIComponent(identifier)}`, suffix);
    }
  }

  // Legacy/incorrect route from some notifications: /movies/:uuid
  // Only rewrite when identifier is UUID-like to avoid breaking category pages.
  const moviesLegacyMatch = path.match(MOVIES_LEGACY_DETAIL_REGEX);
  if (moviesLegacyMatch) {
    const identifier = decodeURIComponent(moviesLegacyMatch[1] || "");
    if (isUuidLike(identifier)) {
      try {
        const movie = await fetchMovieByIdentifier(identifier);
        return appendSuffix(getMovieDetailPath(movie, identifier), suffix);
      } catch {
        return appendSuffix(`/movie/${encodeURIComponent(identifier)}`, suffix);
      }
    }
  }

  return url;
};
