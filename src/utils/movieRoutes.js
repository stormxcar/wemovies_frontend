const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

export const isUuidLike = (value) =>
  UUID_LIKE_REGEX.test(normalizeString(value));

export const getMovieSlug = (movie) => {
  if (!movie || typeof movie !== "object") return "";

  return (
    normalizeString(movie.slug) ||
    normalizeString(movie.movieSlug) ||
    normalizeString(movie?.movie?.slug)
  );
};

export const getMovieIdentifier = (movie, fallbackIdentifier = "") => {
  const slug = getMovieSlug(movie);
  if (slug) return slug;

  const fallback = normalizeString(fallbackIdentifier);
  if (fallback) return fallback;

  if (!movie || typeof movie !== "object") return "";
  return normalizeString(movie.id || movie.movieId || movie?.movie?.id || "");
};

export const getMovieDetailPath = (movie, fallbackIdentifier = "") => {
  const identifier = getMovieIdentifier(movie, fallbackIdentifier);
  return `/movie/${encodeURIComponent(identifier)}`;
};

export const getMovieWatchPath = (movie, fallbackIdentifier = "") => {
  const identifier = getMovieIdentifier(movie, fallbackIdentifier);
  return `/movie/watch/${encodeURIComponent(identifier)}`;
};

export const getMovieEpisodePath = (
  movie,
  episodeIndex,
  fallbackIdentifier = "",
) => {
  const identifier = getMovieIdentifier(movie, fallbackIdentifier);
  return `/movie/${encodeURIComponent(identifier)}/episode/${episodeIndex}`;
};
