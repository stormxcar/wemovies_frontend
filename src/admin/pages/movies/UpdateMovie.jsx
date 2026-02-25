import React, { useState, useEffect, useMemo, useReducer } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
  fetchJson,
  fetchMovieType as getTypes,
  fetchCategories as getCategories,
  fetchCountries as getCountries,
} from "../../../services/api";
import ImageUpload from "../../../components/ui/ImageUpload";
import { useLoading } from "../../../context/UnifiedLoadingContext";
import { LoadingWrapper, FormSkeleton } from "../../../components/ui/Skeleton";

// Reducer for formData state management
const formReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "UPDATE_EPISODE_LINK":
      const newEpisodeLinks = [...state.episodeLinks];
      newEpisodeLinks[action.index] = action.value;
      return { ...state, episodeLinks: newEpisodeLinks };
    case "ADD_ACTOR":
      return { ...state, actors: [...state.actors, ""] };
    case "UPDATE_ACTOR":
      const newActors = [...state.actors];
      newActors[action.index] = action.value;
      return { ...state, actors: newActors };
    case "RESET":
      return action.payload;
    default:
      return state;
  }
};

const UpdateMovie = ({ title, items, updateEndpoint }) => {
  const { setLoading, isLoading } = useLoading();
  const [selectedId, setSelectedId] = useState("");
  const [formData, dispatchFormData] = useReducer(formReducer, {
    id: "",
    title: "",
    titleByLanguage: "",
    status: "",
    totalEpisodes: "",
    director: "",
    actors: [""],
    duration: "",
    quality: "",
    vietSub: "",
    description: "",
    release_year: 2000,
    movieTypeIds: [],
    categoryIds: [],
    countryId: null,
    hot: "",
    thumb_url: "",
    banner_url: "",
    ageRating: "",
    trailer: "",
    link: "",
    episodeLinks: [], // Initialize as empty array
  });
  const [movieTypes, setMovieTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [episodeLinks, setEpisodeLinks] = useState([]);
  const [thumbnailData, setThumbnailData] = useState({
    type: "url",
    value: "",
  });
  const [bannerData, setBannerData] = useState({
    type: "url",
    value: "",
  });
  const navigate = useNavigate();

  // Fetch movie types, categories, and countries
  useEffect(() => {
    const fetchOptions = async () => {
      await setLoading("fetchOptions", true, "Đang tải dữ liệu...");
      try {
        const [typesData, catsData, countriesData] = await Promise.all([
          getTypes(),
          getCategories(),
          getCountries(),
        ]);
        setMovieTypes(typesData.map((t) => ({ value: t.id, label: t.name })));
        setCategories(catsData.map((c) => ({ value: c.id, label: c.name })));
        setCountries(
          countriesData.map((c) => ({ value: c.id, label: c.name })),
        );
      } catch (err) {
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading("fetchOptions", false);
      }
    };
    fetchOptions();
  }, []);

  // Sync formData with selected item and fetch episode links
  useEffect(() => {
    const syncData = async () => {
      if (!selectedId || selectedId === "") {
        dispatchFormData({
          type: "RESET",
          payload: {
            id: "",
            title: "",
            titleByLanguage: "",
            status: "",
            totalEpisodes: "",
            director: "",
            actors: [""],
            duration: "",
            quality: "",
            vietSub: "",
            description: "",
            release_year: 2000,
            movieTypeIds: [],
            categoryIds: [],
            countryId: null,
            hot: "",
            thumb_url: "",
            trailer: "",
            link: "",
            episodeLinks: [],
          },
        });
        setEpisodeLinks([]);
        setThumbnailData({ type: "url", value: "" });
        return;
      }
      setLoading("loadMovie", true, "Đang tải thông tin phim...");
      // selectedId is now UUID string, no need to parse
      const item = items.find((item) => item.id === selectedId);
      if (!item) {
        setSelectedId("");
        dispatchFormData({
          type: "RESET",
          payload: {
            id: "",
            title: "",
            titleByLanguage: "",
            status: "",
            totalEpisodes: "",
            director: "",
            actors: [""],
            duration: "",
            quality: "",
            vietSub: "",
            description: "",
            release_year: 2000,
            movieTypeIds: [],
            categoryIds: [],
            countryId: null,
            hot: "",
            thumb_url: "",
            trailer: "",
            link: "",
            episodeLinks: [],
          },
        });
        setEpisodeLinks([]);
        setThumbnailData({ type: "url", value: "" });
        setLoading("loadMovie", false);
        return;
      }
      if (item) {
        const movieTypeIds = Array.isArray(item.movieTypes)
          ? item.movieTypes.map((t) => t.id || t.movie_type_id).filter(Boolean)
          : [];
        const categoryIds = Array.isArray(item.movieCategories)
          ? item.movieCategories
              .map((c) => c.id || c.category_id)
              .filter(Boolean)
          : [];
        const newFormData = {
          id: item.id || "",
          title: item.title || "",
          titleByLanguage: item.titleByLanguage || "",
          status: item.status || "",
          totalEpisodes: item.totalEpisodes || "",
          director: item.director || "",
          actors: item.actorsSet
            ? Array.isArray(item.actorsSet)
              ? item.actorsSet
              : Array.from(item.actorsSet)
            : item.actors
              ? Array.isArray(item.actors)
                ? item.actors
                : [item.actors]
              : [""],
          duration: item.duration || "",
          quality: item.quality || "",
          vietSub: item.vietSub ? "true" : "false",
          description: item.description || "",
          release_year: item.release_year || 2000,
          movieTypeIds: movieTypeIds,
          categoryIds: categoryIds,
          countryId: item.country ? item.country.id : null,
          hot: item.hot ? "true" : "false",
          thumb_url: item.thumb_url || "",
          banner_url: item.banner_url || "",
          ageRating: item.ageRating || "",
          trailer: item.trailer || "",
          link: item.link || "",
          episodeLinks: [], // Will be set after fetching episodes
        };
        dispatchFormData({ type: "RESET", payload: newFormData });
        setThumbnailData({ type: "url", value: item.thumb_url || "" });
        setBannerData({ type: "url", value: item.banner_url || "" });

        // Set episodes from the movie data
        const episodes = item.episodes || [];
        const episodeLinks = episodes.map((ep) => ep.link || "");
        setEpisodeLinks(episodeLinks);
        if (episodeLinks.length > 0) {
          dispatchFormData({
            type: "UPDATE_FIELD",
            field: "totalEpisodes",
            value: episodeLinks.length.toString(),
          });
          dispatchFormData({
            type: "UPDATE_FIELD",
            field: "episodeLinks",
            value: episodeLinks,
          });
        }
      } else {
        dispatchFormData({
          type: "RESET",
          payload: {
            id: "",
            title: "",
            titleByLanguage: "",
            status: "",
            totalEpisodes: "",
            director: "",
            actors: [""],
            duration: "",
            quality: "",
            vietSub: "",
            description: "",
            release_year: 2000,
            movieTypeIds: [],
            categoryIds: [],
            countryId: null,
            hot: "",
            thumb_url: "",
            banner_url: "",
            ageRating: "",
            trailer: "",
            link: "",
            episodeLinks: [],
          },
        });
        setEpisodeLinks([]);
      }
      setLoading("loadMovie", false);
    };
    syncData();
  }, [selectedId, items]);

  // Memoize isFullStatus to avoid recalculating on every render
  const isFullStatus = useMemo(
    () => (formData.status || "").toLowerCase() === "full",
    [formData.status],
  );

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "totalEpisodes") {
      const totalEpisodes = parseInt(value);
      if (!isNaN(totalEpisodes) && totalEpisodes > 0 && !isFullStatus) {
        dispatchFormData({
          type: "UPDATE_FIELD",
          field: "episodeLinks",
          value: Array(totalEpisodes).fill(""),
        });
        setEpisodeLinks(Array(totalEpisodes).fill(""));
        dispatchFormData({
          type: "UPDATE_FIELD",
          field: "link",
          value: "",
        });
      } else {
        dispatchFormData({
          type: "UPDATE_FIELD",
          field: "episodeLinks",
          value: [],
        });
        setEpisodeLinks([]);
      }
    } else if (name === "status") {
      if (value.toLowerCase() === "full") {
        dispatchFormData({
          type: "UPDATE_FIELD",
          field: "totalEpisodes",
          value: "",
        });
        dispatchFormData({
          type: "UPDATE_FIELD",
          field: "episodeLinks",
          value: [],
        });
        setEpisodeLinks([]);
      }
    }
    dispatchFormData({ type: "UPDATE_FIELD", field: name, value });
  };

  const handleActorChange = (index, e) => {
    dispatchFormData({
      type: "UPDATE_ACTOR",
      index,
      value: e.target.value,
    });
  };

  const addActor = () => {
    dispatchFormData({ type: "ADD_ACTOR" });
  };

  const handleEpisodeLinkChange = (index, e) => {
    dispatchFormData({
      type: "UPDATE_EPISODE_LINK",
      index,
      value: e.target.value,
    });
    const newEpisodeLinks = [...formData.episodeLinks];
    newEpisodeLinks[index] = e.target.value;
    setEpisodeLinks(newEpisodeLinks);
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    dispatchFormData({
      type: "UPDATE_FIELD",
      field: "description",
      value: data,
    });
  };

  const handleSelectChange = (name, selectedOptions) => {
    dispatchFormData({
      type: "UPDATE_FIELD",
      field: name,
      value: selectedOptions
        ? Array.isArray(selectedOptions)
          ? selectedOptions.map((o) => o.value)
          : selectedOptions.value
        : name === "countryId"
          ? null
          : [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      toast.error("Vui lòng chọn một phim để cập nhật.");
      return;
    }
    setLoading("submitMovie", true, "Đang cập nhật phim...");
    try {
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("director", formData.director);
      formDataToSend.append("duration", parseInt(formData.duration) || 0);
      formDataToSend.append("hot", formData.hot === "true");
      formDataToSend.append("link", isFullStatus ? formData.link : "");
      formDataToSend.append("quality", formData.quality);
      formDataToSend.append(
        "release_year",
        parseInt(formData.release_year) || 2000,
      );
      formDataToSend.append("status", formData.status);
      formDataToSend.append("titleByLanguage", formData.titleByLanguage);
      formDataToSend.append("trailer", formData.trailer);
      formDataToSend.append("vietSub", formData.vietSub === "true");

      // Handle totalEpisodes
      if (
        !isFullStatus &&
        formData.totalEpisodes &&
        formData.totalEpisodes.trim() !== ""
      ) {
        formDataToSend.append(
          "totalEpisodes",
          parseInt(formData.totalEpisodes),
        );
      }

      // Handle thumbnail
      if (thumbnailData.type === "url" && thumbnailData.value) {
        formDataToSend.append("thumb_url", thumbnailData.value);
      } else if (thumbnailData.type === "file" && thumbnailData.value) {
        formDataToSend.append("thumbnailFile", thumbnailData.value);
      }

      // Handle banner
      if (bannerData.type === "url" && bannerData.value) {
        formDataToSend.append("banner_url", bannerData.value);
      } else if (bannerData.type === "file" && bannerData.value) {
        formDataToSend.append("bannerFile", bannerData.value);
      }

      // Handle age rating
      if (formData.ageRating && formData.ageRating.trim() !== "") {
        formDataToSend.append("ageRating", formData.ageRating);
      }

      // Handle actors
      const filteredActors = formData.actors.filter((actor) => actor.trim());
      filteredActors.forEach((actor) => formDataToSend.append("actors", actor));

      // Handle episode links
      if (
        !isFullStatus &&
        formData.episodeLinks &&
        formData.episodeLinks.length > 0
      ) {
        const filteredEpisodeLinks = formData.episodeLinks.filter((link) =>
          link.trim(),
        );
        filteredEpisodeLinks.forEach((link) =>
          formDataToSend.append("episodeLinks", link),
        );
      }

      // Handle country, movie types, and categories
      if (formData.countryId) {
        formDataToSend.append("countryId", formData.countryId);
      }
      formData.movieTypeIds.forEach((id) =>
        formDataToSend.append("movieTypeIds", id),
      );
      formData.categoryIds.forEach((id) =>
        formDataToSend.append("categoryIds", id),
      );
      for (let [key, value] of formDataToSend.entries()) {
      }

      const response = await fetchJson(`${updateEndpoint}/${formData.id}`, {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
      });
      toast.success(`${title} đã được cập nhật`);
      navigate(`/admin/movies`);
    } catch (error) {
      toast.error(error.response?.data || `Lỗi khi cập nhật ${title}`);
    } finally {
      setLoading("submitMovie", false);
    }
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return Object.keys(formData).some(
      (key) => formData[key] !== "" && formData[key] != null,
    );
  }, [formData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chỉnh sửa {title}</h1>
      <LoadingWrapper
        isLoading={isLoading("fetchOptions") || isLoading("loadMovie")}
        skeleton={FormSkeleton}
      >
        <>
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isLoading("submitMovie")}
            className="w-full p-2 mb-4 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Chọn {title}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title || item.name || item.username}
              </option>
            ))}
          </select>
          {selectedId && (
            <form onSubmit={handleSubmit} method="PUT" className="space-y-4">
              <input type="hidden" name="id" value={formData.id} />
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Tiêu đề:
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label
                  htmlFor="titleByLanguage"
                  className="block text-sm font-medium"
                >
                  Tiêu đề (Tiếng Anh/...):
                </label>
                <input
                  type="text"
                  name="titleByLanguage"
                  value={formData.titleByLanguage}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium">
                  Trạng thái:
                </label>
                <input
                  type="text"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              {!isFullStatus && (
                <div>
                  <label
                    htmlFor="totalEpisodes"
                    className="block text-sm font-medium"
                  >
                    Số tập:
                  </label>
                  <input
                    type="number"
                    name="totalEpisodes"
                    value={formData.totalEpisodes || ""}
                    onChange={handleChange}
                    min="1"
                    disabled={isLoading("submitMovie")}
                    className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {formData.episodeLinks.length > 0 && (
                    <div className="space-y-2">
                      {formData.episodeLinks.map((link, index) => (
                        <div key={index} className="flex space-x-4">
                          <label className="block text-sm font-medium">
                            Tập {index + 1}:
                          </label>
                          <input
                            type="text"
                            value={link || ""}
                            onChange={(e) => handleEpisodeLinkChange(index, e)}
                            placeholder={`Link cho tập ${index + 1}`}
                            disabled={isLoading("submitMovie")}
                            className="flex-1 p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {isFullStatus && (
                <div>
                  <label htmlFor="link" className="block text-sm font-medium">
                    Đường dẫn (phát chính):
                  </label>
                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    disabled={isLoading("submitMovie")}
                    className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label htmlFor="director" className="block text-sm font-medium">
                  Đạo diễn:
                </label>
                <input
                  type="text"
                  name="director"
                  value={formData.director}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Diễn viên:</label>
                <div id="actors" className="space-y-2">
                  {formData.actors.map((actor, index) => (
                    <input
                      key={index}
                      type="text"
                      value={actor}
                      onChange={(e) => handleActorChange(index, e)}
                      disabled={isLoading("submitMovie")}
                      className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addActor}
                  disabled={isLoading("submitMovie")}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Thêm diễn viên
                </button>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium">
                  Thời lượng (phút):
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="quality" className="block text-sm font-medium">
                  Chất lượng:
                </label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn chất lượng</option>
                  <option value="SD">SD</option>
                  <option value="HD">HD</option>
                  <option value="FULL_HD">Full HD</option>
                  <option value="_4K">4K</option>
                </select>
              </div>
              <div>
                <label htmlFor="vietSub" className="block text-sm font-medium">
                  Vietsub:
                </label>
                <select
                  name="vietSub"
                  value={formData.vietSub}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                >
                  Mô tả:
                </label>
                <div
                  className={
                    isLoading("submitMovie")
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                >
                  <CKEditor
                    name="description"
                    editor={ClassicEditor}
                    data={formData.description}
                    onChange={handleEditorChange}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="release_year"
                  className="block text-sm font-medium"
                >
                  Năm phát hành:
                </label>
                <input
                  type="number"
                  name="release_year"
                  value={formData.release_year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label
                  htmlFor="movieTypes"
                  className="block text-sm font-medium"
                >
                  Thể loại:
                </label>
                <Select
                  isMulti
                  name="movieTypeIds"
                  options={movieTypes}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("movieTypeIds", selected)
                  }
                  value={
                    movieTypes.filter((opt) =>
                      formData.movieTypeIds.includes(opt.value),
                    ) || []
                  }
                  isdisabled={isLoading("submitMovie")}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium">
                  Danh mục:
                </label>
                <Select
                  isMulti
                  name="categoryIds"
                  options={categories}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("categoryIds", selected)
                  }
                  value={
                    categories.filter((opt) =>
                      formData.categoryIds.includes(opt.value),
                    ) || []
                  }
                  isdisabled={isLoading("submitMovie")}
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium">
                  Quốc gia:
                </label>
                <Select
                  name="countryId"
                  options={countries}
                  className="basic-single-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("countryId", selected)
                  }
                  value={
                    countries.find((opt) => opt.value === formData.countryId) ||
                    null
                  }
                  isdisabled={isLoading("submitMovie")}
                />
              </div>
              <div>
                <label htmlFor="hot" className="block text-sm font-medium">
                  Phim hot:
                </label>
                <select
                  name="hot"
                  value={formData.hot}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
              <ImageUpload
                onImageChange={setThumbnailData}
                currentImageUrl={
                  thumbnailData.type === "url" ? thumbnailData.value : ""
                }
                label="Ảnh bìa (Thumbnail):"
                radioName="thumbnailUploadType"
                className={
                  isLoading("submitMovie")
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />

              <ImageUpload
                onImageChange={setBannerData}
                currentImageUrl={
                  bannerData.type === "url" ? bannerData.value : ""
                }
                label="Ảnh banner (Ảnh lớn nằm ngang cho header trang chủ & chi tiết phim):"
                radioName="bannerUploadType"
                className={
                  isLoading("submitMovie")
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />

              <div>
                <label
                  htmlFor="ageRating"
                  className="block text-sm font-medium"
                >
                  Độ tuổi phù hợp:
                </label>
                <select
                  id="ageRating"
                  name="ageRating"
                  value={formData.ageRating || ""}
                  onChange={(e) =>
                    dispatchFormData({
                      type: "UPDATE_FIELD",
                      field: "ageRating",
                      value: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={isLoading("submitMovie")}
                >
                  <option value="">Chọn độ tuổi</option>
                  <option value="P">P - Phù hợp mọi lứa tuổi</option>
                  <option value="T7">T7 - Từ 7 tuổi trở lên</option>
                  <option value="T13">T13 - Từ 13 tuổi trở lên</option>
                  <option value="T16">T16 - Từ 16 tuổi trở lên</option>
                  <option value="T18">T18 - Từ 18 tuổi trở lên</option>
                </select>
              </div>
              <div>
                <label htmlFor="trailer" className="block text-sm font-medium">
                  Đường dẫn (trailer):
                </label>
                <input
                  type="text"
                  name="trailer"
                  value={formData.trailer}
                  onChange={handleChange}
                  disabled={isLoading("submitMovie")}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-red-700 rounded text-white"
                  disabled={isLoading("submitMovie")}
                  onClick={() => {
                    if (hasChanges) {
                      if (
                        window.confirm("Bạn có muốn lưu các thay đổi không?")
                      ) {
                        handleSubmit(new Event("submit"));
                      } else {
                        navigate(-1);
                      }
                    } else {
                      navigate(-1);
                    }
                  }}
                >
                  Hủy
                </button>
                <button
                  type="reset"
                  className="px-4 py-2 bg-green-400 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={isLoading("submitMovie")}
                  onClick={() => {
                    dispatchFormData({
                      type: "RESET",
                      payload: {
                        id: formData.id,
                        title: "",
                        titleByLanguage: "",
                        status: "",
                        totalEpisodes: "",
                        director: "",
                        actors: [""],
                        duration: "",
                        quality: "",
                        vietSub: "",
                        description: "",
                        release_year: 2000,
                        movieTypeIds: [],
                        categoryIds: [],
                        countryId: null,
                        hot: "",
                        thumb_url: "",
                        trailer: "",
                        link: "",
                        episodeLinks: [],
                      },
                    });
                    setEpisodeLinks([]);
                    setThumbnailData({ type: "url", value: "" });
                  }}
                >
                  Làm mới
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!hasChanges) {
                      toast.error("Không có thay đổi nào để cập nhật.");
                      e.preventDefault();
                      return;
                    }
                    if (
                      window.confirm(
                        `Bạn có chắc chắn muốn cập nhật ${title} này không?`,
                      )
                    ) {
                      handleSubmit(e);
                    } else {
                      e.preventDefault();
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isLoading("submitMovie")}
                >
                  {isLoading("submitMovie") ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          )}
        </>
      </LoadingWrapper>
    </div>
  );
};

export default UpdateMovie;
