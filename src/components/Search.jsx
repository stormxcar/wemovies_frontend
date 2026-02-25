import React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MovieList from "./MovieList";
import useDocumentTitle from "../hooks/useDocumentTitle";

function Search() {
  const { state } = useLocation();
  const movies = state?.movies || [];

  const { t } = useTranslation();
  // Set document title for search page
  useDocumentTitle(t("common.search"));

  return (
    <div className="bg-gray-900 text-white px-10 w-full pt-20">
      <div className="">
        {movies.length > 0 ? (
          // <GridMovies title="Kết quả tim kiếm" movies={movies} moviesPerPage={8} />
          <MovieList movies={movies} title={t("common.search")} />
        ) : (
          <p>{t("search.no_results")}</p>
        )}
      </div>
    </div>
  );
}

export default Search;
