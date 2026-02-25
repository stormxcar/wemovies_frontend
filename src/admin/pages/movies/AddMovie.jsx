import React, { useState, useEffect } from "react";
import Select from "react-select";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import {
  fetchMovieType as getTypes,
  fetchCategories as getCategories,
  fetchCountries as getCountries,
  fetchJson,
} from "../../../services/api";
import api from "../../../services/api";
import ImageUpload from "../../../components/ui/ImageUpload";

const AddMovie = () => {
  const navigate = useNavigate();

  // Set document title for add movie page
  useDocumentTitle("Thêm phim mới", "Admin");

  // Initialize form data state
  const [formData, setFormData] = useState({
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
    movieTypeIds: [], // Initialized as empty array
    categoryIds: [], // Initialized as empty array
    countryId: null, // Initialized as null for single select
    hot: "",
    trailer: "",
    link: "",
    episodeLinks: null,
    ageRating: "", // Age rating field
  });
  const [thumbnailData, setThumbnailData] = useState({
    type: "url",
    value: "",
  });
  const [bannerData, setBannerData] = useState({
    type: "url",
    value: "",
  });
  const [movieTypes, setMovieTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
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
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Select changes
  const handleSelectChange = (name, selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOptions
        ? Array.isArray(selectedOptions)
          ? selectedOptions.map((o) => o.value)
          : selectedOptions.value
        : name === "countryId"
          ? null
          : [],
    }));
  };

  // Handle actor input changes
  const handleActorChange = (index, e) => {
    const newActors = [...formData.actors];
    newActors[index] = e.target.value;
    setFormData((prev) => ({ ...prev, actors: newActors }));
  };

  // Add new actor input
  const addActor = () => {
    setFormData((prev) => ({ ...prev, actors: [...prev.actors, ""] }));
  };

  // Handle CKEditor change
  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData((prev) => ({ ...prev, description: data }));
  };

  // Handle episode links based on totalEpisodes and status
  useEffect(() => {
    const totalEpisodes = parseInt(formData.totalEpisodes);
    if (formData.status.toLowerCase() === "full") {
      setFormData((prev) => ({
        ...prev,
        totalEpisodes: "",
        episodeLinks: null,
        link: prev.link || "",
      }));
    } else if (!isNaN(totalEpisodes) && totalEpisodes > 0) {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: Array(totalEpisodes).fill(""),
        link: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: null,
        link: prev.link || "",
      }));
    }
  }, [formData.totalEpisodes, formData.status]);

  // Handle episode link changes
  const handleEpisodeLinkChange = (index, e) => {
    const newEpisodeLinks = [...(formData.episodeLinks || [])];
    newEpisodeLinks[index] = e.target.value;
    setFormData((prev) => ({ ...prev, episodeLinks: newEpisodeLinks }));
  };

  // Function to strip HTML tags from description
  const stripHtmlTags = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description); // Keep HTML for backend to handle
      formDataToSend.append("director", formData.director);
      formDataToSend.append("duration", parseInt(formData.duration) || 0);
      formDataToSend.append(
        "hot",
        formData.hot === "true" || formData.hot === true,
      );
      formDataToSend.append("link", formData.link);
      formDataToSend.append("quality", formData.quality);
      formDataToSend.append(
        "release_year",
        parseInt(formData.release_year) || 2000,
      );
      formDataToSend.append("status", formData.status);
      formDataToSend.append("titleByLanguage", formData.titleByLanguage);
      formDataToSend.append("trailer", formData.trailer);
      formDataToSend.append(
        "vietSub",
        formData.vietSub === "true" || formData.vietSub === true,
      );

      // Handle totalEpisodes
      if (formData.totalEpisodes && formData.totalEpisodes.trim() !== "") {
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
      if (filteredActors.length === 0) {
        formDataToSend.append("actors", ""); // Send at least one empty actor
      } else {
        filteredActors.forEach((actor) =>
          formDataToSend.append("actors", actor),
        );
      }

      // Handle episode links
      if (formData.episodeLinks && formData.episodeLinks.length > 0) {
        formData.episodeLinks
          .filter((link) => link.trim())
          .forEach((link) => formDataToSend.append("episodeLinks", link));
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

      const response = await api.post("/api/movies/add", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Phim đã được thêm thành công!");
      setLoading(false);
      setError(null);
      // Reset form and navigate
      setFormData({
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
        trailer: "",
        link: "",
        episodeLinks: null,
        ageRating: "",
      });
      setThumbnailData({ type: "url", value: "" });
      setBannerData({ type: "url", value: "" });
      navigate("/admin/movies");
    } catch (err) {
      setError(err.message || "Lỗi khi thêm phim. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm phim mới</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} method="POST" className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Tiêu đề:
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
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
            id="titleByLanguage"
            name="titleByLanguage"
            value={formData.titleByLanguage}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Trạng thái:
          </label>
          <input
            type="text"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="totalEpisodes" className="block text-sm font-medium">
            Số tập:
          </label>
          <input
            type="number"
            id="totalEpisodes"
            name="totalEpisodes"
            value={formData.totalEpisodes}
            onChange={handleChange}
            min="1"
            disabled={loading || formData.status.toLowerCase() === "full"}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="director" className="block text-sm font-medium">
            Đạo diễn:
          </label>
          <input
            type="text"
            id="director"
            name="director"
            value={formData.director}
            onChange={handleChange}
            disabled={loading}
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
                disabled={loading}
                className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addActor}
            disabled={loading}
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
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="quality" className="block text-sm font-medium">
            Chất lượng:
          </label>
          <select
            id="quality"
            name="quality"
            value={formData.quality}
            onChange={handleChange}
            disabled={loading}
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
            id="vietSub"
            name="vietSub"
            value={formData.vietSub}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Chọn</option>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Mô tả:
          </label>
          <div className={loading ? "pointer-events-none opacity-50" : ""}>
            <CKEditor
              editor={ClassicEditor}
              data={formData.description}
              onChange={handleEditorChange}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="release_year" className="block text-sm font-medium">
            Năm phát hành:
          </label>
          <input
            type="number"
            id="release_year"
            name="release_year"
            value={formData.release_year}
            onChange={handleChange}
            min="1900"
            max="2100"
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="movieTypes" className="block text-sm font-medium">
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
            isDisabled={loading}
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
            onChange={(selected) => handleSelectChange("categoryIds", selected)}
            value={
              categories.filter((opt) =>
                formData.categoryIds.includes(opt.value),
              ) || []
            }
            isDisabled={loading}
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
            onChange={(selected) => handleSelectChange("countryId", selected)}
            value={
              countries.find((opt) => opt.value === formData.countryId) || null
            }
            isDisabled={loading}
          />
        </div>
        <div>
          <label htmlFor="hot" className="block text-sm font-medium">
            Phim hot:
          </label>
          <select
            id="hot"
            name="hot"
            value={formData.hot}
            onChange={handleChange}
            disabled={loading}
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
          className={loading ? "pointer-events-none opacity-50" : ""}
        />

        <ImageUpload
          onImageChange={setBannerData}
          currentImageUrl={bannerData.type === "url" ? bannerData.value : ""}
          label="Ảnh banner (Ảnh lớn nằm ngang cho header trang chủ & chi tiết phim):"
          radioName="bannerUploadType"
          className={loading ? "pointer-events-none opacity-50" : ""}
        />

        <div>
          <label htmlFor="ageRating" className="block text-sm font-medium">
            Độ tuổi phù hợp:
          </label>
          <select
            id="ageRating"
            name="ageRating"
            value={formData.ageRating}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={loading}
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
            id="trailer"
            name="trailer"
            value={formData.trailer}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="link" className="block text-sm font-medium">
            Đường dẫn (phát chính):
          </label>
          <input
            type="text"
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            disabled={
              loading ||
              (formData.episodeLinks && formData.episodeLinks.length > 0)
            }
            className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        {formData.episodeLinks && formData.episodeLinks.length > 0 && (
          <div>
            <label className="block text-sm font-medium">
              Đường dẫn các tập:
            </label>
            {formData.episodeLinks.map((link, index) => (
              <div key={index} className="form-group flex space-x-4">
                <label
                  htmlFor={`episodeNumber${index + 1}`}
                  className="block text-sm font-medium"
                >
                  Tập {index + 1}:
                </label>
                <input
                  type="text"
                  id={`episodeNumber${index + 1}`}
                  value={index + 1} // Auto-set episode number
                  readOnly
                  className="w-16 p-2 border rounded"
                />
                <input
                  type="text"
                  id={`episodeLink${index + 1}`}
                  value={link}
                  onChange={(e) => handleEpisodeLinkChange(index, e)}
                  required
                  disabled={loading}
                  className="flex-1 p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Đang thêm..." : "Thêm"}
        </button>
      </form>
    </div>
  );
};

export default AddMovie;
