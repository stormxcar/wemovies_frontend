import React, { useState } from "react";
import { useParams } from "react-router-dom";

// MovieDetail Component
const MovieDetail = () => {
  const sampleMovies = [
    {
      id: 1,
      title: "Inception",
      category: "Action",
      country: "USA",
      type: "Movie",
      year: 2010,
      description:
        "A thief who steals corporate secrets through dream infiltration technology.",
    },
    {
      id: 2,
      title: "Parasite",
      category: "Drama",
      country: "Korea",
      type: "Movie",
      year: 2019,
      description:
        "A poor family schemes to become employed by a wealthy family.",
    },
  ];
  const sampleCategories = [
    { id: 1, name: "Action" },
    { id: 2, name: "Drama" },
  ];
  const sampleCountries = [
    { id: 1, name: "USA" },
    { id: 2, name: "Korea" },
  ];
  const sampleTypes = [
    { id: 1, name: "Movie" },
    { id: 2, name: "Series" },
  ];
  const sampleUsers = [
    { id: 1, username: "admin1", email: "admin1@example.com" },
    { id: 2, username: "admin2", email: "admin2@example.com" },
  ];
  const { id } = useParams();
  const movie = sampleMovies.find((m) => m.id === parseInt(id));
  if (!movie) return <div className="p-6">Phim không tồn tại</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{movie.title}</h1>
      <div className="bg-white p-4 rounded shadow">
        <p>
          <strong>Danh mục:</strong> {movie.category}
        </p>
        <p>
          <strong>Quốc gia:</strong> {movie.country}
        </p>
        <p>
          <strong>Loại:</strong> {movie.type}
        </p>
        <p>
          <strong>Năm:</strong> {movie.year}
        </p>
        <p>
          <strong>Mô tả:</strong> {movie.description}
        </p>
      </div>
    </div>
  );
};

export default MovieDetail;
